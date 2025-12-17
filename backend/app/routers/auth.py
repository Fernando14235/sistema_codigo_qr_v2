from datetime import timedelta, datetime
import pytz
from app.core.config import settings
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import Usuario, RefreshToken
from app.schemas.auth_schema import Token, LoginResponse, RefreshRequest, RefreshResponse
from app.services.refresh_token_service import RefreshTokenService
from app.utils.security import (
    verify_password,
    create_access_token,
    get_current_user,
    verify_role
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_username(usuario):
    return usuario.nombre or usuario.email or f"ID {usuario.id}"

# ===== ENDPOINTS =====
@router.post("/token", response_model=LoginResponse)
def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    ult_conexion_anterior = user.ult_conexion
    
    # Actualizar la última conexión del usuario
    honduras_tz = pytz.timezone('America/Tegucigalpa')
    user.ult_conexion = datetime.now(honduras_tz)
    db.commit()

    # Crear access token
    token_data = {"sub": user.email, 
                  "rol": user.rol,
                  "usuario_id": user.id,
                  "residencial_id": user.residencial_id}
    access_token = create_access_token(token_data)
    
    # Crear refresh token en DB
    device_info = request.headers.get("User-Agent", "Unknown Device")
    refresh_token_plain, refresh_token_db = RefreshTokenService.create_refresh_token(
        db=db,
        usuario_id=user.id,
        device_info=device_info
    )
    
    # Configurar cookie HttpOnly para el refresh token con seguridad mejorada
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_plain,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # En segundos
        httponly=True,  # Protección contra XSS
        secure=settings.ENVIRONMENT == "production",  # Solo HTTPS en producción
        samesite="strict" if settings.ENVIRONMENT == "production" else "lax",  # Protección CSRF
        path="/"  # Disponible para toda la aplicación
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        usuario=user.email,
        rol=user.rol,
        residencial_id=user.residencial_id,
        ult_conexion=ult_conexion_anterior.isoformat() if ult_conexion_anterior else None
    )

@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db), 
    usuario_actual: Usuario = Depends(get_current_user)
):
    """
    Cerrar sesión: revocar refresh token y limpiar cookie
    """
    if not usuario_actual:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Obtener refresh token de la cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        # Revocar el refresh token específico
        RefreshTokenService.revoke_refresh_token(db, refresh_token)
    
    # Limpiar cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="strict" if settings.ENVIRONMENT == "production" else "lax",
        path="/"
    )
    
    # Establecer la zona horaria de Honduras
    honduras_tz = pytz.timezone('America/Tegucigalpa')
    usuario_actual.ult_conexion = datetime.now(honduras_tz)
    db.commit()
    
    return {"mensaje": "Cierre de sesión exitoso."}

@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    """
    Renovar access token usando refresh token de la cookie
    """
    # Obtener refresh token de la cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=401, 
            detail="No se encontró refresh token en las cookies"
        )
    
    # Validar refresh token en la base de datos
    refresh_token_db = RefreshTokenService.validate_refresh_token(db, refresh_token)
    
    if not refresh_token_db:
        raise HTTPException(
            status_code=401, 
            detail="Refresh token inválido, expirado o revocado"
        )
    
    # Obtener usuario asociado
    usuario = db.query(Usuario).filter(Usuario.id == refresh_token_db.usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=401, 
            detail="Usuario asociado al token no encontrado"
        )
    
    # Crear nuevo access token
    token_data = {
        "sub": usuario.email, 
        "rol": usuario.rol,
        "usuario_id": usuario.id,
        "residencial_id": usuario.residencial_id
    }
    
    new_access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return RefreshResponse(
        access_token=new_access_token,
        token_type="bearer"
    )

@router.get("/secure", response_model=dict)
def secure_endpoint(usuario_actual=Depends(get_current_user)):
    return {
        "mensaje": f"Acceso autorizado para {usuario_actual.rol}",
        "usuario": get_username(usuario_actual),
        "rol": usuario_actual.rol
    }
    
@router.get("/admin", response_model=dict)
def admin_endpoint(usuario_actual=Depends(verify_role(["admin"]))):
    return {
        "mensaje": f"Acceso autorizado para {usuario_actual.rol}",
        "usuario": get_username(usuario_actual),
        "rol": usuario_actual.rol
    }
    
@router.get("/guardia", response_model=dict)
def guardia_endpoint(usuario_actual=Depends(verify_role(["admin", "guardia"]))):
    return {
        "mensaje": f"Acceso autorizado para {usuario_actual.rol}",
        "usuario": get_username(usuario_actual),
        "rol": usuario_actual.rol
    }
    
@router.get("/residente", response_model=dict)
def residente_endpoint(usuario_actual=Depends(verify_role(["admin", "residente"]))):
    return {
        "mensaje": f"Acceso autorizado para {usuario_actual.rol}",
        "usuario": get_username(usuario_actual),
        "rol": usuario_actual.rol
    }

@router.get("/test-system")
def test_complete_system(db: Session = Depends(get_db)):
    """Endpoint de prueba completo para verificar todo el sistema de tokens"""
    try:
        # Verificar tablas
        refresh_result = db.execute(text("SELECT COUNT(*) FROM refresh_tokens"))
        refresh_count = refresh_result.scalar()
        
        users_result = db.execute(text("SELECT COUNT(*) FROM usuarios"))
        users_count = users_result.scalar()
        
        # Verificar configuración
        access_expire = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        refresh_expire = settings.REFRESH_TOKEN_EXPIRE_DAYS
        
        # Verificar que las funciones de token funcionen
        test_token_data = {
            "sub": "test@example.com",
            "rol": "admin", 
            "usuario_id": 1,
            "residencial_id": 1
        }
        
        # Crear token de prueba
        test_access_token = create_access_token(test_token_data)
        
        # Verificar que se puede decodificar
        from jose import jwt
        decoded = jwt.decode(test_access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        return {
            "status": "success",
            "message": "Sistema completo funcionando correctamente",
            "database": {
                "refresh_tokens_count": refresh_count,
                "users_count": users_count,
                "tables_exist": True
            },
            "configuration": {
                "access_token_expire_minutes": access_expire,
                "refresh_token_expire_days": refresh_expire,
                "algorithm": settings.ALGORITHM
            },
            "token_system": {
                "access_token_creation": "OK",
                "token_decode": "OK",
                "decoded_payload": {
                    "usuario_id": decoded.get("usuario_id"),
                    "rol": decoded.get("rol"),
                    "type": decoded.get("type")
                }
            },
            "system_ready": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "system_ready": False,
            "error_type": str(type(e).__name__)
        }

@router.post("/test-login")
def test_login_endpoint(
    response: Response,
    request: Request,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """Endpoint de prueba para login sin form data"""
    try:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if not user:
            return {"error": "Usuario no encontrado", "email_provided": email}
        
        if not verify_password(password, user.password_hash):
            return {"error": "Contraseña incorrecta"}
        
        # Crear access token
        token_data = {"sub": user.email, 
                      "rol": user.rol,
                      "usuario_id": user.id,
                      "residencial_id": user.residencial_id}
        access_token = create_access_token(token_data)
        
        # Crear refresh token en DB
        device_info = request.headers.get("User-Agent", "Test Device")
        refresh_token_plain, refresh_token_db = RefreshTokenService.create_refresh_token(
            db=db,
            usuario_id=user.id,
            device_info=device_info
        )
        
        # Configurar cookie HttpOnly para el refresh token
        response.set_cookie(
            key="refresh_token",
            value=refresh_token_plain,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=False,  # False para desarrollo
            samesite="lax"
        )
        
        return {
            "status": "success",
            "access_token": access_token,
            "token_type": "bearer",
            "usuario": user.email,
            "rol": user.rol,
            "residencial_id": user.residencial_id,
            "refresh_token_created": True,
            "refresh_token_id": refresh_token_db.id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "traceback": str(e.__class__.__name__)
        }

@router.get("/test-token-flow")
def test_token_flow(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    """Endpoint para probar que el flujo completo de tokens funcione"""
    try:
        # Verificar que el usuario actual se obtuvo correctamente
        active_tokens = RefreshTokenService.get_user_active_tokens(db, usuario_actual.id)
        
        return {
            "status": "success",
            "message": "Flujo de tokens funcionando correctamente",
            "user_info": {
                "id": usuario_actual.id,
                "email": usuario_actual.email,
                "rol": usuario_actual.rol,
                "residencial_id": usuario_actual.residencial_id
            },
            "token_info": {
                "active_refresh_tokens": len(active_tokens),
                "tokens_details": [
                    {
                        "id": token.id,
                        "created_at": token.created_at.isoformat(),
                        "expires_at": token.expires_at.isoformat(),
                        "device_info": token.device_info,
                        "is_valid": token.is_valid()
                    }
                    for token in active_tokens
                ]
            },
            "access_token_working": True,
            "refresh_tokens_working": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "access_token_working": False
        }

@router.get("/sessions")
def get_active_sessions(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    """
    Obtener todas las sesiones activas del usuario actual
    """
    active_tokens = RefreshTokenService.get_user_active_tokens(db, usuario_actual.id)
    
    sessions = []
    for token in active_tokens:
        sessions.append({
            "id": token.id,
            "created_at": token.created_at,
            "expires_at": token.expires_at,
            "device_info": token.device_info or "Dispositivo desconocido"
        })
    
    return {"sessions": sessions}

@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    """
    Revocar una sesión específica del usuario actual
    """
    success = RefreshTokenService.revoke_token_by_id(db, session_id, usuario_actual.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Sesión no encontrada o ya revocada"
        )
    
    return {"mensaje": "Sesión revocada exitosamente"}

@router.delete("/sessions/all")
def revoke_all_sessions(
    response: Response,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    """
    Revocar todas las sesiones del usuario actual
    """
    revoked_count = RefreshTokenService.revoke_all_user_tokens(db, usuario_actual.id)
    
    # Limpiar cookie actual también
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="strict" if settings.ENVIRONMENT == "production" else "lax",
        path="/"
    )
    
    return {
        "mensaje": f"Se revocaron {revoked_count} sesiones exitosamente",
        "revoked_sessions": revoked_count
    }

# Endpoints de administración (solo super_admin)
@router.post("/admin/cleanup-tokens")
def cleanup_expired_tokens(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["super_admin"]))
):
    """
    Limpiar tokens expirados manualmente (solo super_admin)
    """
    deleted_count = RefreshTokenService.cleanup_expired_tokens(db)
    
    return {
        "mensaje": f"Limpieza completada: {deleted_count} tokens expirados eliminados",
        "deleted_tokens": deleted_count
    }

@router.delete("/admin/revoke-user-sessions/{usuario_id}")
def admin_revoke_user_sessions(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["super_admin"]))
):
    """
    Revocar todas las sesiones de un usuario específico (solo super_admin)
    """
    # Verificar que el usuario existe
    target_user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    revoked_count = RefreshTokenService.revoke_all_user_tokens(db, usuario_id)
    
    return {
        "mensaje": f"Se revocaron {revoked_count} sesiones del usuario {target_user.email}",
        "revoked_sessions": revoked_count,
        "target_user": target_user.email
    }
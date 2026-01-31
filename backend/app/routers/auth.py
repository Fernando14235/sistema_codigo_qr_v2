from datetime import timedelta, datetime
import pytz
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import Usuario
from app.schemas.auth_schema import LoginResponse, RefreshResponse
from app.services.refresh_token_service import RefreshTokenService
from app.utils.security import (
    verify_password,
    create_access_token,
    get_current_user,
    verify_role,
    get_password_hash
)
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Autenticación"])
is_production = settings.ENVIRONMENT == "production"

# Setear una cookie
cookie_config = {
    "key": "refresh_token",
    "httponly": True,
    "secure": True if is_production else False, #False en localhost
    "samesite": "lax" if is_production else "none", #"none" en localhost
    "path": "/",
    "domain": ".tekhnosupport.com" # None en localhost
}

# Eliminar una cookie
def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key="refresh_token",
        path="/",
        domain=".tekhnosupport.com" if is_production else None
    )

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

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
    
    # Configurar cookie HttpOnly para que el refresh token cuente con seguridad mejorada
    response.set_cookie(
        **cookie_config,
        value=refresh_token_plain,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # En segundos
        
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
        RefreshTokenService.revoke_refresh_token(db, refresh_token)
    
    # Limpiar cookie
    clear_refresh_cookie(response)
    
    # Establecer la zona horaria de Honduras
    usuario_actual.ult_conexion = datetime.now(pytz.timezone('America/Tegucigalpa'))
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
            status_code=403,  # 403 Forbidden para token faltante
            detail="Refresh token no encontrado en cookies. Por favor inicia sesión nuevamente."
        )
    
    # Validar refresh token en la base de datos
    refresh_token_db = RefreshTokenService.validate_refresh_token(db, refresh_token)
    
    if not refresh_token_db:
        raise HTTPException(
            status_code=401,  # 401 Unauthorized para token inválido/expirado
            detail="Refresh token inválido o expirado. Por favor inicia sesión nuevamente."
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
            **cookie_config,
            value=refresh_token_plain,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            
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
    #Obtener todas las sesiones activas del usuario actual
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
    #Revocar una sesión específica del usuario actual
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
    #Revocar todas las sesiones del usuario actual
    revoked_count = RefreshTokenService.revoke_all_user_tokens(db, usuario_actual.id)
    
    # Limpiar cookie actual también
    clear_refresh_cookie(response)
    
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
    #Limpiar tokens expirados manualmente (solo super_admin)
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
    #Revocar todas las sesiones de un usuario específico (solo super_admin)
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

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    # Cambiar contraseña del usuario actual de forma segura
    # Requiere la contraseña actual para validación
    # Verificar contraseña actual
    if not verify_password(request.current_password, usuario_actual.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Validar que la nueva contraseña sea diferente
    if verify_password(request.new_password, usuario_actual.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )
    
    try:
        # Actualizar contraseña
        usuario_actual.password_hash = get_password_hash(request.new_password)
        usuario_actual.fecha_actualizacion = datetime.now(pytz.timezone('America/Tegucigalpa'))
        db.commit()
        
        # Invalidar todos los tokens existentes por seguridad
        revoked_count = RefreshTokenService.revoke_all_user_tokens(db, usuario_actual.id)
        
        # Limpiar cookie actual
        clear_refresh_cookie(response)
        
        return {
            "mensaje": "Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente.",
            "require_login": True
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar contraseña: {str(e)}"
        )

@router.get("/debug/password-verification/{user_email}")
def debug_password_verification(
    user_email: str,
    test_password: str,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["super_admin"]))
):
    #Endpoint de debug para verificar problemas de contraseña (solo super_admin)
    user = db.query(Usuario).filter(Usuario.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "user_info": {
            "id": user.id,
            "email": user.email,
            "rol": user.rol
        },
        "password_hash_info": {
            "hash_exists": bool(user.password_hash),
            "hash_length": len(user.password_hash) if user.password_hash else 0,
            "is_bcrypt_format": user.password_hash.startswith('$2b$') if user.password_hash else False,
            "hash_preview": user.password_hash[:20] + "..." if user.password_hash else None
        },
        "verification_test": {
            "password_matches": verify_password(test_password, user.password_hash) if user.password_hash else False,
            "test_password_provided": bool(test_password)
        },
        "recommendations": [
            "Si password_matches es False con la contraseña correcta, el hash está corrupto",
            "Si is_bcrypt_format es False, el hash no es válido",
            "Use el endpoint /auth/change-password para actualizar de forma segura"
        ]
    }
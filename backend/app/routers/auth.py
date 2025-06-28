from datetime import timedelta
from app.core.config import settings
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.schemas.auth_schema import Token, LoginResponse
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_role
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_username(usuario):
    return usuario.nombre or usuario.email or f"ID {usuario.id}"

# ===== ENDPOINTS =====
@router.post("/token", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    token_data = {"sub": user.email, 
                  "rol": user.rol,
                  "usuario_id": user.id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": user.email,
        "rol": user.rol,
        "refresh_token": refresh_token
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token no válido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    new_token = create_access_token({"sub": payload.get("sub"), "rol": payload.get("rol")})
    return {"access_token": new_token, "token_type": "bearer"}

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
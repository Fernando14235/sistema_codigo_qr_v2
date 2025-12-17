from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.schemas.auth_schema import TokenData
from app.database import get_db
from app.models import Usuario
from sqlalchemy.orm import Session
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# Hashear contraseña
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Verificar contraseña
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
    
# Crear token de acceso
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# Crear refresh token
# create_refresh_token removido - ahora se maneja en RefreshTokenService

# Obtener usuario desde token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
    ) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        usuario_id: int = payload.get("usuario_id")
        if usuario_id is None:
            raise credentials_exception
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Error de JWT: {str(e)}")

    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if user is None:
        raise credentials_exception

    return user

def verify_role(required_role: list[str]):
    def dependence(user: Usuario = Depends(get_current_user)):
        if user.rol not in required_role:
            raise HTTPException(status_code=403, detail="No tienes permiso para acceder a este recurso")
        return user
    return dependence

def get_current_residencial_id(user: Usuario = Depends(get_current_user)) -> int:
    """Obtener el residencial_id del usuario actual"""
    if user.rol == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los super administradores no tienen residencial asignado"
        )
    if not user.residencial_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no tiene residencial asignado"
        )
    return user.residencial_id

def is_super_admin(user: Usuario = Depends(get_current_user)) -> bool:
    """Verificar si el usuario es super administrador"""
    return user.rol == "super_admin"

def get_residencial_id_or_super_admin(user: Usuario = Depends(get_current_user)):
    """Obtener residencial_id o permitir super admin"""
    if user.rol == "super_admin":
        return None  # Super admin
    return user.residencial_id

def verify_residencial_access(user: Usuario = Depends(get_current_user), residencial_id: int = None) -> bool:
    """Verificar que el usuario tenga acceso a la residencial especificada"""
    if not user.residencial_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no tiene residencial asignado"
        )
    
    if residencial_id and user.residencial_id != residencial_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta residencial"
        )
    
    return True
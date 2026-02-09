from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    usuario_id: int | None = None
    username: EmailStr | None = None
    rol: str | None = None
    residencial_id: int | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: EmailStr
    usuario_id: int
    rol: str
    residencial_id: int | None = None
    ult_conexion: str | None = None

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: EmailStr
    usuario_id: int
    rol: str

# Schemas para RefreshToken
class RefreshTokenBase(BaseModel):
    usuario_id: int
    device_info: Optional[str] = None

class RefreshTokenCreate(RefreshTokenBase):
    token_hash: str
    expires_at: datetime

class RefreshTokenInDB(RefreshTokenBase):
    id: int
    token_hash: str
    created_at: datetime
    expires_at: datetime
    revoked: bool
    
    class Config:
        from_attributes = True

class RefreshTokenResponse(BaseModel):
    id: int
    created_at: datetime
    expires_at: datetime
    revoked: bool
    device_info: Optional[str] = None
    
    class Config:
        from_attributes = True
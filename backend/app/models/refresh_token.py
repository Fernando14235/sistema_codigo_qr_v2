from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time, get_honduras_time
from datetime import datetime, timedelta
import secrets
import hashlib

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=get_current_time, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    device_info = Column(String(255), nullable=True)  # Información del dispositivo (opcional)
    
    # Relación con Usuario
    usuario = relationship("Usuario", back_populates="refresh_tokens")
    
    @classmethod
    def generate_token(cls) -> str:
        """Generar un token seguro de 32 bytes"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def hash_token(cls, token: str) -> str:
        """Hash del token para almacenamiento seguro"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    @classmethod
    def create_refresh_token(cls, usuario_id: int, expires_days: int = 7, device_info: str = None):
        """Crear un nuevo refresh token"""
        token = cls.generate_token()
        token_hash = cls.hash_token(token)
        expires_at = get_honduras_time() + timedelta(days=expires_days)
        
        return {
            "token": token,
            "token_hash": token_hash,
            "usuario_id": usuario_id,
            "expires_at": expires_at,
            "device_info": device_info
        }
    
    def is_valid(self) -> bool:
        """Verificar si el token es válido (no revocado y no expirado)"""
        return not self.revoked and self.expires_at > get_honduras_time()
    
    def revoke(self):
        """Revocar el token"""
        self.revoked = True
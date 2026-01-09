from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.refresh_token import RefreshToken
from app.models.usuario import Usuario
from app.core.config import settings
from app.utils.time import get_honduras_time
from datetime import datetime, timedelta
from typing import Optional
import hashlib

class RefreshTokenService:
    
    @staticmethod
    def create_refresh_token(
        db: Session, 
        usuario_id: int, 
        device_info: Optional[str] = None,
        expires_days: int = None
    ) -> tuple[str, RefreshToken]:
        """
        Crear un nuevo refresh token para un usuario
        Retorna: (token_plain, refresh_token_db_object)
        """
        if expires_days is None:
            expires_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
            
        # Generar token y hash
        token_data = RefreshToken.create_refresh_token(
            usuario_id=usuario_id,
            expires_days=expires_days,
            device_info=device_info
        )
        
        # Crear objeto en DB
        db_refresh_token = RefreshToken(
            usuario_id=token_data["usuario_id"],
            token_hash=token_data["token_hash"],
            expires_at=token_data["expires_at"],
            device_info=token_data["device_info"]
        )
        
        db.add(db_refresh_token)
        db.commit()
        db.refresh(db_refresh_token)
        
        return token_data["token"], db_refresh_token
    
    @staticmethod
    def validate_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
        """
        Validar un refresh token
        Retorna el objeto RefreshToken si es válido, None si no
        """
        token_hash = RefreshToken.hash_token(token)
        
        refresh_token = db.query(RefreshToken).filter(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > get_honduras_time()
            )
        ).first()
        
        return refresh_token
    
    @staticmethod
    def revoke_refresh_token(db: Session, token: str) -> bool:
        """
        Revocar un refresh token específico
        Retorna True si se revocó exitosamente, False si no se encontró
        """
        token_hash = RefreshToken.hash_token(token)
        
        refresh_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if refresh_token:
            refresh_token.revoke()
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def revoke_all_user_tokens(db: Session, usuario_id: int) -> int:
        """
        Revocar todos los refresh tokens de un usuario
        Retorna el número de tokens revocados
        """
        tokens = db.query(RefreshToken).filter(
            and_(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked == False
            )
        ).all()
        
        count = 0
        for token in tokens:
            token.revoke()
            count += 1
        
        db.commit()
        return count
    
    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """
        Limpiar tokens expirados de la base de datos
        Retorna el número de tokens eliminados
        """
        expired_tokens = db.query(RefreshToken).filter(
            RefreshToken.expires_at < get_honduras_time()
        ).all()
        
        count = len(expired_tokens)
        
        for token in expired_tokens:
            db.delete(token)
        
        db.commit()
        return count
    
    @staticmethod
    def get_user_active_tokens(db: Session, usuario_id: int) -> list[RefreshToken]:
        """
        Obtener todos los tokens activos de un usuario
        """
        return db.query(RefreshToken).filter(
            and_(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > get_honduras_time()
            )
        ).all()
    
    @staticmethod
    def revoke_token_by_id(db: Session, token_id: int, usuario_id: int) -> bool:
        """
        Revocar un token específico por ID (para que el usuario pueda cerrar sesiones específicas)
        """
        refresh_token = db.query(RefreshToken).filter(
            and_(
                RefreshToken.id == token_id,
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked == False
            )
        ).first()
        
        if refresh_token:
            refresh_token.revoke()
            db.commit()
            return True
        
        return False
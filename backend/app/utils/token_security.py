# Token Security Utilities
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings
from app.utils.time import get_honduras_time

class TokenSecurity:
    """
    Utilidades de seguridad para tokens
    """
    
    @staticmethod
    def generate_secure_token() -> str:
        """Generar token criptográficamente seguro"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_token(token: str) -> str:
        """Hash del token para almacenamiento seguro"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    @staticmethod
    def is_token_expired(expires_at: datetime) -> bool:
        """Verificar si el token ha expirado"""
        return get_honduras_time() > expires_at
    
    @staticmethod
    def get_token_fingerprint(user_agent: str, ip_address: str) -> str:
        """
        Crear fingerprint del dispositivo para detección de anomalías
        """
        fingerprint_data = f"{user_agent}:{ip_address}"
        return hashlib.md5(fingerprint_data.encode()).hexdigest()
    
    @staticmethod
    def validate_token_context(
        stored_fingerprint: str,
        current_user_agent: str,
        current_ip: str
    ) -> bool:
        """
        Validar que el token se esté usando desde el mismo contexto
        """
        current_fingerprint = TokenSecurity.get_token_fingerprint(
            current_user_agent, current_ip
        )
        return stored_fingerprint == current_fingerprint

# Configuración de seguridad recomendada
SECURITY_CONFIG = {
    "access_token": {
        "storage": "localStorage",
        "duration_minutes": 30,
        "renewable": True,
        "reason": "Duración corta, fácil renovación automática"
    },
    "refresh_token": {
        "storage": "httponly_cookie + database",
        "duration_days": 7,
        "revocable": True,
        "reason": "Protegido contra XSS, revocable inmediatamente"
    },
    "csrf_protection": {
        "enabled": True,
        "method": "SameSite cookies + Origin validation"
    },
    "xss_protection": {
        "enabled": True,
        "method": "HttpOnly cookies para refresh tokens"
    }
}
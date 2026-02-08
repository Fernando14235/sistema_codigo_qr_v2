from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    TOKEN_TYPE: str
    
    #seguridad
    PASSWORD_HASH_ALGORITHM: str
    FERNET_KEY: str
    HMAC_SECRET: str
    
    #correo
    EMAIL_ADDRESS: str
    EMAIL_PASSWORD: str
    EMAIL_SMTP_SERVER: str
    EMAIL_SMTP_PORT: int
    EMAIL_USE_TLS: bool
    EMAIL_USE_SSL: bool
    BREVO_API_KEY: str
    
    # claves vapid (notificaciones push)
    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    VAPID_EMAIL: str
    
    #cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # cors
    FRONTEND_URL: str
    ALLOWED_ORIGINS: str
    DEBUG_MODE: str
    ENVIRONMENT: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" 
        
settings = Settings()
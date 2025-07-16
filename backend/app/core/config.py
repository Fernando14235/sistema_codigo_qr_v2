from pydantic_settings import BaseSettings

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
    
    # WhatsApp
    #WHATSAPP_FROM: str
    #WHATSAPP_ACCOUNT_SID: str
    #WHATSAPP_AUTH_TOKEN: str
    
    # cors
    FRONTEND_URL: str
    ALLOWED_ORIGINS: str
    DEBUG_MODE: str
    ENVIRONMENT: str
    
    # Variables adicionales que pueden estar en el entorno
    VITE_API_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignorar campos extra en lugar de fallar
        
settings = Settings()
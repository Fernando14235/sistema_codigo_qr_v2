from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

def add_cors(app):
    """
    Configuración de CORS optimizada para desarrollo y producción
    CRÍTICO: Configuración específica para cookies cross-origin
    """
    # Orígenes base para producción
    production_origins = [
        "https://tsapp.tekhnosupport.com",
        "https://exquisite-healing-production.up.railway.app",
        "https://sistema-codigo-qr-v2-production.up.railway.app",
    ]
    
    # Orígenes para desarrollo
    development_origins = [ 
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://192.168.1.35:5173", 
        "http://localhost:8000",
        "http://192.168.1.41:8000",
    ]
    
    # Determinar orígenes según el ambiente
    if settings.ENVIRONMENT == "production":
        allowed_origins = production_origins.copy()
        
        # Agregar orígenes desde configuración si existen
        if hasattr(settings, 'ALLOWED_ORIGINS'):
            try:
                import json
                configured_origins = json.loads(settings.ALLOWED_ORIGINS)
                allowed_origins.extend(configured_origins)
            except:
                pass
    else:
        # En desarrollo, incluir todos los orígenes
        allowed_origins = production_origins + development_origins
        
        # Agregar orígenes desde configuración
        if hasattr(settings, 'ALLOWED_ORIGINS'):
            try:
                import json
                configured_origins = json.loads(settings.ALLOWED_ORIGINS)
                allowed_origins.extend(configured_origins)
            except:
                pass
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,  # CRÍTICO: Esto es lo único necesario para cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Cookie", # <--- CRÍTICO AGREGAR ESTO
            "Set-Cookie"
        ],
        expose_headers=[
            "Content-Length",
            "Content-Range",
            "Content-Type",
            "Set-Cookie",
        ],
    )
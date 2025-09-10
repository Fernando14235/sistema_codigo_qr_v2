from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

def add_cors(app):
    # Middleware de hosts confiables (protege contra Host Header Injection)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "tsapp.tekhnosupport.com",
            "*.railway.app",  # Permite subdominios de Railway
            "localhost",
            "127.0.0.1"
        ]
    )
    
    # Middleware CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://sistemacodigoqrv2-production.up.railway.app",
            "https://tsapp.tekhnosupport.com",
            "https://exquisite-healing-production.up.railway.app",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
    )
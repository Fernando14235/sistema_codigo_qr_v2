from fastapi.middleware.cors import CORSMiddleware

def add_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "sistemacodigoqrv2-production.up.railway.app",      # React web
            "exquisite-healing-production.up.railway.app",      # React web
            "*" #para permitir conexiones de cualquier origen de red
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
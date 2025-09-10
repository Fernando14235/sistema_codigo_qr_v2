from fastapi.middleware.cors import CORSMiddleware

def add_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://sistemacodigoqrv2-production.up.railway.app",
            "https://exquisite-healing-production.up.railway.app",
            "https://tsapp.tekhnosupport.com"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
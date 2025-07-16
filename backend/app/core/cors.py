from fastapi.middleware.cors import CORSMiddleware

def add_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",      # React web
            "http://127.0.0.1:3000",      # React web (otra variante)
            "http://localhost:8000",      # FastAPI docs/local
            "http://127.0.0.1:8000",      # FastAPI docs/local
            "http://localhost:8081",      # Otro frontend posible
            "http://localhost:19006",     # Expo web
            "http://localhost:19000",     # Expo Go
            "exp://127.0.0.1:19000",      # Expo Go (exp://)
            "exp://localhost:19000",      # Expo Go (exp://)
            "http://192.168.1.38:19006", # Cambia por tu IP local real
            "http://192.168.1.38:3000",  # Cambia por tu IP local real
            "http://192.168.1.34:3000",  # Cambia por tu IP local real
            "http://192.168.1.39:3000",  # Cambia por tu IP local real
            "http://192.168.1.20:3000",  # Cambia por tu IP local real
            "http://192.168.1.38:8081",  # Cambia por tu IP local real
            "http://192.168.60.150:3000",
            "*" #para permitir conexiones de cualquier origen de red
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
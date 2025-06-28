from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.core.config import settings

# Crear el motor SQLAlchemy usando la URL de la base de datos
engine = create_engine(settings.DATABASE_URL)

# Crear sesión para manejar transacciones (lectura/escritura)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

load_dotenv()

# Base para todos los modelos
Base = declarative_base()

# Dependencia para obtener sesión en rutas (usado en FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

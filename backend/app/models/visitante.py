from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Visitante(Base):
    __tablename__ = "visitantes"

    id = Column(Integer, primary_key=True, index=True)
    nombre_conductor = Column(String(150), nullable=False)
    dni_conductor = Column(String(50), nullable=False)
    telefono = Column(String(20), nullable=True)
    tipo_vehiculo = Column(String(70), nullable=True)
    placa_vehiculo = Column(String(30), nullable=True)
    motivo_visita = Column(String(150), nullable=True)
    
    visitas = relationship("Visita", back_populates="visitante")
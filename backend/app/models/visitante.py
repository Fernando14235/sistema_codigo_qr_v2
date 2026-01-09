from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Visitante(Base):
    __tablename__ = "visitantes"

    id = Column(Integer, primary_key=True, index=True)
    nombre_conductor = Column(String, nullable=False)
    dni_conductor = Column(String, nullable=False)
    telefono = Column(String)
    tipo_vehiculo = Column(String, nullable=False)
    marca_vehiculo = Column(String, nullable=True)
    color_vehiculo = Column(String, nullable=True) 
    placa_vehiculo = Column(String, default="no agregado")
    placa_chasis = Column(String, nullable=True) #nuevo campo
    motivo_visita = Column(String, nullable=False)
    destino_visita = Column(String, nullable=True)
    
    visitas = relationship("Visita", back_populates="visitante")
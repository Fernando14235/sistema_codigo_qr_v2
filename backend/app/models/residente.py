from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Residente(Base):
    __tablename__ = "residentes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    residencial_id = Column(Integer, ForeignKey("residenciales.id"), nullable=True)
    telefono = Column(String(25), nullable=True)
    unidad_residencial = Column(String(50), nullable=True)

    usuario = relationship("Usuario", back_populates="residente")
    residencial = relationship("Residencial", back_populates="residentes")
    visitas = relationship("Visita", back_populates="residente")
    tickets = relationship("Ticket", back_populates="residente", cascade="all, delete-orphan")
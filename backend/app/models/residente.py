from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Residente(Base):
    __tablename__ = "residentes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    telefono = Column(String)
    unidad_residencial = Column(String(50), nullable=False)

    usuario = relationship("Usuario", back_populates="residente")
    visitas = relationship("Visita", back_populates="residente")
    tickets = relationship("Ticket", back_populates="residente", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="residente", cascade="all, delete-orphan")
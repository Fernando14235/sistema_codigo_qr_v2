from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)  # Añadí ondelete
    telefono = Column(String, nullable=False)
    
    usuario = relationship("Usuario", back_populates="admin")
    visitas = relationship("Visita", back_populates="admin")
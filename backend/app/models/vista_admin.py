from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class VistaAdmin(Base):
    __tablename__ = "vistas_admin"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("administradores.id", ondelete="CASCADE"), nullable=False)
    vista_id = Column(Integer, ForeignKey("vistas.id", ondelete="CASCADE"), nullable=False)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    admin = relationship("Administrador", back_populates="vistas_admin")
    vista = relationship("Vista", back_populates="vistas_admin")
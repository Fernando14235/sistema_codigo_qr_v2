from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class SuperAdmin(Base):
    __tablename__ = "super_admins"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    telefono = Column(String(25), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="super_admin") 
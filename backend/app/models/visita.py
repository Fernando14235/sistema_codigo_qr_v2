from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class Visita(Base):
    __tablename__ = "visitas"

    id = Column(Integer, primary_key=True, index=True)
    visitante_id = Column(Integer, ForeignKey("visitantes.id", ondelete="CASCADE"), nullable=False)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=False)
    guardia_id = Column(Integer, ForeignKey("guardias.id", ondelete="SET NULL"), nullable=True)
    qr_code = Column(Text, nullable=False)
    qr_expiracion = Column(DateTime(timezone=True))
    fecha_entrada = Column(DateTime(timezone=True), default=get_current_time)
    fecha_salida = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String, nullable=False, default="pendiente")
    notas = Column(Text)

    residente = relationship("Residente", back_populates="visitas")
    visitante = relationship("Visitante", back_populates="visitas")
    guardia = relationship("Guardia", back_populates="visitas")
    escaneos = relationship("EscaneoQR", back_populates="visita")
    notificaciones = relationship("Notificacion", back_populates="visita")

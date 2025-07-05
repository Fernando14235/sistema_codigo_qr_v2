from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class Visita(Base):
    __tablename__ = "visitas"

    id = Column(Integer, primary_key=True, index=True)
    visitante_id = Column(Integer, ForeignKey("visitantes.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("administradores.id", ondelete="CASCADE"), nullable=True)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=True)
    guardia_id = Column(Integer, ForeignKey("guardias.id", ondelete="SET NULL"), nullable=True)
    tipo_creador = Column(String(10), nullable=False)
    qr_code = Column(String, nullable=True)
    qr_expiracion = Column(DateTime(timezone=True))
    fecha_entrada = Column(DateTime(timezone=True), default=get_current_time)
    fecha_salida = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String, nullable=False, default="pendiente")
    notas = Column(Text)
    expiracion = Column(String(1), default="N")  # 'S' para expirada, 'N' para no expirada

    residente = relationship("Residente", back_populates="visitas")
    admin = relationship("Administrador", back_populates="visitas")
    visitante = relationship("Visitante", back_populates="visitas")
    guardia = relationship("Guardia", back_populates="visitas")
    escaneos = relationship("EscaneoQR", back_populates="visita", passive_deletes=True)
    notificaciones = relationship("Notificacion", back_populates="visita", passive_deletes=True)

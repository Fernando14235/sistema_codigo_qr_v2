from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Social(Base):
    __tablename__ = "social"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    contenido = Column(Text, nullable=False)
    tipo_publicacion = Column(String(20), nullable=False)
    requiere_respuesta = Column(Boolean, default=False)
    para_todos = Column(Boolean, default=False)
    estado = Column(String(20), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    imagenes = relationship("SocialImagen", back_populates="social", cascade="all, delete-orphan")
    destinatarios = relationship("SocialDestinatario", back_populates="social", cascade="all, delete-orphan")


class SocialImagen(Base):
    __tablename__ = "social_imagenes"

    id = Column(Integer, primary_key=True, index=True)
    social_id = Column(Integer, ForeignKey("social.id", ondelete="CASCADE"), nullable=False)
    imagen_url = Column(Text, nullable=False)

    social = relationship("Social", back_populates="imagenes")


class SocialDestinatario(Base):
    __tablename__ = "social_destinatarios"

    id = Column(Integer, primary_key=True, index=True)
    social_id = Column(Integer, ForeignKey("social.id", ondelete="CASCADE"), nullable=False)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=False)

    social = relationship("Social", back_populates="destinatarios")
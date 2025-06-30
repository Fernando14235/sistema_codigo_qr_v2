from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

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
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)

    imagenes = relationship("SocialImagen", back_populates="social", cascade="all, delete-orphan")
    destinatarios = relationship("SocialDestinatario", back_populates="social", cascade="all, delete-orphan")
    opciones = relationship("SocialOpcion", back_populates="social", cascade="all, delete-orphan")
    votos = relationship("SocialVoto", back_populates="social", cascade="all, delete-orphan")


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


class SocialVoto(Base):
    __tablename__ = "social_votos"

    id = Column(Integer, primary_key=True, index=True)
    social_id = Column(Integer, ForeignKey("social.id", ondelete="CASCADE"), nullable=False)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=False)
    opcion_id = Column(Integer, ForeignKey("social_opciones.id", ondelete="CASCADE"), nullable=False)
    fecha_voto = Column(DateTime(timezone=True), default=get_current_time)

    social = relationship("Social", back_populates="votos")
    opcion = relationship("SocialOpcion", back_populates="votos")


class SocialOpcion(Base):
    __tablename__ = "social_opciones"

    id = Column(Integer, primary_key=True, index=True)
    social_id = Column(Integer, ForeignKey("social.id", ondelete="CASCADE"), nullable=False)
    texto = Column(String(200), nullable=False)

    social = relationship("Social", back_populates="opciones")
    votos = relationship("SocialVoto", back_populates="opcion", cascade="all, delete-orphan")
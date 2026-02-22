from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False, unique=True)
    p256dh_key = Column(Text, nullable=False)
    auth_key = Column(Text, nullable=False)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Integer, default=1, nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    
    # Relación con usuario
    usuario = relationship("Usuario", back_populates="push_subscriptions")

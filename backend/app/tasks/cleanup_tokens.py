from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.refresh_token_service import RefreshTokenService
import logging

logger = logging.getLogger(__name__)

def cleanup_expired_refresh_tokens():
    """
    Tarea programada para limpiar tokens expirados
    Se puede ejecutar diariamente con APScheduler
    """
    db: Session = SessionLocal()
    try:
        deleted_count = RefreshTokenService.cleanup_expired_tokens(db)
        logger.info(f"Limpieza de tokens completada: {deleted_count} tokens expirados eliminados")
        return deleted_count
    except Exception as e:
        logger.error(f"Error en limpieza de tokens: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Para ejecutar manualmente
    cleanup_expired_refresh_tokens()
import atexit
from app.utils.async_notifications import email_executor

def cleanup_resources():
    try:
        email_executor.shutdown(wait=True)
    except Exception as e:
        print(f"Error al cerrar pool de hilos de email: {e}")

# Registrar la función de limpieza para que se ejecute al cerrar la aplicación
atexit.register(cleanup_resources)
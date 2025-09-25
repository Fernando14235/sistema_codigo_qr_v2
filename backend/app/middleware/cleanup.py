import atexit
from app.utils.async_notifications import email_executor

def cleanup_resources():
    """
    Función para limpiar recursos al cerrar la aplicación
    """
    try:
        email_executor.shutdown(wait=True)
        print("Pool de hilos de email cerrado correctamente")
    except Exception as e:
        print(f"Error al cerrar pool de hilos de email: {e}")

# Registrar la función de limpieza para que se ejecute al cerrar la aplicación
atexit.register(cleanup_resources)
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from app.utils.notificaciones import enviar_correo
from app.schemas.usuario_schema import UsuarioCreate
from app.models.usuario import Usuario
import logging

# Pool de hilos para envío asíncrono de correos
# Configuración optimizada para Railway y producción
email_executor = ThreadPoolExecutor(
    max_workers=2,  # Reducido para Railway
    thread_name_prefix="email_sender"
)

def enviar_correo_async(destinatario: str, asunto: str, html: str, qr_img_b64: str = None):
    """
    Envía un correo de forma asíncrona sin bloquear la respuesta HTTP
    """
    def _enviar():
        try:
            return enviar_correo(destinatario, asunto, html, qr_img_b64)
        except Exception as e:
            logging.error(f"Error en envío asíncrono de correo a {destinatario}: {e}")
            return False
    
    # Enviar en un hilo separado
    future = email_executor.submit(_enviar)
    return future

def enviar_notificacion_usuario_creado_async(usuario: Usuario, datos_creacion: UsuarioCreate):
    """
    Versión asíncrona de enviar_notificacion_usuario_creado
    """
    try:
        asunto = "¡Bienvenido a Porto Pass!"
        # Datos comunes
        mensaje_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                                🏠 ¡Bienvenido a Porto Pass!
                            </h1>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Hola <strong>{usuario.nombre}</strong>,
                            </p>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Tu cuenta ha sido creada exitosamente y ya puedes utilizar la aplicación Porto Pass.
                            </p>
        """

        # Datos según rol
        if usuario.rol == "residente":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Unidad Residencial: </strong> {datos_creacion.unidad_residencial}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {datos_creacion.telefono}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">✅ ¿Qué puedes hacer ahora?</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Iniciar sesión en la aplicación</li>
                        <li>Crear visitas para tus invitados</li>
                        <li>Recibir notificaciones de visitas</li>
                        <li>Ver el historial de tus visitas</li>
                    </ul>
                </div>
            """
        elif usuario.rol == "admin":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {getattr(datos_creacion, 'telefono', '-')}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">⚠️ Permisos de Administrador</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Tienes acceso total al sistema</li>
                        <li>Puedes crear y gestionar usuarios, visitas y notificaciones</li>
                        <li>Por favor, usa tu cuenta con responsabilidad</li>
                    </ul>
                </div>
            """
        elif usuario.rol == "guardia":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {getattr(datos_creacion, 'telefono', '-')}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">🚨 Permisos de Guardia</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Puedes aceptar o rechazar la entrada de visitas</li>
                        <li>Puedes registrar la salida de los visitantes</li>
                        <li>Debes verificar la identidad de los visitantes</li>
                    </ul>
                </div>
            """

        # Información de seguridad común
        mensaje_html += """
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">🔒 Seguridad de tu cuenta</h3>
                <p style="font-size: 14px; color: #856404;">
                    <strong>Importante:</strong> Por seguridad, no almacenamos tu contraseña en texto plano. 
                    Si la olvidas, contacta al administrador del sistema.
                </p>
            </div>
            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="text-align: center; font-size: 12px; color: #999;">
                Este es un mensaje automático del sistema Porto Pass.<br>
                <strong>No respondas a este correo.</strong>
            </p>
            </div>
        </div>
        </body>
        </html>
        """

        # Enviar el correo de forma asíncrona
        future = enviar_correo_async(usuario.email, asunto, mensaje_html)
        
        # Log del intento de envío
        logging.info(f"Correo de bienvenida programado para envío asíncrono a {usuario.email} (Usuario ID: {usuario.id})")
        
        # Callback para logging del resultado
        def log_result(future):
            try:
                result = future.result(timeout=1)  # No bloquear mucho tiempo
                if result:
                    logging.info(f"Correo enviado exitosamente a {usuario.email}")
                else:
                    logging.warning(f"Fallo en envío de correo a {usuario.email}")
            except Exception as e:
                logging.error(f"Error en callback de correo para {usuario.email}: {e}")
        
        future.add_done_callback(log_result)
        return future

    except Exception as e:
        logging.error(f"Error al programar envío de notificación de usuario creado: {str(e)}")
        return None
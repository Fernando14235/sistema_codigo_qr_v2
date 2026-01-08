# app/utils/notificaciones.py
import logging
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from app.core.config import settings
import base64

# CONFIGURACIÓN DE BREVO
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = settings.BREVO_API_KEY
api_client = sib_api_v3_sdk.ApiClient(configuration)
api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)

def enviar_correo(destinatario: str, asunto: str, html: str, qr_img_b64: str = None) -> bool:
    """
    Envía un correo electronico usando Brevo.
    Si se proporciona qr_img_b64, se incrusta como imagen inline en el cuerpo del correo.
    """
    sender = {"name": "Porto Pass", "email": settings.EMAIL_ADDRESS}
    to = [{"email": destinatario}]

    try:
        # Crear el email base
        email = sib_api_v3_sdk.SendSmtpEmail(
            to=to,
            sender=sender,
            subject=asunto,
            html_content=html
        )

        # Incrustar QR en el HTML si se proporciona
        if qr_img_b64:
            try:
                # Limpiar el base64 si viene con prefijo data:image
                if qr_img_b64.startswith('data:image'):
                    qr_img_b64 = qr_img_b64.split(',')[1]
                
                # Validar que sea base64 válido
                try:
                    base64.b64decode(qr_img_b64, validate=True)
                except Exception as decode_error:
                    return False

                # IMPORTANTE: Usar el mismo nombre que se referencia en el HTML
                email.attachment = [
                    {
                        "name": "qrimage.png",
                        "content": qr_img_b64,
                        "type": "image/png",
                        "disposition": "inline",
                        "content_id": "qrimage"
                    }
                ]
            except Exception as e:
                return False

        # Enviar correo
        api_instance.send_transac_email(email)
        return True

    except ApiException as e:
        logging.error(f"❌ Error de API de Brevo al enviar correo a {destinatario}: {e}")
        return False
    except Exception as e:
        logging.error(f"❌ Error general al enviar correo a {destinatario}: {e}")
        return False
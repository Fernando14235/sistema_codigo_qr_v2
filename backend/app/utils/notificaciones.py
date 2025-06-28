import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from app.core.config import settings
import base64
import os
import logging

def enviar_correo(destinatario: str, asunto: str, html: str, qr_img_b64: str = None):
    try:
        msg = MIMEMultipart("related")
        msg['From'] = settings.EMAIL_ADDRESS
        msg['To'] = destinatario
        msg['Subject'] = asunto
        
        # Parte alternativa (HTML)
        mensaje_alternativo = MIMEMultipart("alternative")
        msg.attach(mensaje_alternativo)
        
        # Parte HTML
        parte_html = MIMEText(html, "html")
        mensaje_alternativo.attach(parte_html)
        
        if qr_img_b64:
            qr_bytes = base64.b64decode(qr_img_b64)
            imagen = MIMEImage(qr_bytes, _subtype="png")
            imagen.add_header("Content-ID", "<qrimage>")
            imagen.add_header("Content-Disposition", "inline", filename="qr.png")
            msg.attach(imagen)


        with smtplib.SMTP_SSL(settings.EMAIL_SMTP_SERVER, settings.EMAIL_SMTP_PORT) as server:
            server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        logging.error(f"Error al enviar correo: {e}")
        return False
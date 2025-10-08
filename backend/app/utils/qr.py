import base64
import qrcode
from cryptography.fernet import Fernet
from datetime import datetime, timedelta, timezone
from app.core.config import settings
import hmac
import hashlib
import os
import io
from typing import Tuple, Optional
from PIL import Image, ImageDraw, ImageFont

FERNET_KEY = settings.FERNET_KEY
fernet = Fernet(FERNET_KEY)
HMAC_SECRET = settings.HMAC_SECRET

# Cifrar y firmar el id de la visita
def generar_payload_qr(visita_id: int, expiracion: datetime) -> str:
    payload = f"{visita_id}|{expiracion.isoformat()}"
    payload_cifrado = fernet.encrypt(payload.encode()).decode()
    firma = hmac.new(HMAC_SECRET.encode(), payload_cifrado.encode(), hashlib.sha256).hexdigest()
    return f"{payload_cifrado}.{firma}"

# Validar el QR
def validar_payload_qr(qr_code: str) -> Tuple[Optional[int], Optional[str]]:
    try:
        if '.' not in qr_code:
            return None, "Formato inválido del código QR"
        
        payload_cifrado, firma = qr_code.split('.', 1)
        
        firma_valida = hmac.new(HMAC_SECRET.encode(), payload_cifrado.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(firma, firma_valida):
            return None, "Firma inválida"
        
        payload = fernet.decrypt(payload_cifrado.encode()).decode()
        visita_id, expiracion = payload.split('|')
        
        expiracion = datetime.fromisoformat(expiracion)
        if expiracion.tzinfo is None:
            expiracion = expiracion.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expiracion:
            return None, "QR expirado"
        
        return int(visita_id), None
    except Exception as e:
        return None, f"Error al validar el QR: {str(e)}"

# Generar imagen QR en base64
def generar_imagen_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(
        version=None,  # Ajuste automático del tamaño según los datos
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")

    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def generar_qr_completo(visita_id: int, minutos_validez: int = 60) -> Tuple[str, str]:
    expiracion = datetime.utcnow() + timedelta(minutes=minutos_validez)
    qr_code = generar_payload_qr(visita_id, expiracion)
    qr_img_b64 = generar_imagen_qr_base64(qr_code)
    return qr_code, qr_img_b64

def generar_imagen_qr_personalizada(
    qr_data: str,
    nombre_residente: str,
    nombre_visitante: str,
    nombre_residencial: str,
    unidad_residencial: str,  # Dirección del residente
    fecha_creacion: datetime,
    fecha_expiracion: datetime,
    info_extra: str = ""
) -> str:
    # 1. Generar QR
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color='black', back_color='white').convert("RGB")

    # 2. Crear imagen base
    ancho, alto = qr_img.size
    margen_superior = 120
    margen_inferior = 200  # Aumenta para dirección
    ancho_total = ancho + 60
    alto_total = alto + margen_superior + margen_inferior

    img_final = Image.new("RGB", (ancho_total, alto_total), "white")
    draw = ImageDraw.Draw(img_final)

    # 3. Pegar QR en el centro
    img_final.paste(qr_img, (30, margen_superior))

    # 4. Cargar fuentes (usa fuentes del sistema o default)
    try:
        font_titulo = ImageFont.truetype("arialbd.ttf", 32)  # Aumentar tamaño del título
        font_normal = ImageFont.truetype("arial.ttf", 26)   # Aumentar tamaño del texto normal
        font_small = ImageFont.truetype("arial.ttf", 20)    # Aumentar tamaño del texto pequeño
        font_fecha = ImageFont.truetype("arialbd.ttf", 28)  # Ajustar tamaño para fechas
    except:
        font_titulo = ImageFont.load_default()
        font_normal = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_fecha = ImageFont.load_default()

    # 5. Escribir textos
    # Título superior - más grande y mejor centrado
    texto_superior = f"Hola {nombre_visitante}, {nombre_residente} te ha invitado a:"
    draw.text((ancho_total//2, 25), texto_superior, font=font_normal, fill="black", anchor="mm")
    draw.text((ancho_total//2, 65), nombre_residencial, font=font_titulo, fill="#2980b9", anchor="mm")

    # Dirección (unidad residencial) - mejor centrado
    draw.text((ancho_total//2, 95), unidad_residencial, font=font_normal, fill="black", anchor="mm")

    # Fechas - Perfectamente centrado
    fecha_creacion_str = fecha_creacion.strftime("%d-%b-%Y - %I:%M %p")
    fecha_expiracion_str = fecha_expiracion.strftime("%d-%b-%Y - %I:%M %p")
    
    # Texto perfectamente centrado para la expiración
    texto_expiracion = f"El Codigo Expira:\n{fecha_expiracion_str}"
    draw.text((ancho_total//2, alto + margen_superior + 50), texto_expiracion, font=font_fecha, fill="black", anchor="mm")

    # 6. Convertir a base64
    buffered = io.BytesIO()
    img_final.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")
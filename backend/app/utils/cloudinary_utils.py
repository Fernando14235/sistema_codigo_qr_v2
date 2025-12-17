import tempfile
import os
from typing import Optional
from fastapi import UploadFile
from app.services.cloudinary_service import upload_image, delete_image
import re


def save_upload_to_temp(upload_file: UploadFile) -> str:
    """
    Guarda un UploadFile en una ubicación temporal y retorna la ruta.
    
    Args:
        upload_file: Archivo subido desde FastAPI
        
    Returns:
        str: Ruta al archivo temporal
    """
    # Obtener la extensión del archivo
    ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".tmp"
    
    # Crear archivo temporal
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        # Leer y escribir el contenido
        content = upload_file.file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    # Resetear el puntero del archivo para posibles usos posteriores
    upload_file.file.seek(0)
    
    return temp_path


def extract_public_id_from_url(cloudinary_url: str, folder: str) -> Optional[str]:
    """
    Extrae el public_id de una URL de Cloudinary.
    
    Args:
        cloudinary_url: URL completa de Cloudinary
        folder: Carpeta donde está almacenada la imagen
        
    Returns:
        str: public_id extraído o None si no se puede extraer
        
    Example:
        URL: https://res.cloudinary.com/demo/image/upload/v1234567890/qr/qr_123_456.png
        folder: "qr"
        Returns: "qr_123_456"
    """
    try:
        # Patrón para extraer el public_id de la URL de Cloudinary
        # Formato típico: .../upload/v{version}/{folder}/{public_id}.{ext}
        pattern = rf"/upload/v\d+/{folder}/([^\.]+)"
        match = re.search(pattern, cloudinary_url)
        
        if match:
            return match.group(1)
        
        # Intentar patrón alternativo sin versión
        pattern_alt = rf"/{folder}/([^\.]+)\."
        match_alt = re.search(pattern_alt, cloudinary_url)
        
        if match_alt:
            return match_alt.group(1)
            
        return None
    except Exception as e:
        print(f"Error extrayendo public_id de URL {cloudinary_url}: {e}")
        return None


def upload_file_to_cloudinary(file: UploadFile, folder: str, public_id: str = None) -> str:
    """
    Flujo completo de subida: guarda en temp, sube a Cloudinary, limpia temp.
    
    Args:
        file: Archivo a subir
        folder: Carpeta en Cloudinary (ej. 'qr', 'social', 'tickets')
        public_id: ID público opcional para la imagen
        
    Returns:
        str: secure_url de Cloudinary
    """
    temp_path = None
    try:
        # Guardar en temporal
        temp_path = save_upload_to_temp(file)
        
        # Subir a Cloudinary
        result = upload_image(temp_path, folder=folder, public_id=public_id)
        
        # Retornar la URL segura
        return result["secure_url"]
    finally:
        # Limpiar archivo temporal
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error eliminando archivo temporal {temp_path}: {e}")


def delete_from_cloudinary_by_url(cloudinary_url: str, folder: str) -> bool:
    """
    Elimina una imagen de Cloudinary usando su URL.
    
    Args:
        cloudinary_url: URL completa de la imagen en Cloudinary
        folder: Carpeta donde está almacenada
        
    Returns:
        bool: True si se eliminó exitosamente, False en caso contrario
    """
    try:
        public_id = extract_public_id_from_url(cloudinary_url, folder)
        
        if not public_id:
            print(f"No se pudo extraer public_id de la URL: {cloudinary_url}")
            return False
        
        result = delete_image(public_id, folder)
        
        # Cloudinary retorna {'result': 'ok'} si se eliminó correctamente
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Error eliminando imagen de Cloudinary: {e}")
        return False


def save_bytes_to_temp(file_bytes: bytes, extension: str = ".png") -> str:
    """
    Guarda bytes en un archivo temporal y retorna la ruta.
    
    Args:
        file_bytes: Bytes del archivo
        extension: Extensión del archivo (incluir el punto)
        
    Returns:
        str: Ruta al archivo temporal
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        temp_file.write(file_bytes)
        return temp_file.name

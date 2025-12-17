import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

# 🔧 Configuración inicial de Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_image(file_path: str, folder: str, public_id: str = None):
    """
    Sube una imagen a Cloudinary en la carpeta especificada.
    
    Args:
        file_path (str): Ruta local del archivo a subir.
        folder (str): Carpeta en Cloudinary (ej. 'qr', 'social', 'tickets').
        public_id (str, optional): Nombre único para la imagen. Si no se pasa, Cloudinary genera uno.
    
    Returns:
        dict: Información del archivo subido (incluye secure_url).
    """
    result = cloudinary.uploader.upload(
        file_path,
        folder=folder,       
        public_id=public_id,   
        overwrite=True,
        resource_type="image"
    )
    return result

def delete_image(public_id: str, folder: str):
    """
    Elimina una imagen de Cloudinary usando su public_id y carpeta.
    
    Args:
        public_id (str): Nombre único de la imagen.
        folder (str): Carpeta donde está guardada.
    
    Returns:
        dict: Resultado de la operación de borrado.
    """
    full_id = f"{folder}/{public_id}" if folder else public_id
    result = cloudinary.uploader.destroy(full_id, resource_type="image")
    return result
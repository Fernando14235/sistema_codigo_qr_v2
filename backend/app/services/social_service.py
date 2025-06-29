from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.social import Social, SocialImagen, SocialDestinatario, SocialOpcion, SocialVoto
from app.schemas.social_schema import SocialCreate, SocialResponse, SocialImagenCreate, SocialDestinatarioCreate
from app.models.usuario import Usuario
from app.models.residente import Residente
from fastapi import HTTPException
from fastapi import UploadFile
import os
import shutil
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '../../uploads/social')
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)

os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_images(imagenes: Optional[List[UploadFile]]) -> List[str]:
    urls = []
    if imagenes:
        for img in imagenes:
            ext = os.path.splitext(img.filename)[1]
            unique_name = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)
            url = f"/uploads/social/{unique_name}"
            urls.append(url)
    return urls

def create_social(db: Session, social_data: SocialCreate, imagenes: Optional[List[str]] = None, current_user: Optional[Usuario] = None):
    admin_id = current_user.id if current_user else None
    if not admin_id:
        raise ValueError("admin_id es requerido")
    try:
        social = Social(
            admin_id=admin_id,
            titulo=social_data.titulo,
            contenido=social_data.contenido,
            tipo_publicacion=social_data.tipo_publicacion or "comunicado",
            requiere_respuesta=social_data.requiere_respuesta if social_data.tipo_publicacion == "encuesta" else False,
            para_todos=social_data.para_todos,
            estado="publicado"
        )
        db.add(social)
        db.flush()  # Para obtener el ID

        # Imágenes
        if imagenes:
            for url in imagenes:
                img = SocialImagen(social_id=social.id, imagen_url=url)
                db.add(img)

        # Destinatarios
        if not social_data.para_todos and social_data.destinatarios:
            for dest in social_data.destinatarios:
                db.add(SocialDestinatario(social_id=social.id, residente_id=dest.residente_id))

        # Opciones de encuesta
        if social_data.tipo_publicacion == "encuesta" and hasattr(social_data, "opciones") and social_data.opciones:
            for opcion in social_data.opciones:
                db.add(SocialOpcion(social_id=social.id, texto=opcion.texto))

        db.commit()
        db.refresh(social)
        return social
    except Exception as e:
        db.rollback()
        # Si ocurre un error, crear el registro con estado fallido
        social = Social(
            admin_id=admin_id,
            titulo=social_data.titulo,
            contenido=social_data.contenido,
            tipo_publicacion=social_data.tipo_publicacion or "comunicado",
            requiere_respuesta=social_data.requiere_respuesta if social_data.tipo_publicacion == "encuesta" else False,
            para_todos=social_data.para_todos,
            estado="fallido"
        )
        db.add(social)
        db.commit()
        db.refresh(social)
        return social

def get_social_list(
    db: Session,
    user_id: int,
    rol: str,
    tipo_publicacion: Optional[str] = None,
    estado: Optional[str] = None,
    fecha: Optional[str] = None
):
    query = db.query(Social)
    if tipo_publicacion:
        query = query.filter(Social.tipo_publicacion == tipo_publicacion)
    if estado:
        query = query.filter(Social.estado == estado)
    if fecha:
        query = query.filter(Social.fecha_creacion >= fecha)
    if rol == "admin":
        return query.order_by(Social.fecha_creacion.desc()).all()
    else:
        # Para residentes: publicaciones para todos o donde es destinatario
        return (
            query.filter(
                (Social.para_todos == True) |
                (Social.destinatarios.any(SocialDestinatario.residente_id == user_id))
            )
            .order_by(Social.fecha_creacion.desc())
            .all()
        )

def get_social_by_id(db: Session, social_id: int):
    return db.query(Social).filter(Social.id == social_id).first()

def can_user_access_social(db: Session, social: Social, user: Usuario) -> bool:
    """
    Verifica si un usuario tiene acceso a una publicación específica
    """
    # Los admins pueden acceder a todas las publicaciones
    if user.rol == "admin":
        return True
    
    # Los residentes solo pueden acceder si:
    # 1. La publicación es para todos, o
    # 2. Son destinatarios específicos de la publicación
    if user.rol == "residente":
        # Buscar si el usuario es residente
        residente = db.query(Residente).filter(Residente.usuario_id == user.id).first()
        if not residente:
            return False
        
        # Verificar si es para todos o si es destinatario específico
        if social.para_todos:
            return True
        
        # Verificar si es destinatario específico
        destinatario = db.query(SocialDestinatario).filter(
            SocialDestinatario.social_id == social.id,
            SocialDestinatario.residente_id == residente.id
        ).first()
        
        return destinatario is not None
    
    # Otros roles no tienen acceso
    return False

def update_social(db: Session, social_id: int, data: SocialCreate, imagenes: Optional[List[str]] = None):
    social = db.query(Social).filter(Social.id == social_id).first()
    if not social:
        return None
    social.titulo = data.titulo
    social.contenido = data.contenido
    social.tipo_publicacion = data.tipo_publicacion or "comunicado"
    social.requiere_respuesta = data.requiere_respuesta if data.tipo_publicacion == "encuesta" else False
    social.para_todos = data.para_todos
    social.estado = data.estado

    # Actualizar imágenes
    db.query(SocialImagen).filter(SocialImagen.social_id == social_id).delete()
    if imagenes:
        for url in imagenes:
            db.add(SocialImagen(social_id=social_id, imagen_url=url))

    # Actualizar destinatarios
    db.query(SocialDestinatario).filter(SocialDestinatario.social_id == social_id).delete()
    if not data.para_todos and data.destinatarios:
        for dest in data.destinatarios:
            db.add(SocialDestinatario(social_id=social_id, residente_id=dest.residente_id))

    # Actualizar opciones de encuesta
    if data.tipo_publicacion == "encuesta":
        db.query(SocialOpcion).filter(SocialOpcion.social_id == social_id).delete()
        if hasattr(data, "opciones") and data.opciones:
            for opcion in data.opciones:
                db.add(SocialOpcion(social_id=social_id, texto=opcion.texto))
    else:
        db.query(SocialOpcion).filter(SocialOpcion.social_id == social_id).delete()

    db.commit()
    db.refresh(social)
    return social

def delete_social(db: Session, social_id: int):
    social = db.query(Social).filter(Social.id == social_id).first()
    if not social:
        return False
    # Eliminar imágenes físicas asociadas
    for img in social.imagenes:
        img_path = img.imagen_url
        if img_path.startswith("/uploads/"):
            abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../' + img_path.lstrip('/')))
            if os.path.exists(abs_path):
                try:
                    os.remove(abs_path)
                except Exception as e:
                    print(f"Error eliminando imagen {abs_path}: {e}")
    db.delete(social)
    db.commit()
    return True

def get_social_residente(db: Session, residente_id: int):
    return (
        db.query(Social)
        .filter(
            (Social.para_todos == True) |
            (Social.destinatarios.any(SocialDestinatario.residente_id == residente_id))
        )
        .order_by(Social.fecha_creacion.desc())
        .all()
    )

def crear_publicacion_service(db: Session, social_data: SocialCreate, imagenes: Optional[List[UploadFile]], current_user: Usuario):
    imagen_urls = save_uploaded_images(imagenes)
    return create_social(db, social_data, imagenes=imagen_urls, current_user=current_user)

def listar_publicaciones_service(db: Session, current_user: Usuario, tipo_publicacion: Optional[str], estado: Optional[str], fecha: Optional[str]):
    return get_social_list(
        db,
        user_id=current_user.id,
        rol=current_user.rol,
        tipo_publicacion=tipo_publicacion,
        estado=estado,
        fecha=fecha
    )

def obtener_publicacion_service(db: Session, id: int, current_user: Usuario):
    social = get_social_by_id(db, id)
    if not social:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if not can_user_access_social(db, social, current_user):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta publicación")
    return social

def actualizar_publicacion_service(db: Session, id: int, social_data: SocialCreate, imagenes: Optional[List[UploadFile]], current_user: Usuario):
    imagen_urls = save_uploaded_images(imagenes)
    social = update_social(db, id, social_data, imagenes=imagen_urls)
    if not social:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    return social

def eliminar_publicacion_service(db: Session, id: int, current_user: Usuario):
    ok = delete_social(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    return {"ok": True}

def mis_publicaciones_service(db: Session, current_user: Usuario):
    # Buscar el residente correspondiente al usuario
    residente = db.query(Residente).filter(Residente.usuario_id == current_user.id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado")
    return get_social_residente(db, residente.id)

def votar_encuesta_service(db: Session, social_id: int, usuario_id: int, opcion_id: int):
    # Buscar el residente correspondiente al usuario
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado")
    residente_id = residente.id

    social = db.query(Social).filter(Social.id == social_id, Social.tipo_publicacion == "encuesta").first()
    if not social:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    existente = db.query(SocialVoto).filter_by(social_id=social_id, residente_id=residente_id).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya has votado en esta encuesta")
    opcion = db.query(SocialOpcion).filter_by(id=opcion_id, social_id=social_id).first()
    if not opcion:
        raise HTTPException(status_code=400, detail="Opción inválida")
    voto_nuevo = SocialVoto(social_id=social_id, residente_id=residente_id, opcion_id=opcion_id)
    db.add(voto_nuevo)
    db.commit()
    db.refresh(voto_nuevo)
    return voto_nuevo

def resultados_encuesta_service(db: Session, social_id: int):
    social = db.query(Social).filter(Social.id == social_id, Social.tipo_publicacion == "encuesta").first()
    if not social:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    opciones = db.query(SocialOpcion).filter_by(social_id=social_id).all()
    votos = db.query(SocialVoto).filter_by(social_id=social_id).all()
    resultados = []
    for opcion in opciones:
        conteo = sum(1 for v in votos if v.opcion_id == opcion.id)
        resultados.append({"opcion_id": opcion.id, "texto": opcion.texto, "votos": conteo})
    return {"pregunta": social.contenido, "opciones": resultados, "total_votos": len(votos)}


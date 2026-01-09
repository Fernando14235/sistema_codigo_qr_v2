from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.social import Social, SocialImagen, SocialDestinatario, SocialOpcion, SocialVoto
from app.schemas.social_schema import SocialCreate, SocialResponse, SocialImagenCreate, SocialDestinatarioCreate, SocialUpdate
from app.models.usuario import Usuario
from app.models.residente import Residente
from fastapi import HTTPException
from fastapi import UploadFile
from sqlalchemy.orm import joinedload
import uuid
from app.services.notificacion_service import enviar_notificacion_nueva_publicacion
from app.utils.cloudinary_utils import upload_file_to_cloudinary, delete_from_cloudinary_by_url

async def save_uploaded_images(imagenes: List[UploadFile]) -> List[str]:
    """
    Sube imágenes a Cloudinary y retorna las URLs.
    """
    urls = []
    if imagenes:
        for img in imagenes:
            # Validar que sea una imagen
            if not img.content_type or not img.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail=f"El archivo {img.filename} no es una imagen válida")
            
            # Generar public_id único
            public_id = f"social_{uuid.uuid4().hex}"
            
            # Subir a Cloudinary
            url = upload_file_to_cloudinary(img, folder="social", public_id=public_id)
            urls.append(url)
    return urls

def create_social(db: Session, social_data: SocialCreate, imagenes: Optional[List[str]] = None, current_user: Optional[Usuario] = None):
    admin_id = current_user.id if current_user else None
    residencial_id = current_user.residencial_id if current_user else None
    if not admin_id:
        raise ValueError("admin_id es requerido")
    if not residencial_id:
        raise ValueError("residencial_id es requerido")
    error_message = None
    try:
        if not social_data.para_todos and (not social_data.destinatarios or len(social_data.destinatarios) == 0):
            error_message = "Si la publicación no es para todos, debe especificar al menos un destinatario"
            raise ValueError(error_message)
        if social_data.destinatarios:
            for dest in social_data.destinatarios:
                residente = db.query(Residente).filter(Residente.id == dest.residente_id).first()
                if not residente:
                    error_message = f"El residente con ID {dest.residente_id} no existe"
                    raise ValueError(error_message)
        social = Social(
            admin_id=admin_id,
            residencial_id=residencial_id,
            titulo=social_data.titulo,
            contenido=social_data.contenido,
            tipo_publicacion=social_data.tipo_publicacion or "comunicado",
            requiere_respuesta=social_data.requiere_respuesta if social_data.tipo_publicacion == "encuesta" else False,
            para_todos=social_data.para_todos,
            estado="publicado"
        )
        db.add(social)
        db.flush()
        # Guardar imagen en la base de datos
        if imagenes:
            for url in imagenes:
                img = SocialImagen(social_id=social.id, imagen_url=url)
                db.add(img)
        if not social_data.para_todos and social_data.destinatarios:
            for dest in social_data.destinatarios:
                destinatario = SocialDestinatario(social_id=social.id, residente_id=dest.residente_id)
                db.add(destinatario)
        if social_data.tipo_publicacion == "encuesta" and social_data.opciones:
            for opcion in social_data.opciones:
                db.add(SocialOpcion(social_id=social.id, texto=opcion.texto))
        db.commit()
        db.refresh(social)
        return social
    except Exception as e:
        db.rollback()
        social = Social(
            admin_id=admin_id,
            residencial_id=residencial_id,
            titulo=social_data.titulo,
            contenido=social_data.contenido,
            tipo_publicacion=social_data.tipo_publicacion,
            requiere_respuesta=social_data.requiere_respuesta if social_data.tipo_publicacion == "encuesta" else False,
            para_todos=social_data.para_todos,
            estado="fallido"
        )
        db.add(social)
        db.commit()
        db.refresh(social)
        if error_message:
            social.contenido = f"{social.contenido}\n\n[ERROR: {error_message}]"
            db.commit()
            db.refresh(social)
        return social

def get_social_list(
    db: Session,
    user_id: int,
    rol: str,
    residencial_id: int = None,
    tipo_publicacion: Optional[str] = None,
    estado: Optional[str] = None,
    fecha: Optional[str] = None,
    page: int = 1,
    limit: int = 15
):    
    query = db.query(Social).options(
        joinedload(Social.imagenes),
        joinedload(Social.destinatarios),
        joinedload(Social.opciones),
        joinedload(Social.votos)  # Cargar votos explícitamente
    )
    
    # Filtrar por residencial_id si se proporciona
    if residencial_id:
        query = query.filter(Social.residencial_id == residencial_id)
    
    if tipo_publicacion:
        query = query.filter(Social.tipo_publicacion == tipo_publicacion)
    if estado:
        query = query.filter(Social.estado == estado)
    if fecha:
        query = query.filter(Social.fecha_creacion >= fecha)
    
    if fecha:
        query = query.filter(Social.fecha_creacion >= fecha)
    
    if rol == "admin":
        total = query.count()
        results = query.order_by(Social.fecha_creacion.desc()).offset((page - 1) * limit).limit(limit).all()
        return {"total": total, "data": results}
    else:
        # Para residentes: publicaciones para todos O donde es destinatario específico
        residente = db.query(Residente).filter(Residente.usuario_id == user_id).first()
        if not residente:
            return {"total": 0, "data": []}
        
        filtered_query = query.filter(
            (Social.para_todos == True) |
            (Social.destinatarios.any(SocialDestinatario.residente_id == residente.id))
        )
        total = filtered_query.count()
        results = filtered_query.order_by(Social.fecha_creacion.desc()).offset((page - 1) * limit).limit(limit).all()
        return {"total": total, "data": results}

def get_social_by_id(db: Session, social_id: int):   
    return db.query(Social).options(
        joinedload(Social.imagenes),
        joinedload(Social.destinatarios),
        joinedload(Social.opciones),
        joinedload(Social.votos)  # Cargar votos explícitamente
    ).filter(Social.id == social_id).first()

def can_user_access_social(db: Session, social: Social, user: Usuario) -> bool:
    if user.rol == "super_admin":
        return True
    
    # Los admins solo pueden acceder a publicaciones de su residencial
    if user.rol == "admin":
        return user.residencial_id == social.residencial_id
    
    if user.rol == "residente":
        # Buscar si el usuario es residente
        residente = db.query(Residente).filter(Residente.usuario_id == user.id).first()
        if not residente:
            return False
        
        # Verificar que pertenezca a la misma residencial
        if residente.residencial_id != social.residencial_id:
            return False
        
        # Verificar si es para todos
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

def update_social(db: Session, social_id: int, data: SocialUpdate, imagenes_nuevas: Optional[List[str]] = None):
    social = db.query(Social).filter(Social.id == social_id).first()
    if not social:
        return None
    error_message = None
    
    try:
        # Validar que si no es para todos, debe tener destinatarios
        if not data.para_todos and (not data.destinatarios or len(data.destinatarios) == 0):
            error_message = "Si la publicación no es para todos, debe especificar al menos un destinatario"
            raise ValueError(error_message)
        
        # Validar que los destinatarios existan si se especifican
        if data.destinatarios:
            for dest in data.destinatarios:
                residente = db.query(Residente).filter(Residente.id == dest.residente_id).first()
                if not residente:
                    error_message = f"El residente con ID {dest.residente_id} no existe"
                    raise ValueError(error_message)
        
        social.titulo = data.titulo
        social.contenido = data.contenido
        social.tipo_publicacion = data.tipo_publicacion or "comunicado"
        social.requiere_respuesta = data.requiere_respuesta if data.tipo_publicacion == "encuesta" else False
        social.para_todos = data.para_todos
        social.estado = "publicado"  # Resetear a publicado si se actualiza correctamente

        # Gestión de imágenes existentes
        imagenes_actuales = db.query(SocialImagen).filter(SocialImagen.social_id == social_id).all()
        
        # Procesar imágenes existentes según el flag eliminar
        if data.imagenes_existentes:
            for img_update in data.imagenes_existentes:
                if img_update.eliminar and img_update.id:
                    # Buscar y eliminar la imagen de la BD y de Cloudinary
                    img_db = db.query(SocialImagen).filter(SocialImagen.id == img_update.id).first()
                    if img_db:
                        # Eliminar de Cloudinary
                        img_path = img_db.imagen_url
                        if "cloudinary.com" in img_path:
                            try:
                                delete_from_cloudinary_by_url(img_path, folder="social")
                            except Exception as e:
                                print(f"Error eliminando imagen de Cloudinary {img_path}: {e}")
                        # Eliminar de la BD
                        db.delete(img_db)
        else:
            # Si no se envió lista de imágenes existentes, eliminar todas las actuales
            for img in imagenes_actuales:
                img_path = img.imagen_url
                if "cloudinary.com" in img_path:
                    try:
                        delete_from_cloudinary_by_url(img_path, folder="social")
                    except Exception as e:
                        print(f"Error eliminando imagen de Cloudinary {img_path}: {e}")
                db.delete(img)
        
        # Agregar nuevas imágenes
        if imagenes_nuevas:
            for url in imagenes_nuevas:
                db.add(SocialImagen(social_id=social_id, imagen_url=url))

        # Actualizar destinatarios - solo si no es para todos
        db.query(SocialDestinatario).filter(SocialDestinatario.social_id == social_id).delete()
        if not data.para_todos and data.destinatarios:
            for dest in data.destinatarios:
                destinatario = SocialDestinatario(social_id=social_id, residente_id=dest.residente_id)
                db.add(destinatario)

        # Actualizar opciones de encuesta
        if data.tipo_publicacion == "encuesta":
            db.query(SocialOpcion).filter(SocialOpcion.social_id == social_id).delete()
            if data.opciones:
                for opcion in data.opciones:
                    db.add(SocialOpcion(social_id=social_id, texto=opcion.texto))
        else:
            db.query(SocialOpcion).filter(SocialOpcion.social_id == social_id).delete()

        db.commit()
        db.refresh(social)
        return social
    except Exception as e:
        db.rollback()
        # Si ocurre un error, marcar como fallido y guardar el mensaje de error
        social.estado = "fallido"
        if error_message:
            social.contenido = f"{data.contenido}\n\n[ERROR: {error_message}]"
        db.commit()
        db.refresh(social)
        return social

def delete_social(db: Session, social_id: int):
    social = db.query(Social).filter(Social.id == social_id).first()
    if not social:
        return False
    # Eliminar imágenes de Cloudinary
    for img in social.imagenes:
        img_path = img.imagen_url
        if "cloudinary.com" in img_path:
            try:
                delete_from_cloudinary_by_url(img_path, folder="social")
            except Exception as e:
                print(f"Error eliminando imagen de Cloudinary {img_path}: {e}")
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

async def crear_publicacion_service(db: Session, social_data: SocialCreate, imagenes: Optional[List[UploadFile]], current_user: Usuario):
    try:
        imagen_urls = await save_uploaded_images(imagenes)
        social = create_social(db, social_data, imagenes=imagen_urls, current_user=current_user)
        
        # Determinar a quién notificar
        if social_data.para_todos:
            notificar_a = 'todos'
            residentes_especificos = None
        else:
            # Si no es para todos, notificar solo a los residentes específicos seleccionados
            notificar_a = 'residente'
            residentes_especificos = [dest.residente_id for dest in social_data.destinatarios] if social_data.destinatarios else []
        
        try:
            enviar_notificacion_nueva_publicacion(
                db=db,
                titulo_publicacion=social_data.titulo,
                contenido=social_data.contenido,
                creador=current_user.nombre,
                notificar_a=notificar_a,
                residencial_id=current_user.residencial_id,
                residentes_especificos=residentes_especificos
            )
                
        except Exception as e:
            print(f"Error enviando alerta de nueva publicación: {e}")
        return social
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def listar_publicaciones_service(db: Session, current_user: Usuario, tipo_publicacion: Optional[str], estado: Optional[str], fecha: Optional[str], page: int = 1, limit: int = 15):
    return get_social_list(
        db,
        user_id=current_user.id,
        rol=current_user.rol,
        residencial_id=current_user.residencial_id,
        tipo_publicacion=tipo_publicacion,
        estado=estado,
        fecha=fecha,
        page=page,
        limit=limit
    )

def obtener_publicacion_service(db: Session, id: int, current_user: Usuario):
    social = get_social_by_id(db, id)
    if not social:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if not can_user_access_social(db, social, current_user):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta publicación")
    return social

async def actualizar_publicacion_service(db: Session, id: int, social_data: SocialUpdate, imagenes: Optional[List[UploadFile]], current_user: Usuario):
    imagen_urls = await save_uploaded_images(imagenes) if imagenes else []
    social = update_social(db, id, social_data, imagenes_nuevas=imagen_urls)
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


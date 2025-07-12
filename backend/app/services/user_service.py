from sqlalchemy.orm import Session
from app.models import Usuario
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.models.admin import Administrador
from app.schemas.usuario_schema import UsuarioCreate
from app.utils.security import get_password_hash
from app.utils.validators import validar_email_unico, validar_email_creacion_actualizacion, validar_formato_telefono_honduras, validar_telefono_no_vacio, normalizar_telefono_honduras
from app.services.notificacion_service import enviar_notificacion_usuario_creado
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
import traceback
from app.models.visita import Visita


def crear_usuario(db: Session, usuario: UsuarioCreate) -> Usuario:
    try:
        if usuario.rol in ["residente", "guardia", "admin"]:
            validar_telefono_no_vacio(usuario.telefono)
            validar_formato_telefono_honduras(usuario.telefono)
            telefono_normalizado = normalizar_telefono_honduras(usuario.telefono)
        else:
            telefono_normalizado = None
        # Validar email único
        validar_email_unico(db, usuario.email)
        
        # Validar email único (el formato ya se valida en el schema)
        email_normalizado = validar_email_creacion_actualizacion(db, usuario.email)
        
        # Crear usuario base
        db_usuario = Usuario(
            nombre=usuario.nombre,
            email=email_normalizado,
            password_hash=get_password_hash(usuario.password),
            rol=usuario.rol,
            residencial_id=usuario.residencial_id
        )
        
        db.add(db_usuario)
        db.flush()  # Asignar ID sin confirmar transacción
        
        # Crear registro en tabla relacionada según el rol
        if usuario.rol == "residente":
            db_residente = Residente(
                usuario_id=db_usuario.id,
                residencial_id=usuario.residencial_id,
                telefono=telefono_normalizado,
                unidad_residencial=usuario.unidad_residencial
            )
            db.add(db_residente)
        elif usuario.rol == "guardia":
            db_guardia = Guardia(
                usuario_id=db_usuario.id,
                residencial_id=usuario.residencial_id,
                telefono=telefono_normalizado
            )
            db.add(db_guardia)
        elif usuario.rol == "admin":
            db_admin = Administrador(
                usuario_id=db_usuario.id,
                residencial_id=usuario.residencial_id,
                telefono=telefono_normalizado
            )
            db.add(db_admin)
        elif usuario.rol == "super_admin":
            from app.models.super_admin import SuperAdmin
            db_super_admin = SuperAdmin(
                usuario_id=db_usuario.id,
                telefono=telefono_normalizado
            )
            db.add(db_super_admin)
        
        db.commit()
        db.refresh(db_usuario)
        enviar_notificacion_usuario_creado(db_usuario, usuario)
        
        return db_usuario
    except HTTPException as e:
        db.rollback()
        raise e
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error de integridad en la base de datos"
        )
    except Exception as e:
        db.rollback()
        print(f"Error al crear usuario: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail=f"Error al crear usuario: {str(e)}"
        )

def obtener_usuario(db: Session, id: int = None, nombre: str = None, rol: str = None, residencial_id: int = None):
    try:
        query = db.query(Usuario)
        
        # Aplicar filtros si se proporcionan
        if id is not None:
            query = query.filter(Usuario.id == id)
        
        if nombre is not None:
            query = query.filter(Usuario.nombre.ilike(f"%{nombre}%"))
        
        if rol is not None:
            query = query.filter(Usuario.rol == rol)
        
        if residencial_id is not None:
            query = query.filter(Usuario.residencial_id == residencial_id)
        
        usuarios = query.all()
        
        # Construir respuesta con los campos específicos
        usuarios_filtrados = []
        for usuario in usuarios:
            usuario_data = {
                "id": usuario.id,
                "rol": usuario.rol,
                "nombre": usuario.nombre,
                "email": usuario.email,
                "telefono": None,
                "unidad_residencial": None,
                "fecha_creacion": usuario.fecha_creacion,
                "fecha_actualizacion": usuario.fecha_actualizacion,
                "ult_conexion": usuario.ult_conexion
            }
            
            # Obtener información específica según el rol
            if usuario.rol == "residente":
                residente = db.query(Residente).filter(Residente.usuario_id == usuario.id).first()
                if residente:
                    usuario_data["telefono"] = residente.telefono
                    usuario_data["unidad_residencial"] = residente.unidad_residencial
                    usuario_data["residente_id"] = residente.id
            elif usuario.rol == "guardia":
                guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
                if guardia:
                    usuario_data["telefono"] = guardia.telefono
            elif usuario.rol == "admin":
                admin = db.query(Administrador).filter(Administrador.usuario_id == usuario.id).first()
                if admin:
                    usuario_data["telefono"] = admin.telefono
            
            usuarios_filtrados.append(usuario_data)
        
        return usuarios_filtrados
    except Exception as e:
        print(f"Error al obtener usuarios: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail="Error al obtener usuarios"
        )

def obtener_usuario_por_id(db: Session, user_id: int):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return usuario
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener usuario: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail="Error al obtener usuario"
        )

def actualizar_usuario(db: Session, user_id: int, usuario: UsuarioCreate) -> Usuario:
    try:
        db_usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not db_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Validar email único si se está actualizando
        if usuario.email and usuario.email != db_usuario.email:
            email_normalizado = validar_email_creacion_actualizacion(db, usuario.email, user_id)
            db_usuario.email = email_normalizado  # Usar email normalizado
        
        # Validar y normalizar teléfono si corresponde
        telefono_normalizado = None
        if db_usuario.rol in ["residente", "guardia", "admin"] and usuario.telefono:
            validar_telefono_no_vacio(usuario.telefono)
            validar_formato_telefono_honduras(usuario.telefono)
            telefono_normalizado = normalizar_telefono_honduras(usuario.telefono)
        
        # Actualizar campos del usuario base
        update_data = usuario.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "password" and value:
                value = get_password_hash(value)
            if hasattr(db_usuario, field):
                setattr(db_usuario, field, value)
        
        # Actualizar campos específicos según el rol
        if db_usuario.rol == "residente":
            db_residente = db.query(Residente).filter(Residente.usuario_id == user_id).first()
            if db_residente:
                if telefono_normalizado:
                    db_residente.telefono = telefono_normalizado
                if usuario.unidad_residencial:
                    db_residente.unidad_residencial = usuario.unidad_residencial
        elif db_usuario.rol == "guardia":
            db_guardia = db.query(Guardia).filter(Guardia.usuario_id == user_id).first()
            if db_guardia and telefono_normalizado:
                db_guardia.telefono = telefono_normalizado
        elif db_usuario.rol == "admin":
            db_admin = db.query(Administrador).filter(Administrador.usuario_id == user_id).first()
            if db_admin and telefono_normalizado:
                db_admin.telefono = telefono_normalizado
        
        db.commit()
        db.refresh(db_usuario)
        
        # Enviar notificación solo si el rol es residente
        if db_usuario.rol == "residente":
            try:
                enviar_notificacion_usuario_creado(db_usuario, usuario)
            except Exception as e:
                print(f"Error al enviar notificación de actualización de usuario: {str(e)}")
        return db_usuario  
    except HTTPException as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error al actualizar usuario: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar usuario: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail=f"Error al actualizar usuario: {str(e)}"
        )

# Eliminar usuario
def eliminar_usuario(db: Session, user_id: int) -> bool:
    try:
        db_usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not db_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
            
        # Eliminar registros relacionados según el rol
        if db_usuario.rol == "residente":
            residente = db.query(Residente).filter(Residente.usuario_id == user_id).first()
            if residente:
                # Eliminar visitas asociadas al residente
                db.query(Visita).filter(Visita.residente_id == residente.id).delete(synchronize_session=False)
                db.query(Residente).filter(Residente.usuario_id == user_id).delete(synchronize_session=False)
        elif db_usuario.rol == "guardia":
            guardia = db.query(Guardia).filter(Guardia.usuario_id == user_id).first()
            if guardia:
                # Opcional: Desvincular guardias de las visitas en lugar de borrar visitas.
                db.query(Visita).filter(Visita.guardia_id == guardia.id).update({"guardia_id": None})
                db.query(Guardia).filter(Guardia.usuario_id == user_id).delete(synchronize_session=False)
        elif db_usuario.rol == "admin":
            db.query(Administrador).filter(Administrador.usuario_id == user_id).delete(synchronize_session=False)
            
        db.delete(db_usuario)
        db.commit()
        return True
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar usuario: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail=f"Error al eliminar usuario: {str(e)}"
        )
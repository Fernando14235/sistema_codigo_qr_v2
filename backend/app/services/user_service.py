from sqlalchemy.orm import Session
from app.models import Usuario
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.models.admin import Administrador
from app.schemas.usuario_schema import UsuarioCreate
from app.utils.security import get_password_hash
from app.utils.validators import validar_email_unico, validar_email_creacion_actualizacion, validar_formato_telefono_honduras, validar_telefono_no_vacio, normalizar_telefono_honduras
from app.services.notificacion_service import enviar_notificacion_usuario_creado
from app.utils.async_notifications import enviar_notificacion_usuario_creado_async
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
import traceback
from app.models.visita import Visita
from app.utils.time import get_honduras_time


def crear_usuario(db: Session, usuario: UsuarioCreate, usuario_actual=None) -> Usuario:
    try:
        # Determinar residencial_id según el usuario actual
        residencial_id_admin = None
        if usuario_actual and usuario_actual.rol == "admin":
            # Para admins, obtener residencial_id de la tabla administradores
            admin = db.query(Administrador).filter(Administrador.usuario_id == usuario_actual.id).first()
            if admin and admin.residencial_id:
                residencial_id_admin = admin.residencial_id
            else:
                # Fallback: usar residencial_id del usuario si existe
                residencial_id_admin = usuario_actual.residencial_id
                
            if not residencial_id_admin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El administrador {usuario_actual.nombre} (ID: {usuario_actual.id}) no tiene residencial asignada. Contacte al super administrador para asignar una residencial."
                )
        elif usuario_actual and usuario_actual.rol == "super_admin":
            # Super admin puede especificar residencial_id directamente
            residencial_id_admin = getattr(usuario, 'residencial_id', None)
        elif not usuario_actual:
            # Creación sin usuario actual (setup inicial de super_admin)
            residencial_id_admin = getattr(usuario, 'residencial_id', None)
        # Validaciones de teléfono
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
        # Para admins creados por super_admin, usar el residencial_id especificado
        # Para super_admin, siempre usar None independientemente del valor en el request
        if usuario.rol == "super_admin":
            usuario_residencial_id = None
        else:
            usuario_residencial_id = residencial_id_admin if residencial_id_admin else getattr(usuario, 'residencial_id', None)
        db_usuario = Usuario(
            nombre=usuario.nombre,
            email=email_normalizado,
            password_hash=get_password_hash(usuario.password),
            rol=usuario.rol,
            residencial_id=usuario_residencial_id
        )
        db.add(db_usuario)
        db.flush()  # Asignar ID sin confirmar transacción
        # Crear registro en tabla relacionada según el rol
        if usuario.rol == "residente":
            db_residente = Residente(
                usuario_id=db_usuario.id,
                residencial_id=residencial_id_admin if residencial_id_admin else None,
                telefono=telefono_normalizado,
                unidad_residencial=usuario.unidad_residencial
            )
            db.add(db_residente)
        elif usuario.rol == "guardia":
            db_guardia = Guardia(
                usuario_id=db_usuario.id,
                residencial_id=residencial_id_admin if residencial_id_admin else None,
                telefono=telefono_normalizado
            )
            db.add(db_guardia)
        elif usuario.rol == "admin":
            # Para admins, usar el residencial_id determinado anteriormente
            admin_residencial_id = residencial_id_admin if residencial_id_admin else getattr(usuario, 'residencial_id', None)
            db_admin = Administrador(
                usuario_id=db_usuario.id,
                residencial_id=admin_residencial_id,
                telefono=telefono_normalizado,
                unidad_residencial=usuario.unidad_residencial if hasattr(usuario, 'unidad_residencial') else None
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
        try:
            # Enviar notificación de forma asíncrona para no bloquear la respuesta
            enviar_notificacion_usuario_creado_async(db_usuario, usuario)
        except Exception as e:
            print(f"Error al programar envío de notificación de usuario creado: {str(e)}")
            # No fallar la creación del usuario por un error de notificación
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

def obtener_usuario(db: Session, id: int = None, nombre: str = None, rol: str = None, residencial_id: int = None, usuario_actual=None):
    try:
        query = db.query(Usuario)
        # Si el usuario actual es admin, filtrar por su residencial_id
        if usuario_actual and usuario_actual.rol == "admin":
            query = query.filter(Usuario.residencial_id == usuario_actual.residencial_id)
        # Si es super_admin, puede ver todos
        if id is not None:
            query = query.filter(Usuario.id == id)
        if nombre is not None:
            query = query.filter(Usuario.nombre.ilike(f"%{nombre}%"))
        if rol is not None:
            query = query.filter(Usuario.rol == rol)
        if residencial_id is not None:
            query = query.filter(Usuario.residencial_id == residencial_id)
        usuarios = query.all()
        usuarios_filtrados = []
        for usuario in usuarios:
            # No mostrar super_admin a admin
            if usuario_actual and usuario_actual.rol == "admin" and usuario.rol == "super_admin":
                continue
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
                    usuario_data["unidad_residencial"] = admin.unidad_residencial
            usuarios_filtrados.append(usuario_data)
        return usuarios_filtrados
    except Exception as e:
        print(f"Error al obtener usuarios: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail="Error al obtener usuarios"
        )

def obtener_usuario_por_id(db: Session, user_id: int, usuario_actual=None):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        # Si el usuario actual es admin, solo puede ver usuarios de su residencial
        if usuario_actual and usuario_actual.rol == "admin":
            if usuario.residencial_id != usuario_actual.residencial_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para ver este usuario"
                )
            if usuario.rol == "super_admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para ver este usuario"
                )
        
        # Crear el diccionario de datos del usuario
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
        
        # Agregar información específica según el rol
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
                usuario_data["unidad_residencial"] = admin.unidad_residencial
        
        return usuario_data
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener usuario: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail="Error al obtener usuario"
        )

def actualizar_usuario(db: Session, user_id: int, usuario, usuario_actual=None) -> Usuario:
    try:
        db_usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not db_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        residencial_id_admin = None
        # Si el usuario actual es admin, solo puede actualizar usuarios de su residencial
        if usuario_actual and usuario_actual.rol == "admin":
            residencial_id_admin = usuario_actual.residencial_id
            if db_usuario.residencial_id != residencial_id_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para actualizar este usuario"
                )
            if db_usuario.rol == "super_admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para actualizar este usuario"
                )
            
            # Forzar la residencial_id del admin en ambas tablas
            if residencial_id_admin:
                db_usuario.residencial_id = residencial_id_admin
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El administrador no tiene residencial asignada"
                )
        # Validar email único si se está actualizando
        if usuario.email and usuario.email != db_usuario.email:
            email_normalizado = validar_email_creacion_actualizacion(db, usuario.email, user_id)
            db_usuario.email = email_normalizado  # Usar email normalizado
        
        # Validar y normalizar teléfono
        telefono_normalizado = None
        if db_usuario.rol in ["residente", "guardia", "admin"] and usuario.telefono:
            validar_telefono_no_vacio(usuario.telefono)
            validar_formato_telefono_honduras(usuario.telefono)
            telefono_normalizado = normalizar_telefono_honduras(usuario.telefono)
        
        update_data = usuario.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "password" and value:
                value = get_password_hash(value)
            if hasattr(db_usuario, field):
                setattr(db_usuario, field, value)
        
        # Actualizar registros relacionados según el rol
        if db_usuario.rol == "residente":
            db_residente = db.query(Residente).filter(Residente.usuario_id == user_id).first()
            if db_residente:
                if telefono_normalizado:
                    db_residente.telefono = telefono_normalizado
                if usuario.unidad_residencial is not None:
                    db_residente.unidad_residencial = usuario.unidad_residencial
                # Actualizar residencial_id en tabla residentes para mantener consistencia
                if usuario_actual and usuario_actual.rol == "admin" and residencial_id_admin:
                    db_residente.residencial_id = residencial_id_admin
        elif db_usuario.rol == "guardia":
            db_guardia = db.query(Guardia).filter(Guardia.usuario_id == user_id).first()
            if db_guardia:
                if telefono_normalizado:
                    db_guardia.telefono = telefono_normalizado
                # Actualizar residencial_id en tabla guardias para mantener consistencia
                if usuario_actual and usuario_actual.rol == "admin" and residencial_id_admin:
                    db_guardia.residencial_id = residencial_id_admin
        elif db_usuario.rol == "admin":
            db_admin = db.query(Administrador).filter(Administrador.usuario_id == user_id).first()
            if db_admin:
                if telefono_normalizado:
                    db_admin.telefono = telefono_normalizado
                if usuario.unidad_residencial is not None:
                    db_admin.unidad_residencial = usuario.unidad_residencial
                # Actualizar residencial_id en tabla administradores para mantener consistencia
                if usuario_actual and usuario_actual.rol == "admin" and residencial_id_admin:
                    db_admin.residencial_id = residencial_id_admin
        # Actualizar fecha_actualizacion con hora local de Honduras
        db_usuario.fecha_actualizacion = get_honduras_time()
        db.commit()
        db.refresh(db_usuario)
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
def eliminar_usuario(db: Session, user_id: int, usuario_actual=None) -> bool:
    try:
        db_usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not db_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        # Si el usuario actual es admin, solo puede eliminar usuarios de su residencial
        if usuario_actual and usuario_actual.rol == "admin":
            if db_usuario.residencial_id != usuario_actual.residencial_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para eliminar este usuario"
                )
            if db_usuario.rol == "super_admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para eliminar este usuario"
                )
        # Eliminar registros relacionados según el rol
        if db_usuario.rol == "residente":
            residente = db.query(Residente).filter(Residente.usuario_id == user_id).first()
            if residente:
                db.query(Visita).filter(Visita.residente_id == residente.id).delete(synchronize_session=False)
                db.query(Residente).filter(Residente.usuario_id == user_id).delete(synchronize_session=False)
        elif db_usuario.rol == "guardia":
            guardia = db.query(Guardia).filter(Guardia.usuario_id == user_id).first()
            if guardia:
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

def sincronizar_residencial_id(db: Session, usuario_actual=None) -> dict:
    try:
        if not usuario_actual or usuario_actual.rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores pueden sincronizar residencial_id"
            )
        
        if not usuario_actual.residencial_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El administrador no tiene residencial asignada"
            )
        
        admin_residencial_id = usuario_actual.residencial_id
        usuarios_actualizados = 0
        
        # Obtener todos los usuarios de la residencial del admin
        usuarios = db.query(Usuario).filter(Usuario.residencial_id == admin_residencial_id).all()
        
        for usuario in usuarios:
            if usuario.rol == "residente":
                residente = db.query(Residente).filter(Residente.usuario_id == usuario.id).first()
                if residente and residente.residencial_id != admin_residencial_id:
                    residente.residencial_id = admin_residencial_id
                    usuarios_actualizados += 1
                    
            elif usuario.rol == "guardia":
                guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
                if guardia and guardia.residencial_id != admin_residencial_id:
                    guardia.residencial_id = admin_residencial_id
                    usuarios_actualizados += 1
                    
            elif usuario.rol == "admin":
                admin = db.query(Administrador).filter(Administrador.usuario_id == usuario.id).first()
                if admin and admin.residencial_id != admin_residencial_id:
                    admin.residencial_id = admin_residencial_id
                    usuarios_actualizados += 1
        
        db.commit()
        
        return {
            "mensaje": f"Sincronización completada. {usuarios_actualizados} registros actualizados.",
            "usuarios_actualizados": usuarios_actualizados,
            "residencial_id": admin_residencial_id
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al sincronizar residencial_id: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al sincronizar residencial_id: {str(e)}"
        )
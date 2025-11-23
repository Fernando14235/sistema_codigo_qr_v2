from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.utils.security import is_super_admin
from app.services.user_service import crear_usuario
from app.schemas.usuario_schema import UsuarioCreate, Usuario, UsuarioCreateSuperAdmin
from app.models.usuario import Usuario as UsuarioModel
from app.models.admin import Administrador
from app.models.residencial import Residencial
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.utils.security import verify_role
from app.services.vista_service import obtener_configuracion_vistas, asignar_vista_residencial, actualizar_vista_residencial, asignar_vista_admin, actualizar_vista_admin, listar_vistas
from app.schemas.vista_residencial_schema import VistaResidencialCreate, VistaResidencialUpdate
from app.schemas.vista_admin_schema import VistaAdminCreate, VistaAdminUpdate
from app.schemas.vista_config_schema import VistaConfigResponse
from app.models.vista_residencial import VistaResidencial
from app.models.vista_admin import VistaAdmin
from app.models.vista import Vista
from app.services.vista_service import obtener_vistas_admin_con_restricciones
from app.services.vista_service import determinar_vistas_admin

router = APIRouter(prefix="/super-admin", tags=["Super Administrador"])

@router.post("/crear-admin-residencial/{residencial_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def crear_admin_para_residencial(
    residencial_id: int,
    admin_data: UsuarioCreateSuperAdmin,
    db: Session = Depends(get_db)
):
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Verificar que el rol sea admin
    if admin_data.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden crear administradores con este endpoint"
        )
    
    # Convertir a UsuarioCreate agregando el residencial_id
    usuario_create_data = UsuarioCreate(
        nombre=admin_data.nombre,
        email=admin_data.email,
        rol=admin_data.rol,
        password=admin_data.password,
        telefono=admin_data.telefono,
        unidad_residencial=admin_data.unidad_residencial,
        residencial_id=residencial_id
    )
    
    # Crear el administrador
    try:
        nuevo_admin = crear_usuario(db, usuario_create_data)
        return {
            "message": "Administrador creado exitosamente",
            "admin": {
                "id": nuevo_admin.id,
                "nombre": nuevo_admin.nombre,
                "email": nuevo_admin.email,
                "residencial_id": residencial_id,
                "residencial_nombre": residencial.nombre
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear administrador: {str(e)}"
        )

@router.get("/listar-admins", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_administradores(db: Session = Depends(get_db)):

    admins = db.query(UsuarioModel).filter(
        UsuarioModel.rol == "admin"
    ).all()
    
    resultado = []
    for admin in admins:
        residencial_nombre = "Super Admin" if admin.residencial_id is None else "N/A"
        if admin.residencial_id:
            residencial = db.query(Residencial).filter(Residencial.id == admin.residencial_id).first()
            if residencial:
                residencial_nombre = residencial.nombre
        
        # Obtener el teléfono y unidad residencial del administrador
        telefono = None
        unidad_residencial = "N/A"
        admin_info = db.query(Administrador).filter(Administrador.usuario_id == admin.id).first()
        if admin_info:
            telefono = admin_info.telefono
            unidad_residencial = admin_info.unidad_residencial if admin_info.unidad_residencial else "N/A"

        resultado.append({
            "id": admin.id,
            "nombre": admin.nombre,
            "email": admin.email,
            "residencial_id": admin.residencial_id,
            "residencial_nombre": residencial_nombre,
            "fecha_creacion": admin.fecha_creacion,
            "telefono": telefono,
            "unidad_residencial": unidad_residencial
        })
    return resultado

@router.get("/usuarios-residencial/{residencial_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_usuarios_residencial(
    residencial_id: int,
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    rol: Optional[str] = Query(None, description="Filtrar por rol (admin, residente, guardia)"),
    db: Session = Depends(get_db)
):
    """Listar todos los usuarios de una residencial específica con filtros opcionales"""
    
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    resultado = []
    
    # Obtener administradores de la residencial
    admins_query = db.query(UsuarioModel).filter(
        UsuarioModel.rol == "admin",
        UsuarioModel.residencial_id == residencial_id
    )
    if nombre:
        admins_query = admins_query.filter(UsuarioModel.nombre.ilike(f"%{nombre}%"))
    
    admins = admins_query.all()
    for admin in admins:
        admin_info = db.query(Administrador).filter(Administrador.usuario_id == admin.id).first()
        resultado.append({
            "id": admin.id,
            "nombre": admin.nombre,
            "email": admin.email,
            "telefono": admin_info.telefono if admin_info else None,
            "unidad_residencial": admin_info.unidad_residencial if admin_info else None,
            "rol": "admin",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": admin.fecha_creacion
        })
    
    # Obtener residentes de la residencial
    residentes_query = db.query(Residente).filter(
        Residente.residencial_id == residencial_id
    )
    if nombre:
        # Join with Usuario to filter by nombre since Residente doesn't have nombre field
        residentes_query = residentes_query.join(UsuarioModel, Residente.usuario_id == UsuarioModel.id).filter(UsuarioModel.nombre.ilike(f"%{nombre}%"))
    
    residentes = residentes_query.all()
    for residente in residentes:
        resultado.append({
            "id": residente.id,
            "nombre": residente.usuario.nombre,
            "email": residente.usuario.email,
            "telefono": residente.telefono,
            "unidad_residencial": residente.unidad_residencial,
            "rol": "residente",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": residente.usuario.fecha_creacion
        })
    
    # Obtener guardias de la residencial
    guardias_query = db.query(Guardia).filter(
        Guardia.residencial_id == residencial_id
    )
    if nombre:
        # Join with Usuario to filter by nombre since Guardia doesn't have nombre field
        guardias_query = guardias_query.join(UsuarioModel, Guardia.usuario_id == UsuarioModel.id).filter(UsuarioModel.nombre.ilike(f"%{nombre}%"))
    
    guardias = guardias_query.all()
    for guardia in guardias:
        resultado.append({
            "id": guardia.id,
            "nombre": guardia.usuario.nombre,
            "email": guardia.usuario.email,
            "telefono": guardia.telefono,
            "rol": "guardia",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": guardia.usuario.fecha_creacion
        })
    
    # Aplicar filtro por rol si se especifica
    if rol:
        resultado = [usuario for usuario in resultado if usuario["rol"] == rol]
    
    # Ordenar por fecha de creación (más recientes primero)
    resultado.sort(key=lambda x: x["fecha_creacion"], reverse=True)
    
    return {
        "residencial": {
            "id": residencial.id,
            "nombre": residencial.nombre,
            "direccion": residencial.direccion
        },
        "usuarios": resultado,
        "total_usuarios": len(resultado)
    }

@router.get("/listar-residenciales", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_residenciales_super_admin(db: Session = Depends(get_db)):
    residenciales = db.query(Residencial).all()
    
    resultado = []
    for residencial in residenciales:
        # Contar administradores de esta residencial
        admins_count = db.query(UsuarioModel).filter(
            UsuarioModel.rol == "admin",
            UsuarioModel.residencial_id == residencial.id
        ).count()
        
        # Contar residentes de esta residencial
        residentes_count = db.query(Residente).filter(
            Residente.residencial_id == residencial.id
        ).count()
        
        # Contar guardias de esta residencial
        guardias_count = db.query(Guardia).filter(
            Guardia.residencial_id == residencial.id
        ).count()
        
        resultado.append({
            "id": residencial.id,
            "nombre": residencial.nombre,
            "direccion": residencial.direccion,
            "fecha_creacion": residencial.fecha_creacion,
            "estadisticas": {
                "administradores": admins_count,
                "residentes": residentes_count,
                "guardias": guardias_count
            }
        })
    return resultado

# Endpoints para gestión de vistas por residencial
@router.get("/residencial/{residencial_id}/vistas", dependencies=[Depends(verify_role(["super_admin"]))])
def obtener_vistas_residencial(residencial_id: int, db: Session = Depends(get_db)):
    """Obtener las vistas configuradas para una residencial específica"""
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Obtener todas las vistas disponibles
    todas_vistas = db.query(Vista).all()
    
    # Obtener vistas configuradas para esta residencial
    vistas_configuradas = db.query(VistaResidencial).filter(
        VistaResidencial.residencial_id == residencial_id
    ).all()
    
    # Crear diccionario de vistas configuradas
    config_dict = {vr.vista_id: vr.activa for vr in vistas_configuradas}
    
    # Preparar respuesta
    vistas_resultado = []
    for vista in todas_vistas:
        vistas_resultado.append({
            "id": vista.id,
            "nombre": vista.nombre,
            "descripcion": vista.descripcion,
            "activa": config_dict.get(vista.id, True),  # Por defecto activa si no está configurada
            "configurada": vista.id in config_dict
        })
    
    return {
        "residencial": {
            "id": residencial.id,
            "nombre": residencial.nombre
        },
        "vistas": vistas_resultado
    }

@router.post("/residencial/{residencial_id}/vistas/{vista_id}/toggle", dependencies=[Depends(verify_role(["super_admin"]))])
def toggle_vista_residencial(residencial_id: int, vista_id: int, activa: bool, db: Session = Depends(get_db)):
    """Activar o desactivar una vista para una residencial"""
    # Verificar que la residencial y vista existen
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    vista = db.query(Vista).filter(Vista.id == vista_id).first()
    if not vista:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vista no encontrada"
        )
    
    # Buscar configuración existente
    vista_residencial = db.query(VistaResidencial).filter(
        VistaResidencial.residencial_id == residencial_id,
        VistaResidencial.vista_id == vista_id
    ).first()
    
    if vista_residencial:
        # Actualizar configuración existente
        vista_residencial.activa = activa
    else:
        # Crear nueva configuración
        vista_residencial = VistaResidencial(
            residencial_id=residencial_id,
            vista_id=vista_id,
            activa=activa
        )
        db.add(vista_residencial)
    
    # Si se está desactivando la vista a nivel residencial, desactivar automáticamente para todos los administradores de esa residencial
    if not activa:
        # Obtener todos los administradores de esta residencial
        admins_residencial = db.query(Administrador).join(UsuarioModel).filter(
            UsuarioModel.residencial_id == residencial_id
        ).all()
        
        for admin in admins_residencial:
            # Buscar configuración existente del admin para esta vista
            vista_admin = db.query(VistaAdmin).filter(
                VistaAdmin.admin_id == admin.id,
                VistaAdmin.vista_id == vista_id
            ).first()
            
            if vista_admin:
                # Actualizar configuración existente - forzar desactivación
                vista_admin.activa = False
            else:
                # Crear nueva configuración desactivada
                vista_admin = VistaAdmin(
                    admin_id=admin.id,
                    vista_id=vista_id,
                    activa=False
                )
                db.add(vista_admin)
    
    db.commit()
    db.refresh(vista_residencial)
    
    mensaje = f"Vista {'activada' if activa else 'desactivada'} para la residencial"
    if not activa:
        mensaje += " y desactivada automáticamente para todos sus administradores"
    
    return {
        "message": mensaje,
        "vista_residencial": {
            "id": vista_residencial.id,
            "residencial_id": residencial_id,
            "vista_id": vista_id,
            "activa": activa
        }
    }

@router.get("/admin/{admin_id}/vistas", dependencies=[Depends(verify_role(["super_admin"]))])
def obtener_vistas_admin(admin_id: int, db: Session = Depends(get_db)):
    """Obtener las vistas configuradas para un administrador específico con información de restricciones"""
    try:
        # Verificar que el administrador existe
        admin = db.query(Administrador).filter(Administrador.id == admin_id).first()
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador no encontrado"
            )
        
        # Obtener información del usuario del admin
        admin_usuario = db.query(UsuarioModel).filter(UsuarioModel.id == admin.usuario_id).first()
        admin_nombre = admin_usuario.nombre if admin_usuario else "Desconocido"
        
        # Obtener vistas con información completa de restricciones
        vistas_con_restricciones = obtener_vistas_admin_con_restricciones(db, admin_id)
        
        return {
            "admin": {
                "id": admin.id,
                "nombre": admin_nombre
            },
            "vistas": vistas_con_restricciones
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error en obtener_vistas_admin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.post("/admin/{admin_id}/vistas/{vista_id}/toggle", dependencies=[Depends(verify_role(["super_admin"]))])
def toggle_vista_admin(admin_id: int, vista_id: int, activa: bool, db: Session = Depends(get_db)):
    """Activar o desactivar una vista para un administrador"""
    admin = db.query(Administrador).filter(Administrador.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )
    
    vista = db.query(Vista).filter(Vista.id == vista_id).first()
    if not vista:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vista no encontrada"
        )
    
    # Buscar configuración existente
    vista_admin = db.query(VistaAdmin).filter(
        VistaAdmin.admin_id == admin_id,
        VistaAdmin.vista_id == vista_id
    ).first()
    
    if vista_admin:
        # Actualizar configuración existente
        vista_admin.activa = activa
    else:
        # Crear nueva configuración
        vista_admin = VistaAdmin(
            admin_id=admin_id,
            vista_id=vista_id,
            activa=activa
        )
        db.add(vista_admin)
    
    db.commit()
    db.refresh(vista_admin)
    
    return {
        "message": f"Vista {'activada' if activa else 'desactivada'} para el administrador",
        "vista_admin": {
            "id": vista_admin.id,
            "admin_id": admin_id,
            "vista_id": vista_id,
            "activa": activa
        }
    }

@router.get("/residencial/{residencial_id}/admins", dependencies=[Depends(verify_role(["super_admin"]))])
def obtener_admins_residencial(residencial_id: int, db: Session = Depends(get_db)):
    """Obtener todos los administradores de una residencial específica"""
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Obtener administradores de la residencial
    admins = db.query(Administrador).join(UsuarioModel).filter(
        UsuarioModel.residencial_id == residencial_id
    ).all()
    
    resultado = []
    for admin in admins:
        resultado.append({
            "id": admin.id,
            "usuario_id": admin.usuario_id,
            "nombre": admin.usuario.nombre if admin.usuario else "Desconocido",
            "email": admin.usuario.email if admin.usuario else "Desconocido",
            "telefono": admin.telefono,
            "unidad_residencial": admin.unidad_residencial
        })
    
    return {
        "residencial": {
            "id": residencial.id,
            "nombre": residencial.nombre
        },
        "administradores": resultado
    }

@router.post("/crear-vistas-default", dependencies=[Depends(verify_role(["super_admin"]))])
def crear_vistas_por_defecto(db: Session = Depends(get_db)):
    """Crear vistas por defecto del sistema"""
    vistas_existentes = db.query(Vista).count()
    if vistas_existentes > 0:
        return {
            "message": f"Ya existen {vistas_existentes} vistas en el sistema",
            "vistas_existentes": vistas_existentes
        }
    
    # Vistas por defecto del sistema
    vistas_default = [
        {
            "nombre": "Gestión de Usuarios",
            "descripcion": "Permite crear, editar, eliminar y listar usuarios del sistema"
        },
        {
            "nombre": "Crear Usuario",
            "descripcion": "Formulario para agregar nuevos usuarios al sistema"
        },
        {
            "nombre": "Estadísticas",
            "descripcion": "Dashboard con estadísticas y métricas del sistema"
        },
        {
            "nombre": "Historial de Escaneos",
            "descripcion": "Registro completo de todos los escaneos QR realizados"
        },
        {
            "nombre": "Historial de Visitas",
            "descripcion": "Historial completo de todas las visitas registradas"
        },
        {
            "nombre": "Crear Visita",
            "descripcion": "Formulario para crear nuevas visitas con código QR"
        },
        {
            "nombre": "Mis Visitas",
            "descripcion": "Gestión de visitas propias del administrador"
        },
        {
            "nombre": "Social",
            "descripcion": "Gestión de contenido social y comunicaciones"
        },
        {
            "nombre": "Tickets de Soporte",
            "descripcion": "Sistema de gestión de tickets de soporte técnico"
        },
        {
            "nombre": "Solicitudes Pendientes",
            "descripcion": "Revisión y aprobación de solicitudes de visita"
        }
    ]
    
    try:
        vistas_creadas = []
        for vista_data in vistas_default:
            vista = Vista(
                nombre=vista_data["nombre"],
                descripcion=vista_data["descripcion"]
            )
            db.add(vista)
            vistas_creadas.append(vista_data["nombre"])
        
        db.commit()
        
        return {
            "message": f"Se crearon {len(vistas_default)} vistas por defecto exitosamente",
            "vistas_creadas": vistas_creadas
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear vistas: {str(e)}"
        )

@router.put("/asignar-residencial-admin/{admin_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def asignar_residencial_admin(admin_id: int, residencial_id: int, db: Session = Depends(get_db)):
    """Asignar una residencial a un administrador existente"""
    
    # Verificar que el administrador existe
    admin_usuario = db.query(UsuarioModel).filter(
        UsuarioModel.id == admin_id,
        UsuarioModel.rol == "admin"
    ).first()
    
    if not admin_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )
    
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Obtener el registro de administrador
    admin_info = db.query(Administrador).filter(Administrador.usuario_id == admin_id).first()
    if not admin_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de administrador no encontrado"
        )
    
    try:
        # Actualizar residencial_id en la tabla usuarios
        admin_usuario.residencial_id = residencial_id
        
        # Actualizar residencial_id en la tabla administradores
        admin_info.residencial_id = residencial_id
        
        db.commit()
        
        return {
            "message": f"Residencial asignada exitosamente al administrador {admin_usuario.nombre}",
            "admin": {
                "id": admin_usuario.id,
                "nombre": admin_usuario.nombre,
                "email": admin_usuario.email,
                "residencial_id": residencial_id,
                "residencial_nombre": residencial.nombre
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asignar residencial: {str(e)}"
        )

@router.get("/debug/vistas", dependencies=[Depends(verify_role(["super_admin"]))])
def debug_vistas_sistema(db: Session = Depends(get_db)):
    """Endpoint de debug para verificar el estado de las vistas"""
    
    # Contar vistas totales
    total_vistas = db.query(Vista).count()
    
    # Obtener todas las vistas
    vistas = db.query(Vista).all()
    vistas_info = [{"id": v.id, "nombre": v.nombre, "descripcion": v.descripcion} for v in vistas]
    
    # Contar configuraciones
    total_config_residencial = db.query(VistaResidencial).count()
    total_config_admin = db.query(VistaAdmin).count()
    
    # Obtener primer admin para prueba
    primer_admin = db.query(Administrador).first()
    vistas_admin_ejemplo = []
    
    if primer_admin:
        try:
            vistas_admin_ejemplo = determinar_vistas_admin(db, primer_admin.id)
            vistas_admin_ejemplo = [{"id": v.id, "nombre": v.nombre, "activa": v.activa} for v in vistas_admin_ejemplo]
        except Exception as e:
            vistas_admin_ejemplo = [{"error": str(e)}]
    
    return {
        "total_vistas": total_vistas,
        "vistas_disponibles": vistas_info,
        "configuraciones_residencial": total_config_residencial,
        "configuraciones_admin": total_config_admin,
        "ejemplo_admin_id": primer_admin.id if primer_admin else None,
        "vistas_admin_ejemplo": vistas_admin_ejemplo
    }
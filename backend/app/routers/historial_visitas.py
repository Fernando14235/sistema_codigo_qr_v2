from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.utils.security import verify_role, get_current_user, get_current_residencial_id
from app.models.residente import Residente
from app.models.usuario import Usuario
from app.models.visita import Visita
from app.models.visitante import Visitante
from app.models.guardia import Guardia
from app.schemas.visita_schema import HistorialVisitaResponse, HistorialVisitaItem, HistorialEscaneosDiaResponse, HistorialEscaneosTotalesResponse
from app.schemas.auth_schema import TokenData
from app.services.visita_service import obtener_historial_escaneos_dia, obtener_historial_escaneos_totales

router = APIRouter(prefix="/visitas", tags=["Visitas"])

@router.get("/admin/historial", response_model=HistorialVisitaResponse)
def obtener_historial_visitas_admin(
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(verify_role(["admin"])),
    residencial_id: int = Depends(get_current_residencial_id),
    nombre_residente: Optional[str] = Query(None, description="Filtrar por nombre del residente"),
    unidad_residencial: Optional[str] = Query(None, description="Filtrar por unidad residencial"),
    nombre_visitante: Optional[str] = Query(None, description="Filtrar por nombre del visitante"),
    estado: Optional[str] = Query(None, description="Filtrar por nombre del visitante")
):

    # Construir consulta con joins y filtro por residencial_id
    query = db.query(Residente, Usuario, Visita, Visitante)\
              .join(Usuario, Usuario.id == Residente.usuario_id)\
              .join(Visita, Visita.residente_id == Residente.id)\
              .join(Visitante, Visitante.id == Visita.visitante_id)\
              .filter(Residente.residencial_id == residencial_id)

    # Aplicar filtros si se proporcionan
    if nombre_residente:
        query = query.filter(Usuario.nombre.ilike(f"%{nombre_residente}%"))
    if unidad_residencial:
        query = query.filter(Residente.unidad_residencial.ilike(f"%{unidad_residencial}%"))
    if nombre_visitante:
        query = query.filter(Visitante.nombre_conductor.ilike(f"%{nombre_visitante}%"))
    if estado:
        query = query.filter(Visita.estado == estado)

    # Ejecutar la consulta ordenada
    resultados = query.order_by(Visita.fecha_entrada.desc()).all()

    # Armar respuesta
    historial = [
        HistorialVisitaItem(
            nombre_residente=usuario_obj.nombre,
            telefono_residente=residente.telefono,
            unidad_residencial=residente.unidad_residencial,
            fecha_entrada=visita.fecha_entrada,
            nombre_visitante=visitante.nombre_conductor,
            tipo_vehiculo=visitante.tipo_vehiculo,
            placa_vehiculo=visitante.placa_vehiculo,
            marca_vehiculo=visitante.marca_vehiculo,
            color_vehiculo=visitante.color_vehiculo,
            motivo_visita=visitante.motivo_visita,
            fecha_salida=visita.fecha_salida,
            estado=visita.estado
        )
        for residente, usuario_obj, visita, visitante in resultados
    ]

    return HistorialVisitaResponse(visitas=historial)

@router.get("/admin/escaneos-dia", response_model=HistorialEscaneosDiaResponse)
def obtener_escaneos_dia_admin(
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(verify_role(["admin"])),
    residencial_id: int = Depends(get_current_residencial_id),
    nombre_guardia: Optional[str] = Query(None, description="Nombre del guardia para filtrar los escaneos"),
    #estado_escaneo: Optional[str] = Query(None, description="Tipo de escaneo (entrada/salida)")
):
    return obtener_historial_escaneos_dia(db, residencial_id=residencial_id, nombre_guardia=nombre_guardia)

@router.get("/admin/escaneos-totales", response_model=HistorialEscaneosTotalesResponse)
def obtener_escaneos_totales_admin(
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(verify_role(["admin"])),
    residencial_id: int = Depends(get_current_residencial_id),
    nombre_guardia: Optional[str] = Query(None, description="Nombre del guardia para filtrar los escaneos"),
    tipo_escaneo: Optional[str] = Query(None, description="Filtrar por tipo de escaneo (entrada/salida)"),
    estado_visita: Optional[str] = Query(None, description="Filtrar por estado de la visita")
):
    return obtener_historial_escaneos_totales(
        db,
        residencial_id=residencial_id,
        nombre_guardia=nombre_guardia,
        tipo_escaneo=tipo_escaneo,
        estado_visita=estado_visita
    )

@router.get("/guardia/escaneos-dia", response_model=HistorialEscaneosDiaResponse)
def obtener_escaneos_dia_guardia(
    db: Session = Depends(get_db),
    usuario_actual: TokenData = Depends(get_current_user)
):
    # Verificar que el usuario sea guardia
    if usuario_actual.rol != "guardia":
        raise HTTPException(status_code=403, detail="Solo los guardias pueden acceder a este endpoint")
    
    # Obtener el guardia
    guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario_actual.id).first()
    if not guardia:
        raise HTTPException(status_code=404, detail="Guardia no encontrado")
    
    return obtener_historial_escaneos_dia(db, guardia_id=guardia.id, residencial_id=guardia.residencial_id)
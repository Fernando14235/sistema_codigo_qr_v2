from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_
from datetime import datetime, timezone, timedelta
from typing import Dict, List
from app.models.visita import Visita
from app.models.escaneo_qr import EscaneoQR
from app.models.visitante import Visitante
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.models.usuario import Usuario
from app.models.admin import Administrador
from app.schemas.estadisticas_schema import (
    EstadisticasGenerales, EstadisticaEstado, EstadisticaHorario,
    EstadisticaGuardia, EstadisticaVehiculo, EstadisticaResidente
)

def to_utc(dt: datetime) -> datetime:
    """Convierte una fecha a UTC"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def obtener_estadisticas_generales(db: Session, residencial_id: int) -> EstadisticasGenerales:
    """Obtiene estadísticas generales del sistema filtradas por residencial"""
    now_utc = datetime.now(timezone.utc)
    fecha_inicio = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Estadísticas de visitas filtradas por residencial
    visitas_query = db.query(Visita).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(Residente.residencial_id == residencial_id)
    
    total_visitas = visitas_query.count()
    visitas_pendientes = visitas_query.filter(Visita.estado == "pendiente").count()
    visitas_aprobadas = visitas_query.filter(Visita.estado == "aprobado").count()
    visitas_completadas = visitas_query.filter(Visita.estado == "completado").count()
    visitas_rechazadas = visitas_query.filter(Visita.estado == "rechazado").count()
    visitas_expiradas = visitas_query.filter(Visita.estado == "expirado").count()
    
    # Estadísticas de escaneos del día filtradas por residencial
    escaneos_query = db.query(EscaneoQR).join(
        Visita, EscaneoQR.visita_id == Visita.id
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(
        EscaneoQR.fecha_escaneo >= fecha_inicio,
        Residente.residencial_id == residencial_id
    )
    
    total_escaneos_hoy = escaneos_query.count()
    
    # Escaneos de entrada vs salida del día
    escaneos_hoy = escaneos_query.join(
        Visita, EscaneoQR.visita_id == Visita.id
    ).all()
    
    escaneos_entrada_hoy = 0
    escaneos_salida_hoy = 0
    
    for escaneo in escaneos_hoy:
        fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
        if escaneo.visita.fecha_salida and fecha_escaneo_utc >= to_utc(escaneo.visita.fecha_salida):
            escaneos_salida_hoy += 1
        else:
            escaneos_entrada_hoy += 1
    
    return EstadisticasGenerales(
        total_visitas=total_visitas,
        visitas_pendientes=visitas_pendientes,
        visitas_aprobadas=visitas_aprobadas,
        visitas_completadas=visitas_completadas,
        visitas_rechazadas=visitas_rechazadas,
        visitas_expiradas=visitas_expiradas,
        total_escaneos_hoy=total_escaneos_hoy,
        escaneos_entrada_hoy=escaneos_entrada_hoy,
        escaneos_salida_hoy=escaneos_salida_hoy
    )

def obtener_estadisticas_estados(db: Session, residencial_id: int) -> List[EstadisticaEstado]:
    """Obtiene estadísticas por estado de visita filtradas por residencial"""
    resultados = db.query(
        Visita.estado,
        func.count(Visita.id).label('cantidad')
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(
        Residente.residencial_id == residencial_id
    ).group_by(Visita.estado).all()
    
    total_visitas = sum(r.cantidad for r in resultados)
    
    estadisticas = []
    for estado, cantidad in resultados:
        porcentaje = (cantidad / total_visitas * 100) if total_visitas > 0 else 0
        estadisticas.append(EstadisticaEstado(
            estado=estado,
            cantidad=cantidad,
            porcentaje=round(porcentaje, 2)
        ))
    
    return estadisticas

def obtener_estadisticas_horarios(db: Session, residencial_id: int) -> List[EstadisticaHorario]:
    """Obtiene estadísticas de actividad por hora filtradas por residencial"""
    now_utc = datetime.now(timezone.utc)
    fecha_inicio = now_utc.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=7)
    
    # Obtener escaneos de la última semana filtrados por residencial
    escaneos = db.query(EscaneoQR, Visita).join(
        Visita, EscaneoQR.visita_id == Visita.id
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(
        EscaneoQR.fecha_escaneo >= fecha_inicio,
        Residente.residencial_id == residencial_id
    ).all()
    
    # Agrupar por hora
    horarios = {}
    for i in range(24):
        horarios[i] = {"entradas": 0, "salidas": 0}
    
    for escaneo, visita in escaneos:
        fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
        hora = fecha_escaneo_utc.hour
        
        if visita.fecha_salida and fecha_escaneo_utc >= to_utc(visita.fecha_salida):
            horarios[hora]["salidas"] += 1
        else:
            horarios[hora]["entradas"] += 1
    
    return [
        EstadisticaHorario(
            hora=hora,
            cantidad_entradas=datos["entradas"],
            cantidad_salidas=datos["salidas"]
        )
        for hora, datos in horarios.items()
    ]

def obtener_estadisticas_guardias(db: Session, residencial_id: int) -> List[EstadisticaGuardia]:
    """Obtiene estadísticas de actividad por guardia filtradas por residencial"""
    now_utc = datetime.now(timezone.utc)
    fecha_inicio = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Obtener escaneos del día por guardia filtrados por residencial
    resultados = db.query(
        EscaneoQR.guardia_id,
        func.count(EscaneoQR.id).label('total_escaneos')
    ).join(
        Visita, EscaneoQR.visita_id == Visita.id
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(
        EscaneoQR.fecha_escaneo >= fecha_inicio,
        Residente.residencial_id == residencial_id
    ).group_by(EscaneoQR.guardia_id).all()
    
    estadisticas = []
    for guardia_id, total_escaneos in resultados:
        # Obtener nombre del guardia
        guardia = db.query(Guardia).filter(Guardia.id == guardia_id).first()
        nombre_guardia = guardia.usuario.nombre if guardia and guardia.usuario else f"Guardia {guardia_id}"
        
        # Calcular entradas vs salidas
        escaneos_guardia = db.query(EscaneoQR, Visita).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Residente, Visita.residente_id == Residente.id
        ).filter(
            EscaneoQR.guardia_id == guardia_id,
            EscaneoQR.fecha_escaneo >= fecha_inicio,
            Residente.residencial_id == residencial_id
        ).all()
        
        escaneos_entrada = 0
        escaneos_salida = 0
        
        for escaneo, visita in escaneos_guardia:
            fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
            if visita.fecha_salida and fecha_escaneo_utc >= to_utc(visita.fecha_salida):
                escaneos_salida += 1
            else:
                escaneos_entrada += 1
        
        estadisticas.append(EstadisticaGuardia(
            guardia_id=guardia_id,
            nombre_guardia=nombre_guardia,
            total_escaneos=total_escaneos,
            escaneos_entrada=escaneos_entrada,
            escaneos_salida=escaneos_salida
        ))
    
    return estadisticas

def obtener_estadisticas_vehiculos(db: Session, residencial_id: int) -> List[EstadisticaVehiculo]:
    """Obtiene estadísticas de tipos de vehículos filtradas por residencial"""
    resultados = db.query(
        Visitante.tipo_vehiculo,
        func.count(Visitante.id).label('cantidad')
    ).join(
        Visita, Visitante.id == Visita.visitante_id
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).filter(
        Residente.residencial_id == residencial_id
    ).group_by(Visitante.tipo_vehiculo).all()
    
    total_vehiculos = sum(r.cantidad for r in resultados)
    
    estadisticas = []
    for tipo_vehiculo, cantidad in resultados:
        porcentaje = (cantidad / total_vehiculos * 100) if total_vehiculos > 0 else 0
        estadisticas.append(EstadisticaVehiculo(
            tipo_vehiculo=tipo_vehiculo,
            cantidad=cantidad,
            porcentaje=round(porcentaje, 2)
        ))
    
    return estadisticas

def obtener_estadisticas_residentes(db: Session, residencial_id: int) -> List[EstadisticaResidente]:
    """Obtiene estadísticas de residentes más activos filtradas por residencial"""
    resultados = db.query(
        Residente.id,
        func.count(Visita.id).label('total_visitas')
    ).filter(
        Residente.residencial_id == residencial_id
    ).join(
        Visita, Residente.id == Visita.residente_id
    ).group_by(Residente.id).order_by(
        func.count(Visita.id).desc()
    ).limit(10).all()
    
    estadisticas = []
    for residente_id, total_visitas in resultados:
        residente = db.query(Residente).filter(Residente.id == residente_id).first()
        if residente:
            estadisticas.append(EstadisticaResidente(
                residente_id=residente_id,
                nombre_residente=residente.usuario.nombre if residente.usuario else f"Residente {residente_id}",
                unidad_residencial=residente.unidad_residencial,
                total_visitas=total_visitas
            ))
    
    return estadisticas

def obtener_estadisticas_completas(db: Session, residencial_id: int) -> Dict:
    """Obtiene todas las estadísticas del sistema filtradas por residencial"""
    return {
        "estadisticas_generales": obtener_estadisticas_generales(db, residencial_id),
        "estados_visitas": obtener_estadisticas_estados(db, residencial_id),
        "horarios_actividad": obtener_estadisticas_horarios(db, residencial_id),
        "guardias_actividad": obtener_estadisticas_guardias(db, residencial_id),
        "vehiculos_frecuentes": obtener_estadisticas_vehiculos(db, residencial_id),
        "residentes_activos": obtener_estadisticas_residentes(db, residencial_id)
    } 
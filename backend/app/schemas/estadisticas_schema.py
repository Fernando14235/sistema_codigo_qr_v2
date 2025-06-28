from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class EstadisticaEstado(BaseModel):
    estado: str
    cantidad: int
    porcentaje: float

class EstadisticaHorario(BaseModel):
    hora: int
    cantidad_entradas: int
    cantidad_salidas: int

class EstadisticaGuardia(BaseModel):
    guardia_id: int
    nombre_guardia: str
    total_escaneos: int
    escaneos_entrada: int
    escaneos_salida: int

class EstadisticaVehiculo(BaseModel):
    tipo_vehiculo: str
    cantidad: int
    porcentaje: float

class EstadisticaResidente(BaseModel):
    residente_id: int
    nombre_residente: str
    unidad_residencial: str
    total_visitas: int

class EstadisticasGenerales(BaseModel):
    total_visitas: int
    visitas_pendientes: int
    visitas_aprobadas: int
    visitas_completadas: int
    visitas_rechazadas: int
    visitas_expiradas: int
    total_escaneos_hoy: int
    escaneos_entrada_hoy: int
    escaneos_salida_hoy: int

class EstadisticasResponse(BaseModel):
    fecha_consulta: datetime
    estadisticas_generales: EstadisticasGenerales
    estados_visitas: List[EstadisticaEstado]
    horarios_actividad: List[EstadisticaHorario]
    guardias_actividad: List[EstadisticaGuardia]
    vehiculos_frecuentes: List[EstadisticaVehiculo]
    residentes_activos: List[EstadisticaResidente] 
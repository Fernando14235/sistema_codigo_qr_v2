import re
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Usuario, Visitante, Visita
from fastapi import HTTPException, status

# VALIDACIONES DE CORREO ELECTRONICO
def validar_email_unico(db: Session, email: str, usuario_id: Optional[int] = None) -> None:
    query = db.query(Usuario).filter(Usuario.email == email)
    if usuario_id:
        query = query.filter(Usuario.id != usuario_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El email ya está registrado"
        )

def validar_email_creacion_actualizacion(db: Session, email: str, usuario_id: Optional[int] = None) -> str:
    email_normalizado = email.strip().lower()
    validar_email_unico(db, email_normalizado, usuario_id)
    return email_normalizado

# VALIDACIONES CON EL DNI DE LA PERSONA
def validar_dni_visita_unico(db: Session, dni: str, fecha: datetime) -> None:
    # Convertir la fecha a inicio y fin del día
    inicio_dia = datetime.combine(fecha.date(), datetime.min.time())
    fin_dia = datetime.combine(fecha.date(), datetime.max.time())
    
    # Buscar visitas existentes con el mismo DNI en la misma fecha
    visita_existente = db.query(Visita).join(Visitante).filter(
        Visitante.dni_conductor == dni,
        Visita.fecha_entrada >= inicio_dia,
        Visita.fecha_entrada <= fin_dia
    ).first()
    
    if visita_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una visita registrada para este DNI en la fecha especificada"
        )

# VALIDACIONES CON EL NUMERO DE TELEFONO
def validar_formato_telefono_internacional(telefono: str) -> None:
    """
    Valida formato de teléfono internacional
    Acepta números de cualquier país con formato +[código país][número]
    """
    # Validar que no esté vacio
    if not telefono or not telefono.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono no puede estar vacío"
        )
    
    # Remover espacios, guiones y paréntesis para validación
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono.strip())
    
    # Patrón para teléfonos internacionales: +[código país][número]
    # Código de país: 1-4 dígitos, número: 4-15 dígitos
    patron = r'^\+[1-9]\d{0,3}\d{4,15}$'
    
    if not re.match(patron, telefono_limpio):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de teléfono inválido. Use el formato internacional: +[código país][número] (ej: +50412345678, +14155552671)"
        )
    
    # Validar longitud total (mínimo 8, máximo 18 caracteres incluyendo el +)
    if len(telefono_limpio) < 8 or len(telefono_limpio) > 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de teléfono debe tener entre 8 y 18 caracteres"
        )

def normalizar_telefono_internacional(telefono: str) -> str:
    """
    Normaliza teléfono internacional removiendo espacios, guiones y paréntesis
    Mantiene el formato +[código país][número]
    """
    if not telefono or not telefono.strip():
        raise ValueError("El teléfono no puede estar vacío")
    
    # Remover espacios, guiones y paréntesis
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono.strip())
    
    # Verificar que empiece con +
    if not telefono_limpio.startswith('+'):
        raise ValueError("El teléfono debe incluir el código de país con el signo +")
    
    # Validar formato internacional
    patron = r'^\+[1-9]\d{0,3}\d{4,15}$'
    if not re.match(patron, telefono_limpio):
        raise ValueError("Formato de teléfono internacional inválido")
    
    return telefono_limpio

# Mantener funciones legacy para compatibilidad
def validar_formato_telefono_honduras(telefono: str) -> None:
    """Función legacy - ahora usa validación internacional"""
    validar_formato_telefono_internacional(telefono)

def normalizar_telefono_honduras(telefono: str) -> str:
    """Función legacy - ahora usa normalización internacional"""
    return normalizar_telefono_internacional(telefono)

def validar_telefono_no_vacio(telefono: str) -> None:
    if not telefono or not telefono.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono es obligatorio y no puede estar vacío"
        )

def validar_formato_telefono_internacional_bool(telefono: str) -> bool:
    """
    Valida formato de teléfono internacional genérico
    Retorna True si es válido, False si no
    """
    if not telefono or not telefono.strip():
        return False
    
    # Remover espacios, guiones y paréntesis
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono.strip())
    
    # Patrón para teléfonos internacionales: +[código país][número]
    patron = r'^\+[1-9]\d{0,3}\d{4,15}$'
    return bool(re.match(patron, telefono_limpio)) and len(telefono_limpio) >= 8 and len(telefono_limpio) <= 18

def validar_formato_telefono_honduras_bool(telefono: str) -> bool:
    """
    Valida el formato de teléfono para Honduras (versión que retorna boolean)
    """
    if not telefono or not telefono.strip():
        return False
    
    # Remover espacios y guiones para validación
    telefono_limpio = re.sub(r'[\s\-]', '', telefono.strip())
    
    # Patrones válidos para Honduras (cualquier dígito, no solo 9)
    patrones_validos = [
        r'^\+504\d{8}$',  # +504XXXXXXXX
        r'^\+504\s?\d{8}$',  # +504 XXXXXXXX o +504XXXXXXXX
        r'^\d{8}$',  # XXXXXXXX
    ]
    
    # Verificar si coincide con algún patrón válido
    return any(re.match(patron, telefono_limpio) for patron in patrones_validos)

# Validación de email antes de enviar notificación
def validar_email_notificacion(db: Session, email: str) -> None:
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El email del destinatario no está registrado en el sistema"
        ) 
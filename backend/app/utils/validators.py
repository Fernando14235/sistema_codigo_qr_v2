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
def validar_formato_telefono_honduras(telefono: str) -> None:
    # Validar que no esté vacio
    if not telefono or not telefono.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono no puede estar vacío"
        )
    
    # Remover espacios y guiones para validación
    telefono_limpio = re.sub(r'[\s\-]', '', telefono.strip())
    
    # Patrones válidos para Honduras (cualquier dígito, no solo 9)
    patrones_validos = [
        r'^\+504\d{8}$',  # +504XXXXXXXX
        r'^\+504\s?\d{8}$',  # +504 XXXXXXXX o +504XXXXXXXX
        r'^\d{8}$',  # XXXXXXXX
    ]
    
    # Verificar si coincide con algún patrón válido
    formato_valido = any(re.match(patron, telefono_limpio) for patron in patrones_validos)
    
    if not formato_valido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de teléfono inválido para Honduras. Use el formato: +504XXXXXXXX o XXXXXXXX"
        )

def normalizar_telefono_honduras(telefono: str) -> str:
    if not telefono or not telefono.strip():
        raise ValueError("El teléfono no puede estar vacío")
    
    # Remover espacios, guiones y paréntesis
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono.strip())
    
    # Si ya tiene el código de país, solo verificar que tenga 8 dígitos
    if telefono_limpio.startswith('+504'):
        numero = telefono_limpio[4:]  # Remover +504
        if len(numero) == 8 and numero.isdigit():
            return f"+504{numero}"
        else:
            raise ValueError("Número inválido después del código de país")
    
    # Si no tiene codigo de pais, agregarlo junto con el numero
    elif len(telefono_limpio) == 8 and telefono_limpio.isdigit():
        return f"+504{telefono_limpio}"
    
    else:
        raise ValueError("Formato de teléfono inválido")

def validar_telefono_no_vacio(telefono: str) -> None:
    if not telefono or not telefono.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono es obligatorio y no puede estar vacío"
        )

def validar_formato_telefono_internacional(telefono: str) -> bool:
    """
    Valida formato de teléfono internacional genérico
    Retorna True si es válido, False si no
    """
    if not telefono or not telefono.strip():
        return False
    
    # Remover espacios, guiones y paréntesis
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono.strip())
    
    # Patrón para teléfonos internacionales: +[código país][número]
    patron = r'^\+[1-9]\d{9,14}$'
    return bool(re.match(patron, telefono_limpio))

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
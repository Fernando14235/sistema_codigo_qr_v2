from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from typing import Optional, List
from app.models import Ticket, Usuario, Residente, EstadoTicket
from app.schemas import TicketUpdate
from datetime import datetime
import shutil
import os
from app.utils.time import get_current_time
from app.services.notificacion_service import notificar_admin_ticket_creado_email, notificar_residente_ticket_actualizado_email
import uuid

UPLOAD_DIR = "uploads/tickets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def crear_ticket_service(titulo: str, descripcion: str, imagen: Optional[UploadFile], db: Session, usuario_actual: Usuario) -> Ticket:
    # Obtener el residente asociado al usuario autenticado
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_actual.id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado para este usuario")

    imagen_url = None
    if imagen:
        ext = os.path.splitext(imagen.filename)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(imagen.file, buffer)
        imagen_url = f"/uploads/tickets/{unique_name}"

    ticket = Ticket(
        residente_id=residente.id,
        titulo=titulo,
        descripcion=descripcion,
        imagen_url=imagen_url,
        estado=EstadoTicket.pendiente,
        fecha_creacion=get_current_time()
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notificar a los administradores por correo
    notificar_admin_ticket_creado_email(db, ticket, residente.usuario.nombre)
    return ticket

def listar_tickets_service(estado: Optional[EstadoTicket], skip: int, limit: int, db: Session, residencial_id: int = None) -> List[dict]:
    query = db.query(Ticket, Residente).join(Residente, Ticket.residente_id == Residente.id)
    
    # Filtrar por residencial_id si se proporciona
    if residencial_id:
        query = query.filter(Residente.residencial_id == residencial_id)
    
    if estado:
        query = query.filter(Ticket.estado == estado)
    results = query.order_by(Ticket.fecha_creacion.desc()).offset(skip).limit(limit).all()
    tickets = []
    for ticket, residente in results:
        tickets.append({
            "id": ticket.id,
            "titulo": ticket.titulo,
            "descripcion": ticket.descripcion,
            "imagen_url": ticket.imagen_url,
            "estado": ticket.estado,
            "fecha_creacion": ticket.fecha_creacion,
            "fecha_respuesta": ticket.fecha_respuesta,
            "respuesta_admin": ticket.respuesta_admin,
            "residente_id": ticket.residente_id,
            "nombre_residente": residente.usuario.nombre if residente.usuario else None
        })
    return tickets

def listar_tickets_residente_service(db: Session, usuario_actual: Usuario):
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_actual.id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado para este usuario")
    tickets = db.query(Ticket).filter(Ticket.residente_id == residente.id).order_by(Ticket.fecha_creacion.desc()).all()
    return tickets

def obtener_ticket_service(ticket_id: int, db: Session, usuario_actual: Usuario) -> dict:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if usuario_actual.rol == "residente":
        residente = db.query(Residente).filter(Residente.id == ticket.residente_id).first()
        if not residente or residente.usuario_id != usuario_actual.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este ticket")
    else:
        residente = db.query(Residente).filter(Residente.id == ticket.residente_id).first()

    return {
        "id": ticket.id,
        "titulo": ticket.titulo,
        "descripcion": ticket.descripcion,
        "imagen_url": ticket.imagen_url,
        "estado": ticket.estado,
        "fecha_creacion": ticket.fecha_creacion,
        "fecha_respuesta": ticket.fecha_respuesta,
        "respuesta_admin": ticket.respuesta_admin,
        "residente_id": ticket.residente_id,
        "nombre_residente": residente.usuario.nombre if residente and residente.usuario else None
    }

def actualizar_ticket_service(ticket_id: int, datos: TicketUpdate, db: Session) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    if datos.titulo is not None:
        ticket.titulo = datos.titulo
    if datos.descripcion is not None:
        ticket.descripcion = datos.descripcion
    if datos.estado is not None:
        ticket.estado = datos.estado
        ticket.fecha_respuesta = get_current_time()
    if datos.respuesta_admin is not None:
        ticket.respuesta_admin = datos.respuesta_admin
    if datos.imagen_url is not None:
        ticket.imagen_url = datos.imagen_url

    db.commit()
    db.refresh(ticket)

    # Notificar al residente por correo si hay respuesta o cambio de estado
    if datos.estado is not None or datos.respuesta_admin is not None:
        notificar_residente_ticket_actualizado_email(db, ticket)

    return ticket
def eliminar_ticket_service(ticket_id: int, db: Session, usuario_actual: Usuario) -> dict:
    """
    Elimina un ticket. 
    - Super admin: puede eliminar cualquier ticket
    - Admin: puede eliminar tickets de su residencial
    - Residente: puede eliminar solo sus propios tickets
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Obtener el residente asociado al ticket
    residente = db.query(Residente).filter(Residente.id == ticket.residente_id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente asociado al ticket no encontrado")
    
    # Validar permisos según el rol
    if usuario_actual.rol == "residente":
        # El residente solo puede eliminar sus propios tickets
        residente_usuario = db.query(Residente).filter(Residente.usuario_id == usuario_actual.id).first()
        if not residente_usuario or ticket.residente_id != residente_usuario.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este ticket")
    
    elif usuario_actual.rol == "admin":
        # El admin solo puede eliminar tickets de su residencial
        if residente.residencial_id != usuario_actual.residencial_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este ticket")
    
    elif usuario_actual.rol == "super_admin":
        # Super admin puede eliminar cualquier ticket
        pass
    
    else:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar tickets")
    
    # Eliminar archivo de imagen si existe
    if ticket.imagen_url:
        try:
            # Extraer el nombre del archivo de la URL
            filename = ticket.imagen_url.split('/')[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log error pero continuar con la eliminación del ticket
            print(f"Error al eliminar imagen del ticket: {e}")
    
    # Eliminar el ticket
    db.delete(ticket)
    db.commit()
    
    return {"message": "Ticket eliminado exitosamente", "ticket_id": ticket_id}

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Usuario, EstadoTicket
from app.schemas import TicketUpdate, TicketResponse, TicketListResponse
from app.services.ticket_service import crear_ticket_service, listar_tickets_service, obtener_ticket_service, actualizar_ticket_service, listar_tickets_residente_service
from app.utils.security import verify_role

router = APIRouter(prefix="/tickets", tags=["tickets"])

# 1. Crear ticket (residente)
@router.post("/crear_ticket/residente", response_model=TicketResponse, name="Crear ticket (residente)")
def crear_ticket(
    titulo: str = Form(..., max_length=150),
    descripcion: str = Form(...),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["residente"]))
):
    return crear_ticket_service(titulo, descripcion, imagen, db, usuario_actual)

# 2. Listar y filtrar tickets (admin)
@router.get("/listar_tickets/admin", response_model=List[TicketListResponse], name="Listar y filtrar tickets (admin)")
def listar_tickets(
    estado: Optional[EstadoTicket] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["admin"]))
):
    return listar_tickets_service(estado, skip, limit, db)

# 2b. Listar tickets del residente autenticado
@router.get("/listar_tickets/residente", response_model=List[TicketListResponse], name="Listar tickets del residente autenticado")
def listar_tickets_residente(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["residente"]))
):
    return listar_tickets_residente_service(db, usuario_actual)

# 3. Obtener ticket por id (ambos roles)
@router.get("/obtener_ticket/{ticket_id}", response_model=TicketResponse, name="Obtener ticket por ID")
def obtener_ticket(ticket_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(verify_role(["admin", "residente"]))):
    return obtener_ticket_service(ticket_id, db, usuario_actual)

# 4. Actualizar ticket (admin)
@router.put("/actualizar_ticket/admin/{ticket_id}", response_model=TicketResponse, name="Actualizar ticket (admin)")
def actualizar_ticket(
    ticket_id: int,
    datos: TicketUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(verify_role(["admin"]))
):
    return actualizar_ticket_service(ticket_id, datos, db) 
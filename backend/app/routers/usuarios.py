from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.services.user_service import obtener_usuario
from app.database import get_db
from app.utils.security import verify_role

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/residentes", dependencies=[Depends(verify_role(["admin"]))])
def listar_residentes(db: Session = Depends(get_db)):
    return obtener_usuario(db, rol="residente") 
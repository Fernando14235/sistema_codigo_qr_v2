from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.user_service import obtener_usuario
from app.database import get_db
from app.utils.security import verify_role, get_current_residencial_id
from app.models.residente import Residente
from app.models.usuario import Usuario
    
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/residentes", dependencies=[Depends(verify_role(["admin"]))])
def listar_residentes(
    db: Session = Depends(get_db),
    residencial_id: int = Depends(get_current_residencial_id)
):
    return obtener_usuario(db, rol="residente", residencial_id=residencial_id)

@router.get("/residentes_full", dependencies=[Depends(verify_role(["admin"]))])
def listar_residentes_full(
    db: Session = Depends(get_db),
    residencial_id: int = Depends(get_current_residencial_id)
):
    residentes = db.query(Residente).filter(Residente.residencial_id == residencial_id).all()
    resultado = []
    for r in residentes:
        usuario = db.query(Usuario).filter(Usuario.id == r.usuario_id).first()
        resultado.append({
            "residente_id": r.id,
            "nombre": usuario.nombre if usuario else None,
            "email": usuario.email if usuario else None,
            "unidad_residencial": r.unidad_residencial,
            "telefono": r.telefono,
            "usuario_id": r.usuario_id
        })
    return resultado

@router.get("/usuario_nombre/{id}", dependencies=[Depends(verify_role(["admin", "residente"]))])
def obtener_nombre_usuario(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"nombre": usuario.nombre}

@router.get("/residentes/usuario/{usuario_id}", dependencies=[Depends(verify_role(["residente"]))])
def obtener_residente_por_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el residente asociado a un usuario_id.
    Usado para obtener el residente_id necesario para verificar votos en encuestas.
    """
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado")
    return {
        "id": residente.id,
        "usuario_id": residente.usuario_id,
        "unidad_residencial": residente.unidad_residencial,
        "telefono": residente.telefono,
        "residencial_id": residente.residencial_id
    }
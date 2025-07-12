from sqlalchemy.orm import Session
from app.models.residencial import Residencial
from app.schemas.residencial_schema import ResidencialCreate, ResidencialUpdate
from fastapi import HTTPException, status

def crear_residencial(db: Session, residencial: ResidencialCreate) -> Residencial:
    """Crear una nueva residencial"""
    db_residencial = Residencial(
        nombre=residencial.nombre,
        direccion=residencial.direccion
    )
    db.add(db_residencial)
    db.commit()
    db.refresh(db_residencial)
    return db_residencial

def obtener_residencial(db: Session, residencial_id: int) -> Residencial:
    """Obtener una residencial por ID"""
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    return residencial

def listar_residenciales(db: Session, skip: int = 0, limit: int = 100):
    """Listar todas las residenciales"""
    return db.query(Residencial).offset(skip).limit(limit).all()

def actualizar_residencial(db: Session, residencial_id: int, residencial: ResidencialUpdate) -> Residencial:
    """Actualizar una residencial"""
    db_residencial = obtener_residencial(db, residencial_id)
    
    update_data = residencial.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_residencial, field, value)
    
    db.commit()
    db.refresh(db_residencial)
    return db_residencial

def eliminar_residencial(db: Session, residencial_id: int) -> bool:
    """Eliminar una residencial"""
    db_residencial = obtener_residencial(db, residencial_id)
    db.delete(db_residencial)
    db.commit()
    return True 
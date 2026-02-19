from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.utils.security import verify_role, get_password_hash
from app.models.usuario import Usuario
from app.models.residencial import Residencial

router = APIRouter(prefix="/usuarios", tags=["Super Admin - Usuarios"])

@router.get("/listar", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_todos_usuarios(db: Session = Depends(get_db)):
    """Listar todos los usuarios del sistema"""
    usuarios = db.query(Usuario).options(joinedload(Usuario.residencial)).order_by(Usuario.id).all()
    resultado = []
    for u in usuarios:
        resultado.append({
            "id": u.id,
            "nombre": u.nombre,
            "email": u.email,
            "rol": u.rol,
            "activo": getattr(u, 'activo', True),
            "fecha_creacion": u.fecha_creacion,
            "ult_conexion": getattr(u, 'ult_conexion', None),
            "residencial": {
                "id": u.residencial.id,
                "nombre": u.residencial.nombre
            } if u.residencial else None
        })
    return resultado

@router.patch("/{id}/estatus", dependencies=[Depends(verify_role(["super_admin"]))])
def toggle_usuario_status(id: int, activo: bool, db: Session = Depends(get_db)):
    """Activar o desactivar un usuario"""
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.activo = activo
    db.commit()
    return {"message": f"Usuario {'activado' if activo else 'desactivado'} exitosamente", "activo": activo}

@router.post("/{id}/reset-password", dependencies=[Depends(verify_role(["super_admin"]))])
def reset_usuario_password(id: int, password: str, db: Session = Depends(get_db)):
    """Resetear contraseña de un usuario"""
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.password_hash = get_password_hash(password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}

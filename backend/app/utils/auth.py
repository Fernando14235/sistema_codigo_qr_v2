from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.utils.security import get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    usuario = await get_current_user(token, db)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

def verificar_rol_requerido(rol: str):
    async def dependencia(usuario: Usuario = Depends(obtener_usuario_actual)):
        if usuario.rol != rol:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta operación")
        return usuario
    return dependencia

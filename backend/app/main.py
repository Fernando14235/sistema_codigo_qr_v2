from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from typing import Optional, List
from app.routers import auth, usuarios, visitas, notificaciones, historial_visitas, estadisticas, sociales
from app.services import user_service
from app.schemas.usuario_schema import Usuario, UsuarioCreate
from app.utils.security import get_current_user, verify_role
from app.core.cors import add_cors
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

app = FastAPI()
add_cors(app)
app.include_router(auth.router)
app.include_router(visitas.router)
app.include_router(notificaciones.router)
app.include_router(historial_visitas.router)
app.include_router(estadisticas.router)
app.include_router(sociales.router)
app.include_router(usuarios.router)

# Llamada a la función de expiración de visitas
def actu_visita_expiracion():
    db: Session = SessionLocal()
    db.execute(text("SELECT actu_visita_expiracion()"))
    db.commit()
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(actu_visita_expiracion, "interval", minutes=5)  
scheduler.start()

@app.get('/', tags=["Inicio"])
def home():
    return HTMLResponse('''
                        <h1>Sistema de Control Residencial FH Velasquez</h1>
                        <style>width: 100%</style>
                        ''')

# obtener todos los usuarios
@app.get('/usuarios/admin', tags=["Usuarios"])
def obtener_todos_usuarios(
    usuario_actual=Depends(verify_role(["admin"])), 
    id: Optional[int] = Query(None, description="Filtro por ID"),
    nombre: Optional[str] = Query(None, description="Filtro por nombre"),
    rol: Optional[str] = Query(None, description="Filtro por rol"), 
    db: Session = Depends(get_db)
):
    try:
        usuarios = user_service.obtener_usuario(db, id=id, nombre=nombre, rol=rol)
        return usuarios
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuarios"
        )

# Obtener usuario por ID
@app.get('/usuarios/admin/{id}', response_model=Usuario, tags=["Usuarios"])
def obtener_usuario_por_id(id: int, usuario_actual=Depends(verify_role(["admin"])), db: Session = Depends(get_db)):
    try:
        usuario = user_service.obtener_usuario_por_id(db, id)
        data = usuario.__dict__.copy()
        
        if usuario.rol == "residente":
            from app.models.residente import Residente
            residente = db.query(Residente).filter(Residente.usuario_id == usuario.id).first()
            data["unidad_residencial"] = residente.unidad_residencial if residente else None
        else:
            data["unidad_residencial"] = None
            
        return data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuario"
        )

# Crear un nuevo usuario
@app.post('/create_usuarios/admin', response_model=Usuario, tags=["Usuarios"])
def crear_nuevo_usuario(usuario: UsuarioCreate, usuario_actual=Depends(verify_role(["admin"])), db: Session = Depends(get_db)):
    try:
        db_usuario = user_service.crear_usuario(db, usuario)
        return db_usuario
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Error al crear usuario"
        )

# Actualizar usuario
@app.put('/update_usuarios/admin/{user_id}', response_model=Usuario, tags=["Usuarios"])
def actualizar_usuario(user_id: int, usuario_data: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        usuario_actualizado = user_service.actualizar_usuario(db, user_id, usuario_data)
        return usuario_actualizado
    except HTTPException as e:
        raise f"Error al actualizar usuario: {e}"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar usuario"
        )

# Eliminar usuario
@app.delete('/delete_usuarios/admin/{id}', tags=["Usuarios"])
def eliminar_usuario(id: int, usuario_actual=Depends(verify_role(["admin"])), db: Session = Depends(get_db)):
    try:
        eliminado_exitosamente = user_service.eliminar_usuario(db, id)
        if eliminado_exitosamente:
            return {"mensaje": f"Usuario con ID {id} eliminado correctamente"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Error al eliminar usuario"
        )
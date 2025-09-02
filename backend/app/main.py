from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from typing import Optional, List
from app.routers import auth, usuarios, visitas, notificaciones, historial_visitas, estadisticas, sociales, tickets, residenciales, super_admin, vistas
from app.services.user_service import crear_usuario, eliminar_usuario, obtener_usuario, obtener_usuario_por_id, actualizar_usuario
from app.schemas.usuario_schema import Usuario, UsuarioCreate, UsuarioUpdate, UsuarioCreateSuperAdmin
from app.utils.security import get_current_user, verify_role
from app.core.cors import add_cors
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
import os
from app.models.usuario import Usuario as UsuarioModel
from app.models.super_admin import SuperAdmin
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.models.admin import Administrador

app = FastAPI()
add_cors(app)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(visitas.router)
app.include_router(historial_visitas.router)
app.include_router(tickets.router)
app.include_router(sociales.router)
app.include_router(estadisticas.router)
app.include_router(notificaciones.router)
app.include_router(residenciales.router)
app.include_router(super_admin.router)
app.include_router(vistas.router)

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
                        <h1>Sistema de Control Residencial Version 2</h1>
                        <style>width: 100%</style>
                        ''')

# obtener todos los usuarios
@app.get('/usuarios/admin', tags=["Usuarios"])
def obtener_todos_usuarios(
    usuario_actual=Depends(verify_role(["admin", "super_admin"])), 
    id: Optional[int] = Query(None, description="Filtro por ID"),
    nombre: Optional[str] = Query(None, description="Filtro por nombre"),
    rol: Optional[str] = Query(None, description="Filtro por rol"), 
    db: Session = Depends(get_db)
):
    try:
        usuarios = obtener_usuario(db, id=id, nombre=nombre, rol=rol, usuario_actual=usuario_actual)
        return usuarios
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuarios"
        )

@app.get('/usuario/actual', tags=["Usuarios"])
def obtener_usuario_actual(usuario_actual: UsuarioModel = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        data = {
            "id": usuario_actual.id,
            "nombre": usuario_actual.nombre,
            "email": usuario_actual.email,
            "rol": usuario_actual.rol,
            "fecha_creacion": usuario_actual.fecha_creacion,
            "fecha_actualizacion": usuario_actual.fecha_actualizacion,
            "ult_conexion": usuario_actual.ult_conexion,
            "telefono": None,
            "unidad_residencial": None,
            "residencial_nombre": None
        }
        if usuario_actual.rol == "residente":
            residente = db.query(Residente).filter(Residente.usuario_id == usuario_actual.id).first()
            if residente:
                data["telefono"] = residente.telefono
                data["unidad_residencial"] = residente.unidad_residencial
                if residente.residencial:
                    data["residencial_nombre"] = residente.residencial.nombre
        elif usuario_actual.rol == "guardia":
            guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario_actual.id).first()
            if guardia:
                data["telefono"] = guardia.telefono
                if guardia.residencial:
                    data["residencial_nombre"] = guardia.residencial.nombre
        elif usuario_actual.rol == "admin":
            admin = db.query(Administrador).filter(Administrador.usuario_id == usuario_actual.id).first()
            if admin:
                data["telefono"] = admin.telefono
                data["unidad_residencial"] = admin.unidad_residencial
                if admin.residencial:
                    data["residencial_nombre"] = admin.residencial.nombre
        # Para super_admin, residencial_nombre queda como None
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuario actual: {str(e)}")

# Obtener usuario por ID
@app.get('/usuarios/admin/{id}', response_model=Usuario, tags=["Usuarios"])
def obtener_usuario_por_id(id: int, usuario_actual=Depends(verify_role(["admin", "super_admin"])), db: Session = Depends(get_db)):
    try:
        # The obtener_usuario_por_id function already returns a dict with all the necessary data
        usuario_data = obtener_usuario_por_id(db, id, usuario_actual=usuario_actual)
        return usuario_data
    except HTTPException as e:
        raise e

# Crear un nuevo usuario
@app.post('/create_usuarios/admin', response_model=Usuario, tags=["Usuarios"])
def crear_nuevo_usuario(usuario: UsuarioCreate, usuario_actual=Depends(verify_role(["super_admin","admin"])), db: Session = Depends(get_db)):
    return crear_usuario(db, usuario, usuario_actual)

# Crear super admin (sin autenticación - solo para setup inicial)
@app.post('/create_usuarios/super_admin', response_model=Usuario, tags=["Usuarios"])
def crear_super_admin_endpoint(usuario: UsuarioCreateSuperAdmin, db: Session = Depends(get_db)):
    count_super_admins = db.query(UsuarioModel).filter(UsuarioModel.rol == "super_admin").count()
    # Validar que no existan más de 1 (para permitir crear el segundo)
    if count_super_admins >= 2:
        raise HTTPException(
            status_code=400, 
            detail="No se pueden crear más de 2 super administradores en el sistema"
        )
    
    # Verificar que el rol sea super_admin
    if usuario.rol != "super_admin":
        raise HTTPException(
            status_code=400, 
            detail="Este endpoint solo permite crear usuarios con rol super_admin"
        )
    
    return crear_usuario(db, usuario, usuario_actual=None)

# Actualizar usuario
@app.put('/update_usuarios/admin/{user_id}', response_model=Usuario, tags=["Usuarios"])
def actualizar_usuario_endpoint(user_id: int, usuario_data: UsuarioUpdate, usuario_actual=Depends(verify_role(["admin", "super_admin"])), db: Session = Depends(get_db)):
    return actualizar_usuario(db, user_id, usuario_data, usuario_actual=usuario_actual)

# Eliminar usuario
@app.delete('/delete_usuarios/admin/{id}', tags=["Usuarios"])
def eliminar_usuario_endpoint(id: int, usuario_actual=Depends(verify_role(["admin", "super_admin"])), db: Session = Depends(get_db)):
    return eliminar_usuario(db, id, usuario_actual=usuario_actual)


# Ruta absoluta a la carpeta de uploads
UPLOADS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../uploads'))
app.mount("/uploads", StaticFiles(directory=UPLOADS_PATH), name="uploads")
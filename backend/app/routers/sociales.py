from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.social_schema import SocialCreate, SocialResponse, SocialOpcionCreate, SocialVotoCreate, SocialVotoResponse
from app.services.social_service import crear_publicacion_service, listar_publicaciones_service, obtener_publicacion_service, actualizar_publicacion_service, eliminar_publicacion_service, mis_publicaciones_service, votar_encuesta_service, resultados_encuesta_service
from app.database import get_db
from app.utils.security import get_current_user, verify_role
from app.models.usuario import Usuario
from app.models.social import Social, SocialOpcion, SocialVoto
import json

router = APIRouter(prefix="/social", tags=["Social"])

@router.post("/create_social/admin", response_model=SocialResponse, dependencies=[Depends(verify_role(["admin"]))])
async def crear_publicacion(
    social_data: str = Form(...),
    imagenes: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        social_data_dict = json.loads(social_data)
        print('SOCIAL_DATA_DICT:', social_data_dict)  # DEPURACIÓN
        social_data_obj = SocialCreate(**social_data_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error en el formato de social_data: {e}")
    return crear_publicacion_service(db, social_data_obj, imagenes, current_user)

@router.get("/obtener_social/admin", response_model=List[SocialResponse], dependencies=[Depends(verify_role(["admin"]))])
def listar_publicaciones_admin(
    tipo_publicacion: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    fecha: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return listar_publicaciones_service(db, current_user, tipo_publicacion, estado, fecha)

@router.get("/obtener_social/residente", response_model=List[SocialResponse], dependencies=[Depends(verify_role(["residente"]))])
def listar_publicaciones_residente(
    tipo_publicacion: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    fecha: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return listar_publicaciones_service(db, current_user, tipo_publicacion, estado, fecha)

@router.get("/obtener_social/admin/{id}", response_model=SocialResponse, dependencies=[Depends(verify_role(["admin"]))])
def obtener_publicacion_admin(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return obtener_publicacion_service(db, id, current_user)

@router.get("/obtener_social/residente/{id}", response_model=SocialResponse, dependencies=[Depends(verify_role(["residente"]))])
def obtener_publicacion_residente(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return obtener_publicacion_service(db, id, current_user)

@router.put("/actualizar_social/admin/{id}", response_model=SocialResponse, dependencies=[Depends(verify_role(["admin"]))])
def actualizar_publicacion(
    id: int,
    social_data: str = Form(...),
    imagenes: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        social_data_dict = json.loads(social_data)
        social_data_obj = SocialCreate(**social_data_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error en el formato de social_data: {e}")
    return actualizar_publicacion_service(db, id, social_data_obj, imagenes, current_user)

@router.delete("/eliminar_social/admin/{id}", dependencies=[Depends(verify_role(["admin"]))])
def eliminar_publicacion(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return eliminar_publicacion_service(db, id, current_user)

@router.get("/mis-publicaciones/residente", response_model=List[SocialResponse], dependencies=[Depends(verify_role(["residente"]))])
def mis_publicaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return mis_publicaciones_service(db, current_user)

# Endpoint para votar en una encuesta (residente)
@router.post("/votar/residente/{id}", response_model=SocialVotoResponse, dependencies=[Depends(verify_role(["residente"]))])
def votar_encuesta(id: int, voto: SocialVotoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return votar_encuesta_service(db, id, current_user.id, voto.opcion_id)

# Endpoint para ver resultados de una encuesta (admin)
@router.get("/resultados/admin/{id}", dependencies=[Depends(verify_role(["admin"]))])
def resultados_encuesta(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return resultados_encuesta_service(db, id)
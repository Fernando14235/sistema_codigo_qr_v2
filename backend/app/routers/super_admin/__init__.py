from fastapi import APIRouter
from app.routers.super_admin.dashboard import router as dashboard_router
from app.routers.super_admin.entidades import router as entidades_router
from app.routers.super_admin.usuarios import router as usuarios_router
from ..super_admin_legacy import router as legacy_router


# Main router with NO prefix, acting as a container
router = APIRouter()

# Include legacy router (which already has prefix="/super-admin")
router.include_router(legacy_router)

# Include new routers, nested under /super-admin
# dashboard_router has prefix "/dashboard-global"
router.include_router(dashboard_router, prefix="/super-admin")

# entidades_router has prefix "/entidades"
router.include_router(entidades_router, prefix="/super-admin")

# usuarios_router has prefix "/usuarios"
router.include_router(usuarios_router, prefix="/super-admin")

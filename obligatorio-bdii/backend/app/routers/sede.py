from fastapi import APIRouter, Depends

from app.db.dependencies import require_admin
from app.schemas.sede import SedeCreate
from app.services.sede import (
    listar_sedes,
    crear_sede,
)

router = APIRouter(
    prefix="/sedes",
    tags=["Sedes"]
)


@router.get("/")
async def get_sedes():
    return await listar_sedes()


@router.post("/")
async def post_sede(
    sede: SedeCreate,
    current_user: dict = Depends(require_admin),
):
    return await crear_sede(
        sede.pais,
    )
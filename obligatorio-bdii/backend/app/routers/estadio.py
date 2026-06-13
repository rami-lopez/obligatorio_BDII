from fastapi import APIRouter, Depends

from app.db.dependencies import require_admin

from app.schemas.estadio import (
    EstadioCreate,
    SectorCreate,
)

from app.services.estadio import (
    obtener_estadios,
    obtener_estadio,
    crear_estadio,
    obtener_sectores,
    crear_sector,
)

router = APIRouter(
    prefix="/estadios",
    tags=["Estadios y Sectores"]
)

@router.get("/")
async def listar_estadios():
    return await obtener_estadios()

@router.get("/{id_estadio}")
async def detalle_estadio(
    id_estadio: int
):
    return await obtener_estadio(id_estadio)

@router.post("/")
async def alta_estadio(
    estadio: EstadioCreate,
    current_user: dict = Depends(require_admin)
):
    return await crear_estadio(
        estadio.nombre,
        estadio.pais,
        estadio.ciudad,
        estadio.id_sede
    )

@router.get("/{id_estadio}/sectores")
async def sectores(
    id_estadio: int
):
    return await obtener_sectores(id_estadio)

@router.post("/{id_estadio}/sectores")
async def alta_sector(
    id_estadio: int,
    sector: SectorCreate,
    current_user: dict = Depends(require_admin)
):
    return await crear_sector(
        id_estadio,
        sector.codigo,
        sector.capacidad_max,
        sector.costo
    )
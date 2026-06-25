from fastapi import APIRouter, Depends

from app.db.dependencies import get_current_user, require_admin

from app.schemas.estadio import (
    EstadioCreate,
    EstadioResponse,
    SedeResponse,
    SectorCreate,
)

from app.services.estadio import (
    obtener_sedes,
    obtener_estadios,
    obtener_estadio,
    crear_estadio,
    obtener_sectores,
    crear_sector,
    eliminar_estadio
)

router = APIRouter(
    prefix="/estadios",
    tags=["Estadios y Sectores"]
)

sedes_router = APIRouter(
    prefix="/sedes",
    tags=["Sedes"]
)


@sedes_router.get("/", response_model=list[SedeResponse])
async def listar_sedes():
    return await obtener_sedes()


@router.get("/")
async def listar_estadios(current_user: dict = Depends(get_current_user)):
    id_sede = current_user.get("id_sede") if current_user.get("role") == "administrador" else None
    return await obtener_estadios(id_sede)


@router.get("/{id_estadio}")
async def detalle_estadio(
    id_estadio: int
):
    return await obtener_estadio(id_estadio)


@router.post("/", response_model=EstadioResponse, status_code=201)
async def alta_estadio(
    estadio: EstadioCreate,
    current_user: dict = Depends(require_admin)
):
    sectores_dict = [s.model_dump() for s in estadio.sectores]
    return await crear_estadio(
        estadio.nombre,
        estadio.ciudad,
        estadio.id_sede,
        sectores_dict
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

@router.delete("/{id_estadio}", status_code=204)
async def baja_estadio(
    id_estadio: int,
    current_user: dict = Depends(require_admin)
):
    await eliminar_estadio(id_estadio)

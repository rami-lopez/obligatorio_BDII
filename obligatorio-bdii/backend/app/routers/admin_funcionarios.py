from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.dependencies import require_admin
from app.schemas.admin import AsignacionCreate, AsignacionResponse, FuncionarioResponse
from app.services.admin_funcionarios import (
    asignar_sector,
    buscar_usuarios,
    desasignar_sector,
    get_asignaciones,
    listar_funcionarios,
)

router = APIRouter(prefix="/admin", tags=["Admin - Funcionarios"])


@router.get("/funcionarios", response_model=list[FuncionarioResponse])
async def read_funcionarios(current_user: dict = Depends(require_admin)):
    return await listar_funcionarios()


@router.get("/usuarios/buscar")
async def search_usuarios(
    q: str = Query(min_length=1),
    current_user: dict = Depends(require_admin),
):
    return await buscar_usuarios(q)


@router.get("/funcionarios/{mail}/asignaciones", response_model=list[AsignacionResponse])
async def read_asignaciones(
    mail: str,
    current_user: dict = Depends(require_admin),
):
    return await get_asignaciones(mail)


@router.post(
    "/funcionarios/{mail}/asignaciones",
    response_model=list[AsignacionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_asignacion(
    mail: str,
    payload: AsignacionCreate,
    current_user: dict = Depends(require_admin),
):
    return await asignar_sector(mail, payload.id_evento, payload.id_estadio, payload.codigo_sector)


@router.delete("/funcionarios/{mail}/asignaciones", response_model=list[AsignacionResponse])
async def delete_asignacion(
    mail: str,
    id_evento: int = Query(...),
    id_estadio: int = Query(...),
    codigo_sector: str = Query(...),
    current_user: dict = Depends(require_admin),
):
    return await desasignar_sector(mail, id_evento, id_estadio, codigo_sector)

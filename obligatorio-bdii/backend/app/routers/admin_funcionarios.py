from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.dependencies import require_admin
from app.schemas.admin import (
    AsignacionCreate,
    AsignacionResponse,
    DispositivoAsignarExistente,
    DispositivoCreate,
    DispositivoResponse,
    FuncionarioResponse,
)
from app.services.admin_funcionarios import (
    asignar_dispositivo_existente,
    asignar_sector,
    buscar_usuarios,
    crear_dispositivo,
    desasignar_sector,
    eliminar_dispositivo,
    get_asignaciones,
    listar_dispositivos_funcionario,
    listar_funcionarios,
    listar_todos_dispositivos,
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


@router.get("/funcionarios/{mail}/dispositivos", response_model=list[DispositivoResponse])
async def read_dispositivos_funcionario(
    mail: str,
    current_user: dict = Depends(require_admin),
):
    return await listar_dispositivos_funcionario(mail)


@router.get("/dispositivos", response_model=list[DispositivoResponse])
async def read_todos_dispositivos(
    current_user: dict = Depends(require_admin),
):
    return await listar_todos_dispositivos()


@router.post(
    "/funcionarios/{mail}/dispositivos",
    response_model=list[DispositivoResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_dispositivo(
    mail: str,
    payload: DispositivoCreate,
    current_user: dict = Depends(require_admin),
):
    return await crear_dispositivo(mail, payload.identificador)


@router.post(
    "/funcionarios/{mail}/dispositivos/asignar-existente",
    response_model=list[DispositivoResponse],
    status_code=status.HTTP_200_OK,
)
async def assign_existing_dispositivo(
    mail: str,
    payload: DispositivoAsignarExistente,
    current_user: dict = Depends(require_admin),
):
    return await asignar_dispositivo_existente(mail, payload.identificador, payload.mail_origen)


@router.delete(
    "/funcionarios/{mail}/dispositivos/{identificador}",
    response_model=list[DispositivoResponse],
)
async def delete_dispositivo(
    mail: str,
    identificador: str,
    current_user: dict = Depends(require_admin),
):
    return await eliminar_dispositivo(mail, identificador)

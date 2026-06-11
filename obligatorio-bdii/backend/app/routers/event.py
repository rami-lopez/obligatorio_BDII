from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user, require_admin
from app.schemas.event import EventCreate, EventResponse, EventUpdate, HabilitarSectorRequest, SectorEventoResponse
from app.services.event import crear_evento, get_evento, get_eventos, update_evento, get_sectores_evento, habilitar_sector

router = APIRouter(prefix="/eventos", tags=["eventos"])

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_evento(
    evento: EventCreate,
    current_user: dict = Depends(require_admin),
):
    resultado = await crear_evento(evento, current_user["mail"])
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un evento en ese estadio a esa fecha y hora",
        )
    return resultado


@router.get("/{id_evento}", response_model=EventResponse)
async def get_evento_by_id(
    id_evento: int,
    current_user: dict = Depends(get_current_user),
):
    resultado = await get_evento(id_evento)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )
    return resultado

@router.get("/", response_model=list[EventResponse])
async def listar_eventos(current_user: dict = Depends(get_current_user)):
    resultado = await get_eventos()
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eventos no encontrado",
        )
    return resultado

@router.get("/{id_evento}/sectores", response_model=list[SectorEventoResponse])
async def listar_sectores_evento(id_evento: int, current_user: dict = Depends(get_current_user)):
    resultado = await get_sectores_evento(id_evento)
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sectores no encontrado",
        )
    return resultado

@router.post("/{id_evento}/sectores", response_model=list[SectorEventoResponse], status_code=status.HTTP_201_CREATED)
async def habilitar_sector_evento(
    id_evento: int,
    sector: HabilitarSectorRequest,
    current_user: dict = Depends(require_admin),
):
    resultado = await habilitar_sector(id_evento, sector.codigo_sector)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )
    if resultado == "sector_no_existe":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El sector no existe en el estadio de este evento",
        )
    if resultado == "ya_habilitado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El sector ya está habilitado para este evento",
        )
    return resultado

@router.patch("/{id_evento}", response_model=EventResponse, status_code=status.HTTP_200_OK)
async def actualizar_evento(
    evento: EventUpdate,
    id_evento: int,
    current_user: dict = Depends(require_admin),
):
    resultado = await update_evento(id_evento, evento)
    if resultado == "tiene_entradas":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede cambiar el estadio, ya hay entradas vendidas para este evento",
        )
    if resultado == "superposicion":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un evento en ese estadio a esa fecha y hora",
        )
    if resultado == "superposicion_equipo":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Uno de los equipos ya tiene un partido a esa fecha y hora",
        )
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )
    return resultado
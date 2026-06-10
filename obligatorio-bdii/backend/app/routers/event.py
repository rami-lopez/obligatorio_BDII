from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user, require_admin
from app.schemas.event import EventCreate, EventResponse
from app.services.event import crear_evento, get_evento, get_eventos

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

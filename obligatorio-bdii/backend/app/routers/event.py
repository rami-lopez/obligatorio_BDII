from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user, require_admin
from app.schemas.event import EventCreate, EventResponse, EventUpdate, HabilitarSectorRequest, SectorEventoResponse, SectorAdminResponse
from app.services.event import crear_evento, get_evento, get_eventos, update_evento, get_sectores_evento, get_sectores_evento_admin, habilitar_sector, deshabilitar_sector, eliminar_evento, evento_pertenece_a_sede, estadio_pertenece_a_sede

router = APIRouter(prefix="/eventos", tags=["eventos"])

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_evento(
    evento: EventCreate,
    current_user: dict = Depends(require_admin),
):
    id_sede_admin = current_user.get("id_sede")

    if id_sede_admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El administrador no tiene sede asignada",
        )

    estadio_ok = await estadio_pertenece_a_sede(evento.id_estadio, id_sede_admin)

    if not estadio_ok:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear eventos en estadios de otra sede",
        )

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
    if current_user.get("role") == "administrador":
        await validar_evento_admin(id_evento, current_user)

    resultado = await get_evento(id_evento)

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )

    return resultado

@router.get("/", response_model=list[EventResponse])
async def listar_eventos(
    estadio: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    id_sede_filter = current_user.get("id_sede") if current_user.get("role") == "administrador" else None
    resultado = await get_eventos(id_sede_filter, estadio)
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

@router.get("/{id_evento}/sectores/admin", response_model=list[SectorAdminResponse])
async def listar_sectores_evento_admin(
    id_evento: int,
    current_user: dict = Depends(require_admin),
):
    await validar_evento_admin(id_evento, current_user)

    resultado = await get_sectores_evento_admin(id_evento)

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )

    return resultado


@router.post("/{id_evento}/sectores", response_model=list[SectorAdminResponse], status_code=status.HTTP_201_CREATED)
async def habilitar_sector_evento(
    id_evento: int,
    sector: HabilitarSectorRequest,
    current_user: dict = Depends(require_admin),
):
    await validar_evento_admin(id_evento, current_user)

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


@router.delete("/{id_evento}/sectores/{codigo_sector}", response_model=list[SectorAdminResponse])
async def deshabilitar_sector_evento(
    id_evento: int,
    codigo_sector: str,
    current_user: dict = Depends(require_admin),
):
    await validar_evento_admin(id_evento, current_user)
    resultado = await deshabilitar_sector(id_evento, codigo_sector)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )
    if resultado == "no_habilitado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El sector no está habilitado para este evento",
        )
    if resultado == "tiene_entradas":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede deshabilitar el sector porque tiene entradas vendidas",
        )
    return resultado

@router.patch("/{id_evento}", response_model=EventResponse, status_code=status.HTTP_200_OK)
async def actualizar_evento(
    evento: EventUpdate,
    id_evento: int,
    current_user: dict = Depends(require_admin),
):
    await validar_evento_admin(id_evento, current_user)

    if evento.id_estadio is not None:
        estadio_ok = await estadio_pertenece_a_sede(
            evento.id_estadio,
            current_user["id_sede"],
        )

        if not estadio_ok:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes mover el evento a un estadio de otra sede",
            )

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

@router.delete("/{id_evento}", status_code=status.HTTP_204_NO_CONTENT)
async def borrar_evento(
    id_evento: int,
    current_user: dict = Depends(require_admin),
):
    await validar_evento_admin(id_evento, current_user)

    resultado = await eliminar_evento(id_evento)

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )

    if resultado == "tiene_entradas":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar un evento que tiene entradas vendidas",
        )
    
# helper
async def validar_evento_admin(id_evento: int, current_user: dict):
    id_sede_admin = current_user.get("id_sede")

    if id_sede_admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El administrador no tiene sede asignada",
        )

    pertenece = await evento_pertenece_a_sede(id_evento, id_sede_admin)

    if not pertenece:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar eventos de otra sede",
        )
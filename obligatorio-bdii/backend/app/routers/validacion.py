from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user
from app.schemas.validacion import SectorValidacionResponse
from app.services.validacion import get_sectores_asignados

router = APIRouter(prefix="/validacion", tags=["validacion"])

@router.get("/{id_evento}/mis-sectores", response_model=list[SectorValidacionResponse])
async def get_mis_sectores(
    id_evento: int,
    current_user: dict = Depends(get_current_user),
):
    resultado = await get_sectores_asignados(id_evento, current_user["mail"])
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sectores no encontrados",
        )
    return resultado
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user, require_admin
from app.schemas.reportes import EventoMasVendidoResponse, MayorCompradorResponse, ValidacionReporteResponse
from app.services.reportes import get_evento_mas_vendido, get_mayor_comprador, get_todas_validaciones

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.get("/eventos-mas-vendidos", response_model=list[EventoMasVendidoResponse])
async def get_evento_con_mas_entradas_vendidas(
    current_user: dict = Depends(require_admin),
):
    resultado = await get_evento_mas_vendido()
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )
    return resultado

@router.get("/mayores-compradores", response_model=list[MayorCompradorResponse])
async def get_comprador_de_mas_entradas(
    current_user: dict = Depends(require_admin),
):
    resultado = await get_mayor_comprador()
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprador no encontrado",
        )
    return resultado

@router.get("/validaciones", response_model=list[ValidacionReporteResponse])
async def get_validaciones_reporte(
    current_user: dict = Depends(require_admin),
):
    resultado = await get_todas_validaciones()
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay validaciones",
        )
    return resultado
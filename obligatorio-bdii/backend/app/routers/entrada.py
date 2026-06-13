from fastapi import APIRouter, Depends

from app.db.dependencies import get_current_user
from app.schemas.entrada import (
    EntradaDetalleResponse,
    HistorialTransferenciaResponse,
    QRResponse,
)
from app.services.entrada import (
    obtener_entrada,
    obtener_historial_entrada,
    obtener_qr_entrada
)

router = APIRouter(
    prefix="/entradas",
    tags=["Entradas"]
)


@router.get("/{id_entrada}", response_model=EntradaDetalleResponse)
async def detalle(
    id_entrada: int,
    current_user: dict = Depends(get_current_user)
):
    return await obtener_entrada(
        id_entrada,
        current_user["mail"]
    )


@router.get("/{id_entrada}/historial", response_model=list[HistorialTransferenciaResponse])
async def historial(
    id_entrada: int,
    current_user: dict = Depends(get_current_user)
):
    return await obtener_historial_entrada(
        id_entrada,
        current_user["mail"]
    )


@router.get("/{id_entrada}/qr", response_model=QRResponse)
async def qr(
    id_entrada: int,
    current_user: dict = Depends(get_current_user)
):
    return await obtener_qr_entrada(
        id_entrada,
        current_user["mail"]
    )
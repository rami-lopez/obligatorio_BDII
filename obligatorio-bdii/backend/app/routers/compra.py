from fastapi import APIRouter, Depends

from app.schemas.compra import CompraCreate, VentaDetalleResponse, PagoActionResponse
from app.services.compra import comprar_entradas, obtener_detalle_venta, confirmar_pago, anular_pago
from app.db.dependencies import get_current_user

router = APIRouter(
    prefix="/compras",
    tags=["Compras"]
)


@router.post("/")
async def comprar(compra: CompraCreate, current_user: dict = Depends(get_current_user)):
    return await comprar_entradas(
        current_user["mail"],
        compra.id_evento,
        compra.id_estadio,
        compra.codigo_sector,
        compra.cantidad
    )


@router.get("/{id_venta}", response_model=VentaDetalleResponse)
async def obtener_venta(id_venta: int, current_user: dict = Depends(get_current_user)):
    return await obtener_detalle_venta(id_venta, current_user["mail"])


@router.post("/{id_venta}/confirmar", response_model=PagoActionResponse)
async def confirmar_venta(id_venta: int, current_user: dict = Depends(get_current_user)):
    return await confirmar_pago(id_venta, current_user["mail"])


@router.post("/{id_venta}/anular", response_model=PagoActionResponse)
async def anular_venta(id_venta: int, current_user: dict = Depends(get_current_user)):
    return await anular_pago(id_venta, current_user["mail"])
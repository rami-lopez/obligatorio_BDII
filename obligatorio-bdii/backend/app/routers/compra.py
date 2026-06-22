from fastapi import APIRouter, Depends

from app.schemas.compra import CompraCreate
from app.services.compra import comprar_entradas
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
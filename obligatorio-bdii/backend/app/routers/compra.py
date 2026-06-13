from fastapi import APIRouter

from app.schemas.compra import CompraCreate
from app.services.compra import comprar_entradas

router = APIRouter(
    prefix="/compras",
    tags=["Compras"]
)


@router.post("/")
async def comprar(compra: CompraCreate):

    return await comprar_entradas(
        "usuario@correo.com",
        compra.id_evento,
        compra.id_estadio,
        compra.codigo_sector,
        compra.cantidad
    )
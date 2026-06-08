from fastapi import APIRouter, Depends


from app.schemas.transferencia import TransferenciaCreate
from app.services.transferencia import crear_transferencia
from app.db.dependencies import get_current_user
from app.services.transferencia import (obtener_transferencias_pendientes, aceptar_transferencia,rechazar_transferencia)

router = APIRouter(
    prefix="/transferencias",
    tags=["Transferencias"]
)
current_user: str = Depends(get_current_user)

@router.post("/")
async def transferir(
    transferencia: TransferenciaCreate,
):
    return await crear_transferencia(
        transferencia.id_entrada,
        transferencia.mail_destino,
        current_user
    )

@router.get("/pendientes")
async def pendientes():

    return await obtener_transferencias_pendientes(
        current_user
    )

@router.patch("/{id_transferencia}/aceptar")
async def aceptar(id_transferencia: int):

    return await aceptar_transferencia(
        id_transferencia,
        current_user
    )

@router.patch("/{id_transferencia}/rechazar")
async def rechazar(id_transferencia: int):

    return await rechazar_transferencia(
        id_transferencia,
        current_user
    )
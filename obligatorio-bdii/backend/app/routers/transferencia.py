from fastapi import APIRouter, Depends

from app.db.dependencies import get_current_user
from app.schemas.transferencia import TransferenciaCreate
from app.services.transferencia import aceptar_transferencia, crear_transferencia, obtener_transferencias_pendientes, rechazar_transferencia

router = APIRouter(prefix="/transferencias", tags=["Transferencias"])


@router.post("/")
async def transferir(
    transferencia: TransferenciaCreate,
    current_user: dict = Depends(get_current_user),
):
    return await crear_transferencia(
        transferencia.id_entrada,
        transferencia.mail_destino,
        current_user["mail"],
    )


@router.get("/pendientes")
async def pendientes(current_user: dict = Depends(get_current_user)):
    return await obtener_transferencias_pendientes(
        current_user["mail"]
    )


@router.patch("/{id_transferencia}/aceptar")
async def aceptar(id_transferencia: int, current_user: dict = Depends(get_current_user)):
    return await aceptar_transferencia(
        id_transferencia,
        current_user["mail"]
    )


@router.patch("/{id_transferencia}/rechazar")
async def rechazar(id_transferencia: int, current_user: dict = Depends(get_current_user)):
    return await rechazar_transferencia(
        id_transferencia,
        current_user["mail"]
    )
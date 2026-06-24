from fastapi import APIRouter, Depends

from app.db.dependencies import get_current_user
from app.services.notificacion import listar_notificaciones

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("/")
async def listar(current_user: dict = Depends(get_current_user)):
    return await listar_notificaciones(current_user["mail"])

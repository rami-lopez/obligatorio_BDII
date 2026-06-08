from fastapi import APIRouter, Depends

from app.db.dependencies import require_admin
from app.schemas.users import AdminUserCreate, UserProfile
from app.services.users import create_user

router = APIRouter(prefix="/admin/usuarios", tags=["admin-usuarios"])


@router.post("/funcionario", response_model=UserProfile, dependencies=[Depends(require_admin)])
async def create_funcionario(payload: AdminUserCreate) -> dict:
    return await create_user(payload.model_dump(), role="funcionario")


@router.post("/administrador", response_model=UserProfile, dependencies=[Depends(require_admin)])
async def create_administrador(payload: AdminUserCreate) -> dict:
    return await create_user(payload.model_dump(), role="administrador")
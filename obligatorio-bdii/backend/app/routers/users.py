from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_current_user, require_admin
from app.schemas.users import PublicUserRegister, UserProfile, UserUpdate
from app.services.users import create_user, delete_user, get_user_profile, list_users, update_user

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", dependencies=[Depends(require_admin)])
async def read_users() -> list[dict]:
    return await list_users()


@router.post("/registro", response_model=UserProfile)
async def register_user(payload: PublicUserRegister) -> dict:
    if payload.role != "usuario_general":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo se permite registrar usuarios generales")
    return await create_user(payload.model_dump(exclude={"role"}), role="usuario_general")


@router.get("/me")
async def read_me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.get("/{mail}", response_model=UserProfile)
async def read_user(mail: str, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["mail"] != mail and current_user.get("role") != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    profile = await get_user_profile(mail)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return profile


@router.put("/{mail}", response_model=UserProfile)
async def edit_user(mail: str, payload: UserUpdate, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["mail"] != mail and current_user.get("role") != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    return await update_user(mail, payload.model_dump(exclude_unset=True))


@router.delete("/{mail}")
async def remove_user(mail: str, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["mail"] != mail and current_user.get("role") != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    await delete_user(mail)
    return {"message": "Usuario eliminado"}
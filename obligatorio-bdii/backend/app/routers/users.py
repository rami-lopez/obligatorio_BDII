from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dependencies import get_auth0_payload, get_current_user, require_admin
from app.schemas.users import (
    CompleteRegistrationRequest,
    PromoteFuncionarioRequest,
    UserProfile,
    UserUpdate,
)
from app.services.users import (
    complete_registration,
    delete_user,
    get_user_profile,
    list_users,
    promote_to_funcionario,
    update_user,
)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", dependencies=[Depends(require_admin)])
async def read_users() -> list[dict]:
    return await list_users()


@router.post("/registro", response_model=UserProfile)
@router.post("/completar-registro", response_model=UserProfile)
async def complete_user_profile(
    payload: CompleteRegistrationRequest,
    auth0_payload: dict = Depends(get_auth0_payload),
) -> dict:
    """
    Registro publico. Siempre crea un usuario_general.
    Para crear administradores se hace seed directo en la base.
    Para ascender a funcionario ver POST /usuarios/{mail}/ascender-funcionario (solo admins).
    """
    auth0_sub = auth0_payload.get("sub")
    if not auth0_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    mail = auth0_payload.get("email") or auth0_sub
    return await complete_registration(payload.model_dump(), auth0_sub, mail)


@router.post(
    "/{mail}/ascender-funcionario",
    response_model=UserProfile,
    dependencies=[Depends(require_admin)],
)
async def promote_to_funcionario_endpoint(mail: str, payload: PromoteFuncionarioRequest) -> dict:
    """
    Asciende a un usuario_general existente a funcionario.
    Solo accesible para administradores. El usuario debe haberse
    registrado previamente en la aplicacion.
    """
    return await promote_to_funcionario(mail, payload.nro_legajo)


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
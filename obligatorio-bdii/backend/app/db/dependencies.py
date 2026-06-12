from fastapi import Depends, HTTPException, Request, status

from app.auth.auth0 import extract_auth0_role, verify_token
from app.services.users import get_user_profile_by_auth0_sub



def _extract_bearer_token(request: Request) -> str:
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    return token


async def get_auth0_payload(request: Request) -> dict:
    token = _extract_bearer_token(request)
    return await verify_token(token)


async def get_current_user(
    request: Request,
) -> dict:
    payload = await get_auth0_payload(request)
    auth0_sub = payload.get("sub")
    if not auth0_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    profile = await get_user_profile_by_auth0_sub(auth0_sub)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    profile["auth0_role"] = extract_auth0_role(payload)
    profile["auth0_sub"] = auth0_sub

    return profile


def require_role(*allowed_roles: str):
    async def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if allowed_roles and current_user.get("auth0_role") not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency
require_funcionario = require_role("funcionario")
require_usuario_general = require_role("usuario_general")


async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user.get("auth0_role") != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    return current_user

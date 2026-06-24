from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from app.core.config import get_settings
from app.db.dependencies import get_current_user
from app.services.auth import login_user, logout_user, refresh_access_token, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
async def login(body: LoginRequest) -> dict:
    return await login_user(body.email, body.password)


@router.post("/register")
async def register(body: RegisterRequest) -> dict:
    return await register_user(body.email, body.password)


@router.post("/refresh")
async def refresh(body: RefreshRequest) -> dict:
    if not body.refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="refresh_token is required")
    return await refresh_access_token(body.refresh_token)


@router.post("/logout")
async def logout(body: RefreshRequest | None = None) -> dict:
    if body and body.refresh_token:
        await logout_user(body.refresh_token)
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.get("/logout-legacy", include_in_schema=False)
async def logout_legacy(request: Request) -> RedirectResponse:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    client_id = settings.auth0_client_id
    return_to = str(request.base_url).rstrip("/") + "/docs"
    logout_url = (
        f"https://{domain}/v2/logout?"
        f"client_id={client_id}&"
        f"returnTo={return_to}"
    )
    return RedirectResponse(url=logout_url)

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm 

from app.db.dependencies import get_current_user
from app.schemas.auth import TokenResponse
from app.services.auth import login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(payload: OAuth2PasswordRequestForm = Depends()) -> dict:
    return await login(payload.username, payload.password)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
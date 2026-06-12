from fastapi import APIRouter, Depends

from app.db.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
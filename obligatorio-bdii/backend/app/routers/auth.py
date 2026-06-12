from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.db.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.get("/logout", include_in_schema=False)
async def logout(request: Request) -> RedirectResponse:
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

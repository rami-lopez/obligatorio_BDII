from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def _get_management_api_token() -> str | None:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    if not settings.auth0_client_secret:
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://{domain}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.auth0_client_id,
                "client_secret": settings.auth0_client_secret,
                "audience": f"https://{domain}/api/v2/",
            },
        )
        if resp.status_code != 200:
            logger.warning("Failed to get Management API token: %s", resp.text)
            return None
        data = resp.json()
        return data.get("access_token")


async def login_user(email: str, password: str) -> dict:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    if not settings.auth0_client_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Auth0 client secret not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://{domain}/oauth/token",
            data={
                "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
                "realm": settings.auth0_connection,
                "username": email,
                "password": password,
                "audience": settings.auth0_audience,
                "client_id": settings.auth0_client_id,
                "client_secret": settings.auth0_client_secret,
                "scope": "openid profile email",
            },
        )
        data = resp.json()
        if resp.status_code != 200:
            logger.error("Password grant failed: status=%s body=%s", resp.status_code, data)
            error_desc = data.get("error_description", data.get("error", "Invalid credentials"))
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error_desc)
        return data


async def register_user(email: str, password: str) -> dict:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    if not settings.auth0_client_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Auth0 client secret not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        signup_resp = await client.post(
            f"https://{domain}/dbconnections/signup",
            json={
                "client_id": settings.auth0_signup_client_id,
                "email": email,
                "password": password,
                "connection": settings.auth0_connection,
            },
        )
        if signup_resp.status_code == 409:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")
        if signup_resp.status_code not in (200, 201):
            detail = signup_resp.json().get("error_description", "Error al crear usuario")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)

    try:
        management_token = await _get_management_api_token()
        if management_token and settings.auth0_default_role_id:
            async with httpx.AsyncClient(timeout=10.0) as client:
                get_user_resp = await client.get(
                    f"https://{domain}/api/v2/users-by-email?email={email}",
                    headers={"Authorization": f"Bearer {management_token}"},
                )
                if get_user_resp.status_code == 200:
                    users = get_user_resp.json()
                    if users:
                        user_id = users[0]["user_id"]
                        await client.post(
                            f"https://{domain}/api/v2/users/{user_id}/roles",
                            headers={"Authorization": f"Bearer {management_token}"},
                            json={"roles": [settings.auth0_default_role_id]},
                        )
    except Exception as e:
        logger.warning("Could not assign default role: %s", e)

    return await login_user(email, password)


async def refresh_access_token(refresh_token: str) -> dict:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    if not settings.auth0_client_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Auth0 client secret not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://{domain}/oauth/token",
            data={
                "grant_type": "refresh_token",
                "client_id": settings.auth0_client_id,
                "client_secret": settings.auth0_client_secret,
                "refresh_token": refresh_token,
            },
        )
        data = resp.json()
        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        return data


async def logout_user(refresh_token: str | None = None) -> None:
    settings = get_settings()
    domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")
    async with httpx.AsyncClient(timeout=10.0) as client:
        if refresh_token:
            await client.post(
                f"https://{domain}/oauth/revoke",
                data={
                    "client_id": settings.auth0_client_id,
                    "client_secret": settings.auth0_client_secret,
                    "token": refresh_token,
                },
            )

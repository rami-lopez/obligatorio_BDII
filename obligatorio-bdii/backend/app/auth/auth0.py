from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
from fastapi import HTTPException, status
from jose import jwk, jwt
from jose.exceptions import JWTError

from app.core.config import get_settings

_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_CACHE_TS: float = 0.0
_JWKS_CACHE_TTL_SECONDS = 3600
_JWKS_LOCK = asyncio.Lock()


def _normalize_domain(domain: str) -> str:
    return domain.replace("https://", "").replace("http://", "").rstrip("/")


def _normalize_audience(audience: str) -> str:
    return audience.rstrip("/")


def _normalize_algorithms(algorithms: str) -> list[str]:
    return [algorithm.strip() for algorithm in algorithms.split(",") if algorithm.strip()]


def _issuer() -> str:
    settings = get_settings()
    return f"https://{_normalize_domain(settings.auth0_domain)}/"


def _jwks_url() -> str:
    settings = get_settings()
    return f"https://{_normalize_domain(settings.auth0_domain)}/.well-known/jwks.json"


async def _get_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _JWKS_CACHE, _JWKS_CACHE_TS

    now = time.time()
    if not force_refresh and _JWKS_CACHE is not None and now - _JWKS_CACHE_TS < _JWKS_CACHE_TTL_SECONDS:
        return _JWKS_CACHE

    async with _JWKS_LOCK:
        now = time.time()
        if not force_refresh and _JWKS_CACHE is not None and now - _JWKS_CACHE_TS < _JWKS_CACHE_TTL_SECONDS:
            return _JWKS_CACHE

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(_jwks_url())
            response.raise_for_status()
            _JWKS_CACHE = response.json()
            _JWKS_CACHE_TS = time.time()
            return _JWKS_CACHE


def extract_auth0_role(payload: dict[str, Any]) -> str | None:
    settings = get_settings()
    audience = _normalize_audience(settings.auth0_audience)
    domain = _normalize_domain(settings.auth0_domain)
    namespace = settings.auth0_namespace.rstrip("/")

    candidate_keys = [
        f"{namespace}/roles",
        f"{namespace}/role",
        f"https://{domain}/roles",
        f"https://{domain}/role",
        f"{audience}/roles",
        f"{audience}/role",
        "roles",
        "role",
    ]

    for key in candidate_keys:
        value = payload.get(key)
        if isinstance(value, str) and value:
            return value
        if isinstance(value, list) and value:
            first = value[0]
            if isinstance(first, str) and first:
                return first

    permissions = payload.get("permissions")
    if isinstance(permissions, list) and permissions:
        first_permission = permissions[0]
        if isinstance(first_permission, str) and first_permission:
            return first_permission

    return None


async def verify_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    algorithms = _normalize_algorithms(settings.auth0_algorithms)
    if not settings.auth0_domain or not settings.auth0_audience:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Auth0 configuration is missing")

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        jwks = await _get_jwks()
        key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
        if key_data is None:
            jwks = await _get_jwks(force_refresh=True)
            key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
        if key_data is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        public_key = jwk.construct(key_data).to_pem().decode("utf-8")
        payload = jwt.decode(
            token,
            public_key,
            algorithms=algorithms,
            audience=_normalize_audience(settings.auth0_audience),
            issuer=_issuer(),
        )
        return payload
    except HTTPException:
        raise
    except (httpx.HTTPError, JWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
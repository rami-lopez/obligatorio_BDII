from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.core.config import get_settings
from app.db.database import close_pool, init_pool
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.event import router as evento_router
from app.routers.validacion import router as validacion_router
from app.routers.reportes import router as reporte_router
from app.routers.transferencia import router as transferencia_router
from app.routers.users import router as users_router
from app.routers.compra import router as compra_router
from app.routers.entrada import router as entrada_router
from app.routers.estadio import router as estadio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()

settings = get_settings()

app = FastAPI(
    title="Obligatorio BDII",
    lifespan=lifespan,
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
    },
    swagger_ui_init_oauth={
        "clientId": settings.auth0_client_id,
        "usePkceWithAuthorizationCodeGrant": True,
        "additionalQueryStringParams": {"audience": settings.auth0_audience},
        "scopes": ["openid", "profile", "email"],
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(transferencia_router)
app.include_router(evento_router)
app.include_router(validacion_router)
app.include_router(reporte_router)
app.include_router(compra_router)
app.include_router(estadio_router)
app.include_router(entrada_router)


def custom_openapi() -> dict:
    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="API REST para ticketing del Mundial 2026",
        routes=app.routes,
    )

    auth0_domain = settings.auth0_domain.replace("https://", "").replace("http://", "").rstrip("/")

    openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})["Auth0"] = {
        "type": "oauth2",
        "flows": {
            "authorizationCode": {
                "authorizationUrl": f"https://{auth0_domain}/authorize",
                "tokenUrl": f"https://{auth0_domain}/oauth/token",
                "scopes": {
                    "openid": "openid",
                    "profile": "Información del perfil",
                    "email": "Correo electrónico",
                },
            }
        },
    }
    openapi_schema["security"] = [{"Auth0": ["openid", "profile", "email"]}]
    return openapi_schema


app.openapi = custom_openapi

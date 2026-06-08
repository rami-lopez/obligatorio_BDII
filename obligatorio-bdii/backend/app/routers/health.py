from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
async def root() -> dict:
    return {"status": "ok"}


@router.get("/health")
async def health() -> dict:
    return {"status": "healthy"}
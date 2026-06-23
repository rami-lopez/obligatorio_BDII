from pydantic import BaseModel


class SedeCreate(BaseModel):
    pais: str


class SedeResponse(BaseModel):
    id_sede: int
    pais: str
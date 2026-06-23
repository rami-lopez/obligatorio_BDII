from pydantic import BaseModel
from typing import Optional

class SectorCreate(BaseModel):
    codigo: str
    capacidad_max: int
    costo: float


class EstadioCreate(BaseModel):
    nombre: str
    ciudad: str
    id_sede: int
    sectores: list[SectorCreate] = []


class EstadioResponse(BaseModel):
    id_estadio: int
    nombre: str
    ciudad: str
    id_sede: int
    cantidad_eventos: int = 0


class SedeResponse(BaseModel):
    id_sede: int
    pais: str


class SectorResponse(BaseModel):
    id_estadio: int
    codigo: str
    capacidad_max: int
    costo: float
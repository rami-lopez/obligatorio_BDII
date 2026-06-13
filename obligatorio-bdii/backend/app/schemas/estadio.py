from pydantic import BaseModel

class EstadioCreate(BaseModel):
    nombre: str
    pais: str
    ciudad: str
    id_sede: int


class EstadioResponse(BaseModel):
    id_estadio: int
    nombre: str
    pais: str
    ciudad: str
    id_sede: int


class SectorCreate(BaseModel):
    codigo: str
    capacidad_max: int
    costo: float


class SectorResponse(BaseModel):
    id_estadio: int
    codigo: str
    capacidad_max: int
    costo: float
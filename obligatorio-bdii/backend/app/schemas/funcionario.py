from pydantic import BaseModel
from datetime import datetime


class EventoFuncionarioResponse(BaseModel):
    id_evento: int
    fecha_hora: datetime
    equipo_local: str
    equipo_visitante: str

    id_estadio: int
    estadio_nombre: str
    estadio_ciudad: str

    sector_codigo: str
    capacidad_max: int
    costo: float
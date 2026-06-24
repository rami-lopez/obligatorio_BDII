from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventBase(BaseModel):
    fecha_hora:       datetime
    equipo_local:     str
    equipo_visitante: str
    id_estadio:       int

class EventResponse(EventBase):
    id_evento:        int
    mail_admin:       str
    estadio_nombre:   str | None = None
    estadio_ciudad:   str | None = None
    id_sede:          int | None = None
    sede_pais:        str | None = None

    class Config:
        from_attributes = True

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    fecha_hora:       Optional[datetime] = None
    equipo_local:     Optional[str]      = None
    equipo_visitante: Optional[str]      = None
    id_estadio:       Optional[int]      = None


class SectorEventoResponse(BaseModel):
    codigo: str
    capacidad_max: int
    costo: float
    vendidas: int
    disponibles: int

    class Config:
        from_attributes = True

class SectorAdminResponse(BaseModel):
    codigo: str
    capacidad_max: int
    costo: float
    vendidas: int
    disponibles: int
    habilitado: bool

    class Config:
        from_attributes = True

class HabilitarSectorRequest(BaseModel):
    codigo_sector: str
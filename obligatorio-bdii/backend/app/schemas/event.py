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

    class Config:
        from_attributes = True

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    fecha_hora:       Optional[datetime] = None
    equipo_local:     Optional[str]      = None
    equipo_visitante: Optional[str]      = None
    id_estadio:       Optional[int]      = None
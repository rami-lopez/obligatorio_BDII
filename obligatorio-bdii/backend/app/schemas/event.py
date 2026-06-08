from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime

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
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class FuncionarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    mail: str
    pais_doc: str | None = None
    tipo_doc: str | None = None
    nro_doc: str | None = None
    nro_legajo: str
    fecha_registro: date | None = None


class AsignacionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_evento: int
    id_estadio: int
    codigo_sector: str
    evento_local: str | None = None
    evento_visitante: str | None = None
    fecha_hora: datetime | None = None
    estadio_nombre: str | None = None


class AsignacionCreate(BaseModel):
    id_evento: int
    id_estadio: int
    codigo_sector: str

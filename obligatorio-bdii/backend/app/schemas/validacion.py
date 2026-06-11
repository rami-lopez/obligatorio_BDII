from __future__ import annotations

from pydantic import BaseModel

class SectorValidacionResponse(BaseModel):
    codigo_sector: str
    id_evento: int
    ya_validado: bool

    class Config:
        from_attributes = True

class DispositivoResponse (BaseModel):
    mail_funcionario: str
    identificador: str

    class Config:
        from_attributes = True
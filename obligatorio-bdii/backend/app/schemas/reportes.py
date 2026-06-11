from pydantic import BaseModel
from datetime import datetime

class EventoMasVendidoResponse(BaseModel):
    id_evento: int
    equipo_local: str
    equipo_visitante: str
    entradas_vendidas: int

    class Config:
        from_attributes = True

class MayorCompradorResponse(BaseModel):
    mail_usuario: str
    entradas_compradas: int
    dinero_gastado: float

    class Config:
        from_attributes = True
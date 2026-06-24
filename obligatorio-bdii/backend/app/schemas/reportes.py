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

class ValidacionReporteResponse(BaseModel):
    id_validacion: int
    fecha_hora: datetime
    mail_funcionario: str
    identificador_disp: str
    id_entrada: int
    id_evento: int
    equipo_local: str
    equipo_visitante: str | None
    codigo_sector: str
    evento_fecha: datetime
    mail_propietario: str

    class Config:
        from_attributes = True
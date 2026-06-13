from datetime import datetime
from pydantic import BaseModel


class EntradaDetalleResponse(BaseModel):
    id_entrada: int
    estado: str
    mail_propietario: str
    equipo_local: str
    equipo_visitante: str
    fecha_hora: datetime
    codigo_sector: str
    estadio: str

class HistorialTransferenciaResponse(BaseModel):
    id_transferencia: int
    mail_origen: str
    mail_destino: str
    fecha_solicitud: datetime
    fecha_aceptacion: datetime | None
    estado: str

class QRResponse(BaseModel):
    id_token: int
    codigo_hash: str
    generado_en: datetime
    expira_en: datetime
    activo: bool
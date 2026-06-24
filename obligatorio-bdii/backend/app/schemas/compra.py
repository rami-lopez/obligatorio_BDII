from pydantic import BaseModel
from datetime import datetime

class CompraCreate(BaseModel):
    id_evento: int
    id_estadio: int
    codigo_sector: str
    cantidad: int

class EntradaResumen(BaseModel):
    id_entrada: int
    estado: str
    codigo_sector: str

class VentaDetalleResponse(BaseModel):
    id_venta: int
    fecha: datetime
    estado: str
    monto_total: float
    tasa_comision: float
    mail_usuario: str
    cantidad: int
    entradas: list[EntradaResumen]

class PagoActionResponse(BaseModel):
    id_venta: int
    estado_venta: str
    estado_entradas: str
    cantidad_actualizada: int
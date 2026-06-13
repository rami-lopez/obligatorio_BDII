from pydantic import BaseModel

class CompraCreate(BaseModel):
    id_evento: int
    id_estadio: int
    codigo_sector: str
    cantidad: int
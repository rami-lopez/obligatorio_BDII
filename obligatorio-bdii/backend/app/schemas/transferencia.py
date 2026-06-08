from pydantic import BaseModel, EmailStr

class TransferenciaCreate(BaseModel):
    id_entrada: int
    mail_destino: EmailStr
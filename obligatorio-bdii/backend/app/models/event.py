from sqlalchemy import Column, String, Integer, DateTime
from app.db.database import Base

class Evento(Base):
    __tablename__ = "evento"
    id_evento        = Column(Integer, primary_key=True, autoincrement=True)
    fecha_hora       = Column(DateTime, nullable=False)
    equipo_local     = Column(String(100), nullable=False)
    equipo_visitante = Column(String(100), nullable=False)
    id_estadio       = Column(Integer, nullable=False)
    mail_admin       = Column(String(255), nullable=False)
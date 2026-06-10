from app.db.database import execute, fetch_all, fetch_one, transaction
from app.schemas.event import EventCreate

async def get_evento(id_evento: int) -> list | None:
    return await fetch_one(
        "SELECT * FROM evento WHERE id_evento = %s",
        (id_evento,),
    )

async def get_eventos() -> dict | None:
    return await fetch_all(
        "SELECT * FROM evento"
    )

async def crear_evento(evento: EventCreate, mail_admin: str) -> dict | None:
    existente = await fetch_one(
        "SELECT 1 FROM evento WHERE id_estadio = %s AND fecha_hora = %s",
        (evento.id_estadio, evento.fecha_hora),
    )

    if existente is not None:
        return None
    
    async with transaction() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO ticketing_mundial.evento (
                    fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                (evento.fecha_hora, evento.equipo_local, evento.equipo_visitante, evento.id_estadio, mail_admin)
            )
            await cursor.execute("SELECT LAST_INSERT_ID()")
            row = await cursor.fetchone()
            id_nuevo = row[0]
    creado = await get_evento(id_nuevo)
    return creado or {}

        
    
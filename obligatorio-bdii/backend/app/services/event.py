from app.db.database import execute, fetch_all, fetch_one, transaction
from app.schemas.event import EventCreate, EventUpdate

async def get_evento(id_evento: int) -> list | None:
    return await fetch_one(
        "SELECT * FROM evento WHERE id_evento = %s",
        (id_evento,),
    )

async def get_eventos() -> dict | None:
    return await fetch_all(
        "SELECT * FROM evento"
    )

async def update_evento(id_evento: int, datos: EventUpdate) -> dict | None:
    print("datos completos:", datos.model_dump())

    # verificamos que exista el evento
    existente = await get_evento(id_evento)
    print("existente!:", existente)
    if existente is None:
        return None
    
    # si cambia el id del estadio
    if datos.id_estadio is not None and datos.id_estadio != existente["id_estadio"]:
        entradas = await fetch_one(
            "SELECT 1 FROM entrada WHERE id_evento = %s AND estado != 'anulada'",
            (id_evento,),
        )
        if entradas is not None:
            return "tiene_entradas"
        
    # verificamos que no haya superposicion

    print("datos.fecha_hora:", datos.fecha_hora)
    print("tipo:", type(datos.fecha_hora))

    id_estadio_check = datos.id_estadio or existente["id_estadio"]
    fecha_check = datos.fecha_hora or existente["fecha_hora"]
    equipo_local_check = datos.equipo_local or existente["equipo_local"]
    equipo_visitante_check = datos.equipo_visitante or existente["equipo_visitante"]

    print("estadio:", id_estadio_check)
    print("fecha:", fecha_check)
    print("id_evento:", id_evento)

    superposicion = await fetch_one(
        """
        SELECT 1 FROM evento
        WHERE id_estadio = %s
          AND fecha_hora = %s
          AND id_evento != %s
        """,
        (id_estadio_check, fecha_check, id_evento),
    )
    print("superposicion resultado:", superposicion)
    if superposicion is not None:
        return "superposicion"

    equipo_superposicion = await fetch_one(
        """
        SELECT 1 FROM evento
        WHERE fecha_hora = %s
          AND id_evento != %s
          AND (equipo_local = %s OR equipo_visitante = %s
               OR equipo_local = %s OR equipo_visitante = %s)
        """,
        (fecha_check, id_evento,
         equipo_local_check, equipo_local_check,
         equipo_visitante_check, equipo_visitante_check),
    )
    if equipo_superposicion is not None:
        return "superposicion_equipo"
    
    # actualizamos los campos nuevos
    campos = {}
    if datos.fecha_hora is not None:
        campos["fecha_hora"] = datos.fecha_hora
    if datos.equipo_local is not None:
        campos["equipo_local"] = datos.equipo_local
    if datos.equipo_visitante is not None:
        campos["equipo_visitante"] = datos.equipo_visitante
    if datos.id_estadio is not None:
        campos["id_estadio"] = datos.id_estadio

    if not campos:
        return existente
    
    async with transaction() as connection:
        async with connection.cursor() as cursor:
            # Si cambia estadio, borrar sectores viejos
            if datos.id_estadio is not None and datos.id_estadio != existente["id_estadio"]:
                await cursor.execute(
                    "DELETE FROM evento_sector WHERE id_evento = %s",
                    (id_evento,),
                )

            set_clause = ", ".join(f"{k} = %s" for k in campos)
            valores = list(campos.values()) + [id_evento]
            await cursor.execute(
                f"UPDATE evento SET {set_clause} WHERE id_evento = %s",
                valores,
            )

    return await get_evento(id_evento)

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

        
    
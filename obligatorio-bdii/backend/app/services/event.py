from app.db.database import execute, fetch_all, fetch_one, transaction
from app.schemas.event import EventCreate, EventUpdate

async def get_evento(id_evento: int) -> list | None:
    return await fetch_one(
        "SELECT * FROM evento WHERE id_evento = %s",
        (id_evento,),
    )

async def get_eventos(
    id_sede_filter: int | None = None,
    estadio_nombre: str | None = None,
) -> list:
    query = """
        SELECT
            ev.*,
            es.nombre AS estadio_nombre,
            es.ciudad AS estadio_ciudad,
            es.id_sede,
            sd.pais AS sede_pais
        FROM evento ev
        JOIN estadio es ON es.id_estadio = ev.id_estadio
        JOIN sede sd ON sd.id_sede = es.id_sede
        WHERE 1=1
    """
    params = []
    if id_sede_filter is not None:
        query += " AND es.id_sede = %s"
        params.append(id_sede_filter)
    if estadio_nombre:
        query += " AND es.nombre = %s"
        params.append(estadio_nombre)
    query += " ORDER BY ev.fecha_hora"
    return await fetch_all(query, tuple(params))

async def get_sectores_evento(id_evento: int) -> list | None:
    return await fetch_all(
        """
        SELECT
            s.codigo,
            s.capacidad_max,
            s.costo,
            COUNT(e.id_entrada) AS vendidas,
            s.capacidad_max - COUNT(e.id_entrada) AS disponibles
        FROM ticketing_mundial.evento_sector es
        JOIN ticketing_mundial.sector s ON s.id_estadio = es.id_estadio AND s.codigo = es.codigo_sector
        LEFT JOIN ticketing_mundial.entrada e ON e.id_estadio = s.id_estadio
                        AND e.codigo_sector = s.codigo
                        AND e.id_evento = es.id_evento
                        AND e.estado != 'anulada'
        WHERE es.id_evento = %s
        GROUP BY s.codigo, s.capacidad_max, s.costo;
        """,
        (id_evento,),
    )


async def get_sectores_evento_admin(id_evento: int) -> list | None:
    evento = await get_evento(id_evento)
    if evento is None:
        return None

    return await fetch_all(
        """
        SELECT
            s.codigo,
            s.capacidad_max,
            s.costo,
            COUNT(e.id_entrada) AS vendidas,
            s.capacidad_max - COUNT(e.id_entrada) AS disponibles,
            CASE WHEN es.codigo_sector IS NOT NULL THEN TRUE ELSE FALSE END AS habilitado
        FROM ticketing_mundial.sector s
        LEFT JOIN ticketing_mundial.evento_sector es
            ON es.id_estadio = s.id_estadio
            AND es.codigo_sector = s.codigo
            AND es.id_evento = %s
        LEFT JOIN ticketing_mundial.entrada e
            ON e.id_estadio = s.id_estadio
            AND e.codigo_sector = s.codigo
            AND e.id_evento = %s
            AND e.estado != 'anulada'
        WHERE s.id_estadio = %s
        GROUP BY s.codigo, s.capacidad_max, s.costo, es.codigo_sector
        ORDER BY s.codigo;
        """,
        (id_evento, id_evento, evento["id_estadio"]),
    )

async def update_evento(id_evento: int, datos: EventUpdate) -> dict | None:
    # verificamos que exista el evento
    existente = await get_evento(id_evento)
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
    id_estadio_check = datos.id_estadio or existente["id_estadio"]
    fecha_check = datos.fecha_hora or existente["fecha_hora"]
    equipo_local_check = datos.equipo_local or existente["equipo_local"]
    equipo_visitante_check = datos.equipo_visitante or existente["equipo_visitante"]

    superposicion = await fetch_one(
        """
        SELECT 1 FROM evento
        WHERE id_estadio = %s
          AND fecha_hora = %s
          AND id_evento != %s
        """,
        (id_estadio_check, fecha_check, id_evento),
    )
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
                INSERT INTO evento (
                    fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                (evento.fecha_hora, evento.equipo_local, evento.equipo_visitante, evento.id_estadio, mail_admin)
            )
            await cursor.execute("SELECT LAST_INSERT_ID()")
            row = await cursor.fetchone()
            id_nuevo = row[0]
    
    return {
        "id_evento": id_nuevo,
        "fecha_hora": evento.fecha_hora,
        "equipo_local": evento.equipo_local,
        "equipo_visitante": evento.equipo_visitante,
        "id_estadio": evento.id_estadio,
        "mail_admin": mail_admin,
    }

        
async def habilitar_sector(id_evento: int, codigo_sector: str) -> dict | None:
    
    evento = await get_evento(id_evento)
    if evento is None:
        return None

    # verificamos que el sector existe en el estadio de ese evento
    sector = await fetch_one(
        "SELECT 1 FROM ticketing_mundial.sector WHERE id_estadio = %s AND codigo = %s",
        (evento["id_estadio"], codigo_sector),
    )
    if sector is None:
        return "sector_no_existe"

    # verificamos que el sector no este ya habilitado
    ya_habilitado = await fetch_one(
        "SELECT 1 FROM evento_sector WHERE id_evento = %s AND codigo_sector = %s",
        (id_evento, codigo_sector),
    )
    if ya_habilitado is not None:
        return "ya_habilitado"

    # insertamos en evento_sector
    await execute(
        """
        INSERT INTO evento_sector (id_evento, id_estadio, codigo_sector)
        VALUES (%s, %s, %s)
        """,
        (id_evento, evento["id_estadio"], codigo_sector),
    )

    return await get_sectores_evento_admin(id_evento)


async def deshabilitar_sector(id_evento: int, codigo_sector: str) -> list | str | None:
    evento = await get_evento(id_evento)
    if evento is None:
        return None

    existe = await fetch_one(
        "SELECT 1 FROM evento_sector WHERE id_evento = %s AND codigo_sector = %s",
        (id_evento, codigo_sector),
    )
    if existe is None:
        return "no_habilitado"

    entradas = await fetch_one(
        "SELECT 1 FROM entrada WHERE id_evento = %s AND codigo_sector = %s AND estado != 'anulada'",
        (id_evento, codigo_sector),
    )
    if entradas is not None:
        return "tiene_entradas"

    await execute(
        "DELETE FROM evento_sector WHERE id_evento = %s AND codigo_sector = %s",
        (id_evento, codigo_sector),
    )

    return await get_sectores_evento_admin(id_evento)
    
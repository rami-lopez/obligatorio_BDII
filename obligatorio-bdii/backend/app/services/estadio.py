from fastapi import HTTPException, status

from app.db.database import fetch_one, fetch_all, execute, transaction

async def obtener_sedes():
    return await fetch_all(
        """
        SELECT
            id_sede,
            pais
        FROM sede
        ORDER BY pais
        """
    )

async def obtener_estadios(id_sede: int | None = None):

    query = """
        SELECT
            e.id_estadio,
            e.nombre,
            e.ciudad,
            e.id_sede,
            s.pais AS pais,
            COUNT(ev.id_evento) AS cantidad_eventos
        FROM estadio e
        JOIN sede s ON e.id_sede = s.id_sede
        LEFT JOIN evento ev ON e.id_estadio = ev.id_estadio
    """
    params = []
    if id_sede is not None:
        query += " WHERE e.id_sede = %s"
        params.append(id_sede)
    query += " GROUP BY e.id_estadio, e.nombre, e.ciudad, e.id_sede, s.pais ORDER BY e.nombre"

    return await fetch_all(query, tuple(params))

async def obtener_estadio(id_estadio: int):

    estadio = await fetch_one(
        """
        SELECT
            e.id_estadio,
            e.nombre,
            e.ciudad,
            e.id_sede,
            s.pais AS pais,
            COUNT(ev.id_evento) AS cantidad_eventos
        FROM estadio e
        JOIN sede s ON e.id_sede = s.id_sede
        LEFT JOIN evento ev ON e.id_estadio = ev.id_estadio
        WHERE e.id_estadio = %s
        GROUP BY e.id_estadio, e.nombre, e.ciudad, e.id_sede, s.pais
        """,
        (id_estadio,)
    )

    if estadio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estadio no encontrado"
        )

    return estadio

async def crear_estadio(
    nombre: str,
    ciudad: str,
    id_sede: int,
    sectores: list | None = None,
):
    
    # Verificar que no exista un estadio con el mismo nombre
    existente = await fetch_one(
        "SELECT id_estadio FROM estadio WHERE nombre = %s",
        (nombre,)
    )
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un estadio con ese nombre"
        )

    async with transaction() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO estadio (nombre, ciudad, id_sede)
                VALUES (%s, %s, %s)
                """,
                (nombre, ciudad, id_sede)
            )
            await cursor.execute("SELECT LAST_INSERT_ID()")
            row = await cursor.fetchone()
            id_nuevo = row[0]

            if sectores:
                for s in sectores:
                    await cursor.execute(
                        """
                        INSERT INTO sector (id_estadio, codigo, capacidad_max, costo)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (id_nuevo, s["codigo"], s["capacidad_max"], s["costo"]),
                    )

    return await obtener_estadio(id_nuevo)

async def obtener_sectores(id_estadio: int):

    return await fetch_all(
        """
        SELECT
            id_estadio,
            codigo,
            capacidad_max,
            costo
        FROM sector
        WHERE id_estadio = %s
        ORDER BY codigo
        """,
        (id_estadio,)
    )

async def crear_sector(
    id_estadio: int,
    codigo: str,
    capacidad_max: int,
    costo: float,
):

    return await execute(
        """
        INSERT INTO sector(
            id_estadio,
            codigo,
            capacidad_max,
            costo
        )
        VALUES(
            %s,
            %s,
            %s,
            %s
        )
        """,
        (
            id_estadio,
            codigo,
            capacidad_max,
            costo
        )
    )

async def eliminar_estadio(id_estadio: int):

    estadio = await fetch_one(
        """
        SELECT id_estadio
        FROM estadio
        WHERE id_estadio = %s
        """,
        (id_estadio,)
    )

    if estadio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estadio no encontrado"
        )

    async with transaction() as conn:
        async with conn.cursor() as cursor:

            # eliminar entradas de eventos del estadio
            await cursor.execute(
                """
                DELETE en
                FROM entrada en
                JOIN evento ev
                    ON en.id_evento = ev.id_evento
                WHERE ev.id_estadio = %s
                """,
                (id_estadio,)
            )

            # eliminar eventos
            await cursor.execute(
                """
                DELETE FROM evento
                WHERE id_estadio = %s
                """,
                (id_estadio,)
            )

            # eliminar sectores
            await cursor.execute(
                """
                DELETE FROM sector
                WHERE id_estadio = %s
                """,
                (id_estadio,)
            )

            # eliminar estadio
            await cursor.execute(
                """
                DELETE FROM estadio
                WHERE id_estadio = %s
                """,
                (id_estadio,)
            )

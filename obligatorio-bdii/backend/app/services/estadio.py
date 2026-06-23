from fastapi import HTTPException, status

from app.db.database import fetch_one, fetch_all, execute

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

async def obtener_estadios():

    return await fetch_all(
        """
        SELECT
            e.id_estadio,
            e.nombre,
            e.ciudad,
            e.id_sede,
            s.pais AS pais
        FROM estadio e
        JOIN sede s ON e.id_sede = s.id_sede
        ORDER BY e.nombre
        """
    )

async def obtener_estadio(id_estadio: int):

    estadio = await fetch_one(
        """
        SELECT
            e.id_estadio,
            e.nombre,
            e.ciudad,
            e.id_sede,
            s.pais AS pais
        FROM estadio e
        JOIN sede s ON e.id_sede = s.id_sede
        WHERE e.id_estadio = %s
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
):

    return await execute(
        """
        INSERT INTO estadio(
            nombre,
            ciudad,
            id_sede
        )
        VALUES(
            %s,
            %s,
            %s
        )
        """,
        (
            nombre,
            ciudad,
            id_sede
        )
    )

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

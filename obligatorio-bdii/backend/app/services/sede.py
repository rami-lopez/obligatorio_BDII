from fastapi import HTTPException, status
from app.db.database import fetch_all, fetch_one, execute


async def listar_sedes():
    return await fetch_all(
        """
        SELECT
            id_sede,
            pais
        FROM sede
        ORDER BY nombre
        """
    )


async def crear_sede(
    pais: str,
):
    existe = await fetch_one(
        """
        SELECT id_sede
        FROM sede
        WHERE pais = %s
        """,
        (pais),
    )

    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La sede ya existe"
        )

    id_sede = await execute(
        """
        INSERT INTO sede(
            pais
        )
        VALUES (%s)
        """,
        (
            pais,
        ),
    )

    return {
        "mensaje": "Sede creada correctamente",
        "id_sede": id_sede,
    }
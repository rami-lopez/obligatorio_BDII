from fastapi import HTTPException, status

from app.db.database import fetch_one, execute

async def comprar_entradas(
    mail_usuario: str,
    id_evento: int,
    id_estadio: int,
    codigo_sector: str,
    cantidad: int,
):

    if cantidad < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cantidad invalida"
        )

    if cantidad > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden comprar mas de 5 entradas"
        )

    evento_sector = await fetch_one(
        """
        SELECT 1
        FROM evento_sector
        WHERE id_evento = %s
        AND id_estadio = %s
        AND codigo_sector = %s
        """,
        (id_evento, id_estadio, codigo_sector)
    )

    if evento_sector is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no habilitado para el evento"
        )

    sector = await fetch_one(
        """
        SELECT costo
        FROM sector
        WHERE id_estadio = %s
        AND codigo = %s
        """,
        (id_estadio, codigo_sector)
    )

    if sector is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector inexistente"
        )

    costo = float(sector["costo"])

    tasa_comision = 0.10
    monto_total = costo * cantidad * (1 + tasa_comision)

    id_venta = await execute(
        """
        INSERT INTO venta(
            monto_total,
            tasa_comision,
            mail_usuario
        )
        VALUES(
            %s,
            %s,
            %s
        )
        """,
        (
            monto_total,
            tasa_comision,
            mail_usuario
        )
    )

    entradas_creadas = []

    for _ in range(cantidad):

        id_entrada = await execute(
            """
            INSERT INTO entrada(
                id_venta,
                id_evento,
                id_estadio,
                codigo_sector,
                mail_propietario
            )
            VALUES(
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                id_venta,
                id_evento,
                id_estadio,
                codigo_sector,
                mail_usuario
            )
        )

        entradas_creadas.append(id_entrada)

    return {
        "id_venta": id_venta,
        "cantidad": cantidad,
        "monto_total": monto_total,
        "entradas": entradas_creadas
    }
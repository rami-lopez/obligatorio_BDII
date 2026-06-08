from fastapi import HTTPException, status 
from app.db.database import fetch_one, execute, fetch_all

async def crear_transferencia(
    id_entrada: int,
    mail_destino: str,
    mail_origen: str,
):
    entrada = await fetch_one(
        """
        SELECT
            mail_propietario,
            estado
        FROM entrada
        WHERE id_entrada = %s
        """,
        (id_entrada,)
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La entrada no existe"
        )

    if entrada["mail_propietario"] != mail_origen:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres propietario de esta entrada"
        )

    if entrada["estado"] == "consumida":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada ya fue utilizada"
        )

    usuario_destino = await fetch_one(
        """
        SELECT mail
        FROM usuario
        WHERE mail = %s
        """,
        (mail_destino,)
    )

    if usuario_destino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario destino inexistente"
        )

    transferencias = await fetch_one(
        """
        SELECT COUNT(*) AS cantidad
        FROM transferencia
        WHERE id_entrada = %s
        AND estado = 'aceptada'
        """,
        (id_entrada,)
    )

    if transferencias["cantidad"] >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada alcanzó el máximo de transferencias"
        )

    await execute(
        """
        INSERT INTO transferencia(
            id_entrada,
            mail_origen,
            mail_destino,
            nro_orden
        )
        VALUES(
            %s,
            %s,
            %s,
            %s
        )
        """,
        (
            id_entrada,
            mail_origen,
            mail_destino,
            transferencias["cantidad"] + 1,
        )
    )

    return {
        "message": "Transferencia creada correctamente"
    }


async def obtener_transferencias_pendientes(mail_usuario: str):

    return await fetch_all(
        """
        SELECT
            t.id_transferencia,
            t.id_entrada,
            t.mail_origen,
            t.fecha_solicitud,
            t.nro_orden
        FROM transferencia t
        WHERE t.mail_destino = %s
        AND t.estado = 'pendiente'
        ORDER BY t.fecha_solicitud DESC
        """,
        (mail_usuario,)
    )


async def aceptar_transferencia(
    id_transferencia: int,
    mail_usuario: str
):

    transferencia = await fetch_one(
        """
        SELECT
            id_entrada,
            mail_destino,
            estado
        FROM transferencia
        WHERE id_transferencia = %s
        """,
        (id_transferencia,)
    )

    if transferencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transferencia inexistente"
        )

    if transferencia["mail_destino"] != mail_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes aceptar esta transferencia"
        )

    if transferencia["estado"] != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La transferencia ya fue procesada"
        )

    await execute(
        """
        UPDATE transferencia
        SET
            estado = 'aceptada',
            fecha_aceptacion = NOW()
        WHERE id_transferencia = %s
        """,
        (id_transferencia,)
    )

    await execute(
        """
        UPDATE entrada
        SET mail_propietario = %s
        WHERE id_entrada = %s
        """,
        (
            mail_usuario,
            transferencia["id_entrada"]
        )
    )

    return {
        "message": "Transferencia aceptada"
    }


async def rechazar_transferencia(
    id_transferencia: int,
    mail_usuario: str
):

    transferencia = await fetch_one(
        """
        SELECT
            mail_destino,
            estado
        FROM transferencia
        WHERE id_transferencia = %s
        """,
        (id_transferencia,)
    )

    if transferencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transferencia inexistente"
        )

    if transferencia["mail_destino"] != mail_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes rechazar esta transferencia"
        )

    if transferencia["estado"] != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La transferencia ya fue procesada"
        )

    await execute(
        """
        UPDATE transferencia
        SET estado = 'rechazada'
        WHERE id_transferencia = %s
        """,
        (id_transferencia,)
    )

    return {
        "message": "Transferencia rechazada"
    }

from fastapi import HTTPException, status 
from pymysql.err import OperationalError
from app.db.database import fetch_one, execute, fetch_all

async def crear_transferencia(
    id_entrada: int,
    mail_destino: str,
    mail_origen: str,
):
    mail_origen = mail_origen.lower()
    mail_destino = mail_destino.lower()

    entrada = await fetch_one(
        """
        SELECT
            e.mail_propietario,
            e.estado,
            ev.equipo_local,
            ev.equipo_visitante
        FROM entrada e
        JOIN evento ev ON ev.id_evento = e.id_evento
        WHERE e.id_entrada = %s
        """,
        (id_entrada,)
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La entrada no existe"
        )

    if entrada["mail_propietario"].lower() != mail_origen:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres propietario de esta entrada"
        )

    if entrada["estado"] == "consumida":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada ya fue utilizada"
        )

    if entrada["estado"] != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada no está disponible para transferir"
        )

    if mail_origen == mail_destino:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes transferirte una entrada a ti mismo"
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

    pendiente = await fetch_one(
        """
        SELECT id_transferencia
        FROM transferencia
        WHERE id_entrada = %s
          AND estado = 'pendiente'
        LIMIT 1
        """,
        (id_entrada,)
    )

    if pendiente is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una transferencia pendiente para esta entrada"
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

    try:
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

        await execute(
            """
            UPDATE entrada
            SET estado = 'transferida'
            WHERE id_entrada = %s
              AND estado = 'activa'
            """,
            (id_entrada,)
        )

    except OperationalError as e:
        if e.args and e.args[0] == 1644:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.args[1],
            )

        raise

    return {
        "message": "Transferencia creada correctamente"
    }


async def listar_transferencias(mail_usuario: str):
    return await fetch_all(
        """
        SELECT
            t.id_transferencia,
            t.mail_origen,
            t.mail_destino,
            t.fecha_solicitud,
            t.fecha_aceptacion,
            t.estado,
            t.nro_orden,
            t.id_entrada,
            e.id_evento,
            e.codigo_sector,
            ev.equipo_local,
            ev.equipo_visitante,
            ev.fecha_hora,
            es.nombre AS estadio
        FROM transferencia t
        JOIN entrada e ON e.id_entrada = t.id_entrada
        JOIN evento ev ON ev.id_evento = e.id_evento
        JOIN estadio es ON es.id_estadio = e.id_estadio
        WHERE t.mail_origen = %s OR t.mail_destino = %s
        ORDER BY t.fecha_solicitud DESC
        """,
        (mail_usuario, mail_usuario)
    )


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
            t.id_entrada,
            t.mail_origen,
            t.mail_destino,
            t.estado,
            ev.equipo_local,
            ev.equipo_visitante
        FROM transferencia t
        JOIN entrada e ON e.id_entrada = t.id_entrada
        JOIN evento ev ON ev.id_evento = e.id_evento
        WHERE t.id_transferencia = %s
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
            t.id_entrada,
            t.mail_origen,
            t.mail_destino,
            t.estado,
            ev.equipo_local,
            ev.equipo_visitante
        FROM transferencia t
        JOIN entrada e ON e.id_entrada = t.id_entrada
        JOIN evento ev ON ev.id_evento = e.id_evento
        WHERE t.id_transferencia = %s
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

    await execute(
        "UPDATE entrada SET estado = 'activa' WHERE id_entrada = %s",
        (transferencia["id_entrada"],)
    )

    return {
        "message": "Transferencia rechazada"
    }

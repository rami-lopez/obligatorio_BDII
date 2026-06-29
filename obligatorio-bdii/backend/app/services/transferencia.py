from fastapi import HTTPException, status 
from pymysql.err import OperationalError
from app.db.database import fetch_one, execute, fetch_all, call_procedure

async def crear_transferencia(
    id_entrada: int,
    mail_destino: str,
    mail_origen: str,
):
    mail_origen = mail_origen.lower()
    mail_destino = mail_destino.lower()

    usuario_destino = await fetch_one(
        "SELECT mail FROM usuario WHERE mail = %s",
        (mail_destino,)
    )
    if usuario_destino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario destino inexistente"
        )

    usuario_general_destino = await fetch_one(
        "SELECT mail_usuario FROM usuario_general WHERE mail_usuario = %s",
        (mail_destino,)
    )
    if usuario_general_destino is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden transferir entradas a usuarios generales"
        )

    if mail_origen == mail_destino:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes transferirte una entrada a ti mismo"
        )

    # Llamada al SP
    try:
        await call_procedure("SP_SolicitarTransferencia", (id_entrada, mail_destino))
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
    # Verificar que la transferencia existe y pertenece al usuario
    transferencia = await fetch_one(
        """
        SELECT
            t.mail_destino,
            t.estado
        FROM transferencia t
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

    try:
        await call_procedure("SP_AceptarTransferencia", (id_transferencia,))
    except OperationalError as e:
        if e.args and e.args[0] == 1644:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.args[1],
            )
        raise

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

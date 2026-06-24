from fastapi import HTTPException, status

from app.services.qr import generar_hash_qr
from app.db.database import fetch_one, fetch_all

async def obtener_entrada(
    id_entrada: int,
    mail_usuario: str,
):
    entrada = await fetch_one(
        """
        SELECT
            e.id_entrada,
            e.estado,
            e.mail_propietario,
            ev.equipo_local,
            ev.equipo_visitante,
            ev.fecha_hora,
            e.codigo_sector,
            es.nombre AS estadio
        FROM entrada e
        JOIN evento ev
            ON e.id_evento = ev.id_evento
        JOIN estadio es
            ON ev.id_estadio = es.id_estadio
        WHERE e.id_entrada = %s
        """,
        (id_entrada,)
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada"
        )

    if entrada["mail_propietario"] != mail_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver esta entrada"
        )

    return entrada


async def obtener_historial_entrada(
    id_entrada: int,
    mail_usuario: str,
):
    entrada = await fetch_one(
        """
        SELECT mail_propietario
        FROM entrada
        WHERE id_entrada = %s
        """,
        (id_entrada,)
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada"
        )

    if entrada["mail_propietario"] != mail_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para consultar esta entrada"
        )

    historial = await fetch_all(
        """
        SELECT
            id_transferencia,
            mail_origen,
            mail_destino,
            fecha_solicitud,
            fecha_aceptacion,
            estado
        FROM transferencia
        WHERE id_entrada = %s
        ORDER BY fecha_solicitud
        """,
        (id_entrada,)
    )

    return historial


async def obtener_qr_entrada(
    id_entrada: int,
    mail_usuario: str,
):
    entrada = await fetch_one(
        "SELECT mail_propietario, estado FROM entrada WHERE id_entrada = %s",
        (id_entrada,)
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada"
        )

    if entrada["mail_propietario"] != mail_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para consultar esta entrada"
        )

    if entrada["estado"] == "consumida":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada ya fue consumida"
        )

    hash_actual = generar_hash_qr(id_entrada)

    return {
        "hash_actual": hash_actual,
        "id_entrada": id_entrada,
    }

async def listar_entradas(mail_usuario: str):
    return await fetch_all(
        """
        SELECT
            e.id_entrada,
            e.estado,
            ev.id_evento,
            ev.equipo_local,
            ev.equipo_visitante,
            ev.fecha_hora,
            es.nombre AS estadio,
            es.ciudad,
            e.codigo_sector,
            (SELECT COUNT(*) FROM transferencia t WHERE t.id_entrada = e.id_entrada AND t.estado = 'aceptada') AS transferencias
        FROM entrada e
        JOIN evento ev
            ON e.id_evento = ev.id_evento
            AND e.id_estadio = ev.id_estadio
        JOIN estadio es
            ON e.id_estadio = es.id_estadio
        WHERE e.mail_propietario = %s
        ORDER BY ev.fecha_hora
        """,
        (mail_usuario,)
    )
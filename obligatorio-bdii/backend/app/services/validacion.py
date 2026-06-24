from fastapi import HTTPException, status
from app.schemas.event import EventCreate
from app.services.qr import generar_hash_qr, verificar_hash_qr
from app.db.database import fetch_all, fetch_one, execute, transaction

async def get_sectores_asignados(id_evento: int, mail_funcionario: str) -> list | None:
    return await fetch_all(
        """
        SELECT
            a.codigo_sector,
            a.id_evento,
            CASE WHEN COUNT(v.id_validacion) > 0 THEN TRUE ELSE FALSE END AS ya_validado
        FROM ticketing_mundial.asignacion a
        LEFT JOIN ticketing_mundial.validacion v ON v.mail_funcionario = a.mail_funcionario
        LEFT JOIN ticketing_mundial.entrada e ON v.id_entrada = e.id_entrada
                                            AND e.codigo_sector = a.codigo_sector
                                            AND e.id_evento = a.id_evento
        WHERE a.id_evento = %s AND a.mail_funcionario = %s
        GROUP BY a.codigo_sector, a.id_evento
        """,
        (id_evento, mail_funcionario),
    )

async def get_dispositivos(mail_funcionario: str) -> list | None:
    return await fetch_all(
        """
        SELECT mail_funcionario, identificador 
        FROM ticketing_mundial.dispositivo 
        WHERE mail_funcionario = %s
        """,
        (mail_funcionario,),
    )

async def post_validar(
    hash_ingresado: str,
    identificador_disp: str,
    mail_funcionario: str,
):
    entradas = await fetch_all(
        """
        SELECT 
            e.id_entrada,
            e.estado,
            e.id_evento,
            e.codigo_sector
        FROM ticketing_mundial.entrada e
        JOIN ticketing_mundial.asignacion a
            ON a.id_evento = e.id_evento
            AND a.codigo_sector = e.codigo_sector
        WHERE a.mail_funcionario = %s
          AND e.estado <> 'consumida'
        """,
        (mail_funcionario,),
    )

    coincidencias = []

    for entrada in entradas:
        if verificar_hash_qr(entrada["id_entrada"], hash_ingresado):
            coincidencias.append(entrada)

    if len(coincidencias) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código QR inválido, expirado o no pertenece a un sector asignado",
        )

    if len(coincidencias) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Código ambiguo. Hay más de una entrada posible. Reintente en unos segundos.",
        )

    entrada = coincidencias[0]
    id_entrada = entrada["id_entrada"]

    async with transaction() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO ticketing_mundial.token_qr 
                (codigo_hash, generado_en, id_entrada) 
                VALUES (%s, NOW(), %s)
                """,
                (hash_ingresado, id_entrada),
            )

            await cursor.execute("SELECT LAST_INSERT_ID()")
            row = await cursor.fetchone()
            id_token = row[0]

            await cursor.execute(
                """
                INSERT INTO ticketing_mundial.validacion 
                (mail_funcionario, identificador_disp, id_entrada, id_token)
                VALUES (%s, %s, %s, %s)
                """,
                (mail_funcionario, identificador_disp, id_entrada, id_token),
            )

    return {
        "mensaje": "Entrada validada correctamente",
        "id_entrada": id_entrada,
    }
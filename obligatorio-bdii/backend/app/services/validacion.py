from fastapi import HTTPException, status
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
    try:
        id_entrada = verificar_hash_qr(hash_ingresado)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    entrada = await fetch_one(
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
        JOIN ticketing_mundial.dispositivo d
            ON d.mail_funcionario = a.mail_funcionario
        WHERE e.id_entrada = %s
          AND a.mail_funcionario = %s
          AND d.identificador = %s
        """,
        (id_entrada, mail_funcionario, identificador_disp),
    )

    if not entrada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entrada inválida o no pertenece a un sector asignado al funcionario",
        )

    if entrada["estado"] != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada ya fue consumida o no está activa",
        )

    try:
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

                await cursor.execute(
                    """
                    UPDATE ticketing_mundial.entrada
                    SET estado = 'consumida'
                    WHERE id_entrada = %s
                      AND estado = 'activa'
                    """,
                    (id_entrada,),
                )

    except OperationalError as e:
        if e.args and e.args[0] == 1644:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.args[1],
            )

        raise

    return {
        "mensaje": "Entrada validada correctamente",
        "id_entrada": id_entrada,
    }
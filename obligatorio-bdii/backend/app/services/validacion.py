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
    id_entrada: int,
    hash_ingresado: str,
    identificador_disp: str,
    mail_funcionario: str,
):
    entrada = await fetch_one(
        "SELECT id_entrada, estado, id_evento, codigo_sector FROM ticketing_mundial.entrada WHERE id_entrada = %s",
        (id_entrada,),
    )

    if entrada is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrada no encontrada")

    if entrada["estado"] == "consumida":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La entrada ya fue utilizada")

    # validamos el hash 
    if not verificar_hash_qr(id_entrada, hash_ingresado):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Codigo QR inválido o expirado")

    # validamos la asignacion del funcionario
    asignacion = await fetch_one(
        """
        SELECT 1 FROM ticketing_mundial.asignacion
        WHERE id_evento = %s AND codigo_sector = %s AND mail_funcionario = %s
        """,
        (entrada["id_evento"], entrada["codigo_sector"], mail_funcionario),
    )

    if asignacion is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene asignado ese sector")

    # a partir de ahora guardamos el hash como registro histórico en token_qr
    async with transaction() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "INSERT INTO ticketing_mundial.token_qr (codigo_hash, generado_en, id_entrada) VALUES (%s, NOW(), %s)",
                (hash_ingresado, id_entrada),
            )
            await cursor.execute("SELECT LAST_INSERT_ID()")
            row = await cursor.fetchone()
            id_token = row[0]

            await cursor.execute(
                """
                INSERT INTO ticketing_mundial.validacion (mail_funcionario, identificador_disp, id_entrada, id_token)
                VALUES (%s, %s, %s, %s)
                """,
                (mail_funcionario, identificador_disp, id_entrada, id_token),
            )

    return {"mensaje": "Entrada validada correctamente"}
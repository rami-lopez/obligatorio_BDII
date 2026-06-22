from fastapi import HTTPException, status
from app.db.database import fetch_all, fetch_one, execute
from app.schemas.event import EventCreate

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
    id_token: int,
    identificador_disp: str,
    mail_funcionario: str,
):
    entrada = await fetch_one(
        """
        SELECT
            e.id_entrada,
            e.estado,
            e.id_evento,
            e.codigo_sector
        FROM entrada e
        WHERE e.id_entrada = %s
        """,
        (id_entrada,),
    )

    if entrada is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada"
        )

    if entrada["estado"] == "consumida":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La entrada ya fue utilizada"
        )

    token = await fetch_one(
        """
        SELECT
            id_token,
            activo,
            expira_en
        FROM token_qr
        WHERE id_token = %s
          AND id_entrada = %s
        """,
        (id_token, id_entrada),
    )

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado"
        )

    if not token["activo"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inactivo"
        )

    asignacion = await fetch_one(
        """
        SELECT 1
        FROM asignacion
        WHERE id_evento = %s
          AND codigo_sector = %s
          AND mail_funcionario = %s
        """,
        (
            entrada["id_evento"],
            entrada["codigo_sector"],
            mail_funcionario,
        ),
    )

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene asignado ese sector"
        )

    await execute(
        """
        INSERT INTO validacion(
            mail_funcionario,
            identificador_disp,
            id_entrada,
            id_token
        )
        VALUES (%s, %s, %s, %s)
        """,
        (
            mail_funcionario,
            identificador_disp,
            id_entrada,
            id_token,
        ),
    )

    await execute(
        """
        UPDATE entrada
        SET estado = 'consumida'
        WHERE id_entrada = %s
        """,
        (id_entrada,),
    )

    return {
        "mensaje": "Entrada validada correctamente"
    }
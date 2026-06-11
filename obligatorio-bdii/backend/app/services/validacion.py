from app.db.database import fetch_all
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
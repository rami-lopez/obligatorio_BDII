from app.db.database import fetch_all


async def get_evento_funcionario(mail: str):
    query = """
    SELECT
        id_evento,
        fecha_hora,
        equipo_local,
        equipo_visitante,
        id_estadio,
        estadio_nombre,
        estadio_ciudad,
        sector_codigo,
        capacidad_max,
        costo
    FROM vw_funcionario_evento
    WHERE mail_funcionario = %s
    """

    return await fetch_all(query, (mail,))
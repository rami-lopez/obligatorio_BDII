from app.db.database import fetch_all


async def get_evento_mas_vendido(id_sede_admin: int | None = None) -> list | None:
    query = """
        SELECT 
            ev.id_evento,
            ev.equipo_local,
            ev.equipo_visitante,
            COUNT(e.id_entrada) AS entradas_vendidas
        FROM evento ev
        JOIN estadio es ON es.id_estadio = ev.id_estadio
        LEFT JOIN entrada e 
            ON ev.id_evento = e.id_evento
           AND e.estado != 'anulada'
        WHERE 1=1
    """

    params = []

    if id_sede_admin is not None:
        query += " AND es.id_sede = %s"
        params.append(id_sede_admin)

    query += """
        GROUP BY ev.id_evento, ev.equipo_local, ev.equipo_visitante
        ORDER BY entradas_vendidas DESC
    """

    return await fetch_all(query, tuple(params))


async def get_mayor_comprador(id_sede_admin: int | None = None) -> list | None:
    query = """
        SELECT 
            v.mail_usuario,
            COUNT(e.id_entrada) AS entradas_compradas,
            SUM(s.costo * (1 + v.tasa_comision)) AS dinero_gastado
        FROM venta v
        JOIN entrada e ON v.id_venta = e.id_venta
        JOIN evento ev ON ev.id_evento = e.id_evento
        JOIN estadio es ON es.id_estadio = ev.id_estadio
        JOIN sector s 
            ON s.id_estadio = e.id_estadio
           AND s.codigo = e.codigo_sector
        WHERE e.estado != 'anulada'
    """

    params = []

    if id_sede_admin is not None:
        query += " AND es.id_sede = %s"
        params.append(id_sede_admin)

    query += """
        GROUP BY v.mail_usuario
        ORDER BY entradas_compradas DESC, dinero_gastado DESC
    """

    return await fetch_all(query, tuple(params))


async def get_todas_validaciones(id_sede_admin: int | None = None) -> list | None:
    query = """
        SELECT 
            v.id_validacion,
            v.fecha_hora,
            v.mail_funcionario,
            v.identificador_disp,
            v.id_entrada,
            ev.id_evento,
            ev.equipo_local,
            ev.equipo_visitante,
            e.codigo_sector,
            ev.fecha_hora AS evento_fecha,
            e.mail_propietario
        FROM ticketing_mundial.validacion v
        JOIN ticketing_mundial.entrada e 
            ON v.id_entrada = e.id_entrada
        JOIN ticketing_mundial.evento ev 
            ON e.id_evento = ev.id_evento
        JOIN ticketing_mundial.estadio es
            ON es.id_estadio = ev.id_estadio
        WHERE 1=1
    """

    params = []

    if id_sede_admin is not None:
        query += " AND es.id_sede = %s"
        params.append(id_sede_admin)

    query += " ORDER BY v.fecha_hora DESC"

    return await fetch_all(query, tuple(params))
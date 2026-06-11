from app.db.database import fetch_all

async def get_evento_mas_vendido() -> list | None:
    return await fetch_all(
        """
        SELECT ev.id_evento, ev.equipo_local, ev.equipo_visitante, COUNT(e.id_entrada) AS entradas_vendidas
        FROM evento ev
        LEFT JOIN entrada e
        ON ev.id_evento = e.id_evento
        GROUP BY ev.id_evento
        ORDER BY entradas_vendidas DESC;
        """,
        (),
    )
    
async def get_mayor_comprador() -> list | None:
    return await fetch_all(
        """
        SELECT v.mail_usuario, COUNT(e.id_entrada) AS entradas_compradas, SUM(v.monto_total) AS dinero_gastado
        FROM venta v
        JOIN entrada e
        ON v.id_venta = e.id_venta
        GROUP BY v.mail_usuario
        ORDER BY entradas_compradas DESC, dinero_gastado DESC;
        """,
        (),
    )
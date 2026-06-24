from app.db.database import fetch_all


async def listar_notificaciones(mail_usuario: str) -> list[dict]:
    rows = await fetch_all(
        """
        SELECT
            t.id_transferencia,
            t.mail_origen,
            t.mail_destino,
            t.fecha_solicitud,
            t.fecha_aceptacion,
            t.estado,
            t.id_entrada,
            ev.equipo_local,
            ev.equipo_visitante
        FROM transferencia t
        JOIN entrada e ON e.id_entrada = t.id_entrada
        JOIN evento ev ON ev.id_evento = e.id_evento
        WHERE (
            t.mail_destino = %s AND t.estado = 'pendiente'
        ) OR (
            t.mail_origen = %s AND t.estado IN ('aceptada', 'rechazada')
            AND COALESCE(t.fecha_aceptacion, t.fecha_solicitud) >= NOW() - INTERVAL 7 DAY
        )
        ORDER BY COALESCE(t.fecha_aceptacion, t.fecha_solicitud) DESC
        LIMIT 30
        """,
        (mail_usuario, mail_usuario),
    )

    result = []
    for r in rows:
        titulo = f"{r['equipo_local']} vs. {r['equipo_visitante']}"
        if r["estado"] == "pendiente":
            tipo = "transferencia_recibida"
            mensaje = f"{r['mail_origen']} te transfirió una entrada para {titulo}"
        elif r["estado"] == "aceptada":
            tipo = "transferencia_aceptada"
            mensaje = f"{r['mail_destino']} aceptó tu entrada para {titulo}"
        else:
            tipo = "transferencia_rechazada"
            mensaje = f"{r['mail_destino']} rechazó tu entrada para {titulo}"

        result.append({
            "id_notificacion": r["id_transferencia"],
            "tipo": tipo,
            "mensaje": mensaje,
            "leida": False,
            "fecha_creacion": r.get("fecha_aceptacion") or r["fecha_solicitud"],
            "id_referencia": r["id_entrada"],
        })

    return result

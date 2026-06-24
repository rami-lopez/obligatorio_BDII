from fastapi import HTTPException, status

from app.db.database import fetch_one, fetch_all, execute, call_procedure

async def comprar_entradas(
    mail_usuario: str,
    id_evento: int,
    id_estadio: int,
    codigo_sector: str,
    cantidad: int,
):
    args = (mail_usuario, id_evento, id_estadio, codigo_sector, cantidad)
    result = await call_procedure("SP_ComprarEntradas", args)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la compra"
        )

    id_venta = result["id_venta"]
    monto_total = float(result["monto_total"])

    return {
        "id_venta": id_venta,
        "cantidad": cantidad,
        "monto_total": monto_total,
    }

async def obtener_detalle_venta(id_venta: int, mail_usuario: str) -> dict:
    venta = await fetch_one(
        """
        SELECT id_venta, fecha, estado, monto_total, tasa_comision, mail_usuario
        FROM venta
        WHERE id_venta = %s
        """,
        (id_venta,)
    )

    if venta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    if venta["mail_usuario"] != mail_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a esta venta")

    entradas = await fetch_all(
        """
        SELECT id_entrada, estado, codigo_sector
        FROM entrada
        WHERE id_venta = %s
        """,
        (id_venta,)
    )

    return {
        "id_venta": venta["id_venta"],
        "fecha": venta["fecha"],
        "estado": venta["estado"],
        "monto_total": float(venta["monto_total"]),
        "tasa_comision": float(venta["tasa_comision"]),
        "mail_usuario": venta["mail_usuario"],
        "cantidad": len(entradas),
        "entradas": [{"id_entrada": e["id_entrada"], "estado": e["estado"], "codigo_sector": e["codigo_sector"]} for e in entradas],
    }

async def confirmar_pago(id_venta: int, mail_usuario: str) -> dict:
    venta = await fetch_one(
        "SELECT estado, mail_usuario FROM venta WHERE id_venta = %s",
        (id_venta,)
    )

    if venta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    if venta["mail_usuario"] != mail_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a esta venta")

    if venta["estado"] != "pendiente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La venta ya fue procesada")

    await execute(
        "UPDATE venta SET estado = 'confirmada' WHERE id_venta = %s",
        (id_venta,)
    )

    filas = await execute(
        "UPDATE entrada SET estado = 'activa' WHERE id_venta = %s AND estado = 'pendiente'",
        (id_venta,)
    )

    return {
        "id_venta": id_venta,
        "estado_venta": "confirmada",
        "estado_entradas": "activa",
        "cantidad_actualizada": filas,
    }

async def anular_pago(id_venta: int, mail_usuario: str) -> dict:
    venta = await fetch_one(
        "SELECT estado, mail_usuario FROM venta WHERE id_venta = %s",
        (id_venta,)
    )

    if venta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    if venta["mail_usuario"] != mail_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a esta venta")

    if venta["estado"] != "pendiente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La venta ya fue procesada")

    await execute(
        "UPDATE venta SET estado = 'anulada' WHERE id_venta = %s",
        (id_venta,)
    )

    filas = await execute(
        "UPDATE entrada SET estado = 'anulada' WHERE id_venta = %s AND estado = 'pendiente'",
        (id_venta,)
    )

    return {
        "id_venta": id_venta,
        "estado_venta": "anulada",
        "estado_entradas": "anulada",
        "cantidad_actualizada": filas,
    }
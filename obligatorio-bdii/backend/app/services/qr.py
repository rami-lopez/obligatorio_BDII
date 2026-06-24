import base64
import time

QR_VALID_WINDOW = 30


def obtener_bloque_actual() -> int:
    ahora = int(time.time())
    return (ahora // QR_VALID_WINDOW) * QR_VALID_WINDOW


def obtener_ttl_restante() -> int:
    ahora = int(time.time())
    bloque = obtener_bloque_actual()
    expiracion = bloque + QR_VALID_WINDOW
    return max(expiracion - ahora, 0)


def generar_hash_qr(id_entrada: int) -> str:
    bloque = obtener_bloque_actual()
    payload = f"{id_entrada}:{bloque}"
    token = base64.urlsafe_b64encode(payload.encode()).decode()
    return token


def verificar_hash_qr(token: str) -> int:
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
    except Exception:
        raise ValueError("Token QR inválido")

    parts = decoded.rsplit(":", 1)

    if len(parts) != 2:
        raise ValueError("Token QR mal formado")

    id_entrada_str, bloque_str = parts

    try:
        id_entrada = int(id_entrada_str)
        bloque = int(bloque_str)
    except ValueError:
        raise ValueError("Token QR mal formado")

    ahora = int(time.time())

    if ahora - bloque >= QR_VALID_WINDOW:
        raise ValueError("Token QR expirado")

    if bloque > ahora:
        raise ValueError("Token QR inválido")

    return id_entrada
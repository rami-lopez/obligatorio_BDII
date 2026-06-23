import pyotp
import os

SECRET_KEY = os.getenv("QR_SECRET_KEY", "clave_secreta_cambiar_en_produccion")

def generar_hash_qr(id_entrada: int) -> str:
    # combinamos la clave secreta + id
    clave_entrada = f"{SECRET_KEY}_{id_entrada}"
    
    # a base32 pq asi es pyotp
    import base64
    clave_b32 = base64.b32encode(clave_entrada.encode()).decode()
    
    totp = pyotp.TOTP(clave_b32, interval=30)
    return totp.now()

def verificar_hash_qr(id_entrada: int, hash_ingresado: str) -> bool:
    clave_entrada = f"{SECRET_KEY}_{id_entrada}"
    
    import base64
    clave_b32 = base64.b32encode(clave_entrada.encode()).decode()
    
    totp = pyotp.TOTP(clave_b32, interval=30)
    # valid window = 1 acepta el intervalo actual y el anterior (la tolerancia de 30s)
    return totp.verify(hash_ingresado, valid_window=1)
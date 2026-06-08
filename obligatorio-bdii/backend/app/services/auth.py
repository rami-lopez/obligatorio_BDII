from __future__ import annotations

from fastapi import HTTPException, status

from app.auth.hashing import verify_password
from app.auth.jwt import create_access_token
from app.db.database import fetch_one
from app.services.users import get_user_profile


async def login(mail: str, password: str) -> dict:
    user_row = await fetch_one(
        """
        SELECT
            u.mail,
            u.password_hash,
            CASE
                WHEN a.mail_usuario IS NOT NULL THEN 'administrador'
                WHEN f.mail_usuario IS NOT NULL THEN 'funcionario'
                ELSE 'usuario_general'
            END AS role
        FROM usuario u
        LEFT JOIN administrador a ON a.mail_usuario = u.mail
        LEFT JOIN funcionario f ON f.mail_usuario = u.mail
        LEFT JOIN usuario_general ug ON ug.mail_usuario = u.mail
        WHERE u.mail = %s
        """,
        (mail,),
    )
    if user_row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    if not verify_password(password, user_row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    user = await get_user_profile(mail)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    token = create_access_token(subject=mail, extra_claims={"mail": mail, "role": user_row["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }
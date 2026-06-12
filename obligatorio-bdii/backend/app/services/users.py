from __future__ import annotations

from fastapi import HTTPException, status

from app.db.database import execute, fetch_all, fetch_one, transaction


def _profile_query() -> str:
    return """
        SELECT
            u.mail,
            u.auth0_sub,
            u.pais_doc,
            u.tipo_doc,
            u.nro_doc,
            u.pais_dir,
            u.localidad,
            u.calle,
            u.nro_dir,
            u.cod_postal,
            a.id_sede AS id_sede,
            a.fecha_asignacion,
            f.nro_legajo,
            ug.fecha_registro,
            ug.verificado,
            CASE
                WHEN a.mail_usuario IS NOT NULL THEN 'administrador'
                WHEN f.mail_usuario IS NOT NULL THEN 'funcionario'
                ELSE 'usuario_general'
            END AS role
        FROM usuario u
        LEFT JOIN administrador a ON a.mail_usuario = u.mail
        LEFT JOIN funcionario f ON f.mail_usuario = u.mail
        LEFT JOIN usuario_general ug ON ug.mail_usuario = u.mail
    """


async def get_user_profile(mail: str) -> dict | None:
    user_row = await fetch_one(
        _profile_query() + " WHERE u.mail = %s",
        (mail,),
    )
    if user_row is None:
        return None

    phones = await fetch_all(
        "SELECT numero FROM telefono WHERE mail_usuario = %s ORDER BY numero",
        (mail,),
    )
    user_row["telefonos"] = [row["numero"] for row in phones]
    user_row["verificado"] = bool(user_row.get("verificado"))
    return user_row


async def get_user_profile_by_auth0_sub(auth0_sub: str) -> dict | None:
    user_row = await fetch_one(
        _profile_query() + " WHERE u.auth0_sub = %s",
        (auth0_sub,),
    )
    if user_row is None:
        return None

    phones = await fetch_all(
        "SELECT numero FROM telefono WHERE mail_usuario = %s ORDER BY numero",
        (user_row["mail"],),
    )
    user_row["telefonos"] = [row["numero"] for row in phones]
    user_row["verificado"] = bool(user_row.get("verificado"))
    return user_row


async def complete_registration(payload: dict, auth0_sub: str, mail: str, auth0_role: str | None) -> dict:
    requested_role = payload.get("tipo_usuario", "usuario_general")
    if requested_role != "usuario_general" and requested_role != auth0_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for requested user type")

    existing_sub = await fetch_one("SELECT mail FROM usuario WHERE auth0_sub = %s", (auth0_sub,))
    if existing_sub is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya completó el registro")

    existing_user = await fetch_one("SELECT mail FROM usuario WHERE mail = %s", (mail,))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El mail ya existe")

    duplicate_document = await fetch_one(
        "SELECT mail FROM usuario WHERE pais_doc = %s AND tipo_doc = %s AND nro_doc = %s",
        (payload["pais_doc"], payload["tipo_doc"], payload["nro_doc"]),
    )
    if duplicate_document is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Documento ya registrado")

    async with transaction() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO usuario (
                    mail, auth0_sub, pais_doc, tipo_doc, nro_doc, pais_dir, localidad, calle, nro_dir, cod_postal
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    mail,
                    auth0_sub,
                    payload["pais_doc"],
                    payload["tipo_doc"],
                    payload["nro_doc"],
                    payload["pais_dir"],
                    payload["localidad"],
                    payload["calle"],
                    payload["nro_dir"],
                    payload["cod_postal"],
                ),
            )

            for telefono in payload.get("telefonos", []):
                await cursor.execute(
                    "INSERT INTO telefono (mail_usuario, numero) VALUES (%s, %s)",
                    (mail, telefono),
                )

            if requested_role == "administrador":
                if payload.get("id_sede") is None:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="id_sede es requerido para administrador")
                await cursor.execute(
                    """
                    INSERT INTO administrador (mail_usuario, fecha_asignacion, id_sede)
                    VALUES (%s, CURDATE(), %s)
                    """,
                    (mail, payload["id_sede"]),
                )
            elif requested_role == "funcionario":
                if not payload.get("nro_legajo"):
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="nro_legajo es requerido para funcionario")
                await cursor.execute(
                    """
                    INSERT INTO funcionario (mail_usuario, nro_legajo)
                    VALUES (%s, %s)
                    """,
                    (mail, payload["nro_legajo"]),
                )
            else:
                await cursor.execute(
                    """
                    INSERT INTO usuario_general (mail_usuario, fecha_registro, verificado)
                    VALUES (%s, CURDATE(), %s)
                    """,
                    (mail, payload.get("verificado", False)),
                )

    created = await get_user_profile_by_auth0_sub(auth0_sub)
    return created or {}


async def update_user(mail: str, payload: dict) -> dict:
    existing_user = await get_user_profile(mail)
    if existing_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    update_fields = []
    update_values: list[object] = []
    for field_name in ("pais_doc", "tipo_doc", "nro_doc", "pais_dir", "localidad", "calle", "nro_dir", "cod_postal"):
        value = payload.get(field_name)
        if value is not None:
            update_fields.append(f"{field_name} = %s")
            update_values.append(value)

    async with transaction() as connection:
        async with connection.cursor() as cursor:
            if update_fields:
                await cursor.execute(
                    f"UPDATE usuario SET {', '.join(update_fields)} WHERE mail = %s",
                    (*update_values, mail),
                )

            if payload.get("telefonos") is not None:
                await cursor.execute("DELETE FROM telefono WHERE mail_usuario = %s", (mail,))
                for telefono in payload.get("telefonos", []):
                    await cursor.execute(
                        "INSERT INTO telefono (mail_usuario, numero) VALUES (%s, %s)",
                        (mail, telefono),
                    )

            if payload.get("verificado") is not None:
                await cursor.execute(
                    "UPDATE usuario_general SET verificado = %s WHERE mail_usuario = %s",
                    (payload["verificado"], mail),
                )

    updated = await get_user_profile(mail)
    return updated or {}


async def delete_user(mail: str) -> None:
    deleted = await execute("DELETE FROM usuario WHERE mail = %s", (mail,))
    if deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")


async def list_users() -> list[dict]:
    return await fetch_all(
        """
        SELECT
            u.mail,
            u.pais_doc,
            u.tipo_doc,
            u.nro_doc,
            CASE
                WHEN a.mail_usuario IS NOT NULL THEN 'administrador'
                WHEN f.mail_usuario IS NOT NULL THEN 'funcionario'
                ELSE 'usuario_general'
            END AS role
        FROM usuario u
        LEFT JOIN administrador a ON a.mail_usuario = u.mail
        LEFT JOIN funcionario f ON f.mail_usuario = u.mail
        ORDER BY u.mail
        """
    )
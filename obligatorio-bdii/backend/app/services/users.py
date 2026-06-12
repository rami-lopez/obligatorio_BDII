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


async def _check_registration_conflicts(auth0_sub: str, mail: str, pais_doc: str, tipo_doc: str, nro_doc: str) -> None:
    existing_sub = await fetch_one("SELECT mail FROM usuario WHERE auth0_sub = %s", (auth0_sub,))
    if existing_sub is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya completó el registro")

    existing_user = await fetch_one("SELECT mail FROM usuario WHERE mail = %s", (mail,))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El mail ya existe")

    duplicate_document = await fetch_one(
        "SELECT mail FROM usuario WHERE pais_doc = %s AND tipo_doc = %s AND nro_doc = %s",
        (pais_doc, tipo_doc, nro_doc),
    )
    if duplicate_document is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Documento ya registrado")


async def _insert_usuario_base(cursor, mail: str, auth0_sub: str, payload: dict) -> None:
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


async def complete_registration(payload: dict, auth0_sub: str, mail: str) -> dict:
    """
    Registro publico. Crea siempre un usuario_general.
    La creacion de administradores se hace por seed directo en la base.
    El ascenso a funcionario se hace via POST /usuarios/{mail}/ascender-funcionario.
    """
    await _check_registration_conflicts(
        auth0_sub, mail, payload["pais_doc"], payload["tipo_doc"], payload["nro_doc"]
    )

    async with transaction() as connection:
        async with connection.cursor() as cursor:
            await _insert_usuario_base(cursor, mail, auth0_sub, payload)

            await cursor.execute(
                """
                INSERT INTO usuario_general (mail_usuario, fecha_registro, verificado)
                VALUES (%s, CURDATE(), %s)
                """,
                (mail, payload.get("verificado", False)),
            )

    created = await get_user_profile_by_auth0_sub(auth0_sub)
    return created or {}


async def promote_to_funcionario(mail: str, nro_legajo: str) -> dict:
    """
    Asciende a un usuario_general existente a funcionario.
    Solo accesible para administradores (verificar con require_admin en el router).

    El usuario debe haberse registrado previamente (existe en `usuario` y
    `usuario_general` con su auth0_sub ya asignado). Se elimina su fila de
    usuario_general y se crea la correspondiente en funcionario.
    """
    existing = await fetch_one(
        """
        SELECT u.mail, ug.mail_usuario AS es_usuario_general,
               a.mail_usuario AS es_admin, f.mail_usuario AS es_funcionario
        FROM usuario u
        LEFT JOIN usuario_general ug ON ug.mail_usuario = u.mail
        LEFT JOIN administrador a ON a.mail_usuario = u.mail
        LEFT JOIN funcionario f ON f.mail_usuario = u.mail
        WHERE u.mail = %s
        """,
        (mail,),
    )

    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if existing["es_funcionario"] is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya es funcionario")

    if existing["es_admin"] is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya es administrador")

    if existing["es_usuario_general"] is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario debe completar su registro antes de poder ser ascendido",
        )

    duplicate_legajo = await fetch_one(
        "SELECT mail_usuario FROM funcionario WHERE nro_legajo = %s", (nro_legajo,)
    )
    if duplicate_legajo is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Numero de legajo ya asignado")

    async with transaction() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute("DELETE FROM usuario_general WHERE mail_usuario = %s", (mail,))
            await cursor.execute(
                "INSERT INTO funcionario (mail_usuario, nro_legajo) VALUES (%s, %s)",
                (mail, nro_legajo),
            )

    updated = await get_user_profile(mail)
    return updated or {}


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
                telefonos = payload.get("telefonos", [])
                if len(telefonos) != len(set(telefonos)):
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Telefonos duplicados")

                await cursor.execute("DELETE FROM telefono WHERE mail_usuario = %s", (mail,))
                for telefono in telefonos:
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
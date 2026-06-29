from fastapi import HTTPException, status

from app.db.database import execute, fetch_all, fetch_one


async def listar_funcionarios():
    return await fetch_all(
        """
        SELECT
            u.mail,
            u.pais_doc,
            u.tipo_doc,
            u.nro_doc,
            f.nro_legajo,
            ug.fecha_registro
        FROM funcionario f
        JOIN usuario u ON u.mail = f.mail_usuario
        LEFT JOIN usuario_general ug ON ug.mail_usuario = u.mail
        ORDER BY u.mail
        """
    )


async def buscar_usuarios(q: str):
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
        WHERE u.mail LIKE %s
        ORDER BY u.mail
        LIMIT 20
        """,
        (f"%{q}%",),
    )


async def get_asignaciones(mail_funcionario: str):
    return await fetch_all(
        """
        SELECT
            a.id_evento,
            a.id_estadio,
            a.codigo_sector,
            ev.equipo_local AS evento_local,
            ev.equipo_visitante AS evento_visitante,
            ev.fecha_hora,
            es.nombre AS estadio_nombre
        FROM asignacion a
        JOIN evento ev ON ev.id_evento = a.id_evento
        JOIN estadio es ON es.id_estadio = a.id_estadio
        WHERE a.mail_funcionario = %s
        ORDER BY ev.fecha_hora DESC, a.codigo_sector
        """,
        (mail_funcionario,),
    )


async def asignar_sector(mail_funcionario: str, id_evento: int, id_estadio: int, codigo_sector: str):
    existe = await fetch_one(
        "SELECT 1 FROM evento_sector WHERE id_evento = %s AND id_estadio = %s AND codigo_sector = %s",
        (id_evento, id_estadio, codigo_sector),
    )
    if existe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El sector no esta habilitado para ese evento",
        )

    ya_asignado = await fetch_one(
        "SELECT 1 FROM asignacion WHERE id_evento = %s AND id_estadio = %s AND codigo_sector = %s AND mail_funcionario = %s",
        (id_evento, id_estadio, codigo_sector, mail_funcionario),
    )
    if ya_asignado is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El funcionario ya tiene asignado ese sector en ese evento",
        )

    await execute(
        """
        INSERT INTO asignacion (id_evento, id_estadio, codigo_sector, mail_funcionario)
        VALUES (%s, %s, %s, %s)
        """,
        (id_evento, id_estadio, codigo_sector, mail_funcionario),
    )

    return await get_asignaciones(mail_funcionario)


async def listar_dispositivos_funcionario(mail_funcionario: str):
    return await fetch_all(
        """
        SELECT d.mail_funcionario, d.identificador
        FROM dispositivo d
        WHERE d.mail_funcionario = %s
        ORDER BY d.identificador
        """,
        (mail_funcionario,),
    )


async def listar_todos_dispositivos():
    return await fetch_all(
        """
        SELECT d.mail_funcionario, d.identificador
        FROM dispositivo d
        JOIN funcionario f ON f.mail_usuario = d.mail_funcionario
        JOIN usuario u ON u.mail = f.mail_usuario
        ORDER BY d.mail_funcionario, d.identificador
        """
    )


async def crear_dispositivo(mail_funcionario: str, identificador: str):
    ya_existe = await fetch_one(
        "SELECT 1 FROM dispositivo WHERE mail_funcionario = %s AND identificador = %s",
        (mail_funcionario, identificador),
    )
    if ya_existe is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El funcionario ya tiene un dispositivo con ese identificador",
        )

    await execute(
        "INSERT INTO dispositivo (mail_funcionario, identificador) VALUES (%s, %s)",
        (mail_funcionario, identificador),
    )

    return await listar_dispositivos_funcionario(mail_funcionario)


async def asignar_dispositivo_existente(mail_destino: str, identificador: str, mail_origen: str):
    dispositivo = await fetch_one(
        "SELECT 1 FROM dispositivo WHERE mail_funcionario = %s AND identificador = %s",
        (mail_origen, identificador),
    )
    if dispositivo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo no encontrado en el funcionario de origen",
        )

    ya_asignado = await fetch_one(
        "SELECT 1 FROM dispositivo WHERE mail_funcionario = %s AND identificador = %s",
        (mail_destino, identificador),
    )
    if ya_asignado is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El funcionario destino ya tiene un dispositivo con ese identificador",
        )

    await execute(
        "DELETE FROM dispositivo WHERE mail_funcionario = %s AND identificador = %s",
        (mail_origen, identificador),
    )

    await execute(
        "INSERT INTO dispositivo (mail_funcionario, identificador) VALUES (%s, %s)",
        (mail_destino, identificador),
    )

    return await listar_dispositivos_funcionario(mail_destino)


async def eliminar_dispositivo(mail_funcionario: str, identificador: str):
    eliminado = await execute(
        "DELETE FROM dispositivo WHERE mail_funcionario = %s AND identificador = %s",
        (mail_funcionario, identificador),
    )
    if eliminado == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo no encontrado",
        )

    return await listar_dispositivos_funcionario(mail_funcionario)


async def desasignar_sector(mail_funcionario: str, id_evento: int, id_estadio: int, codigo_sector: str):
    eliminado = await execute(
        "DELETE FROM asignacion WHERE id_evento = %s AND id_estadio = %s AND codigo_sector = %s AND mail_funcionario = %s",
        (id_evento, id_estadio, codigo_sector, mail_funcionario),
    )
    if eliminado == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignacion no encontrada",
        )

    return await get_asignaciones(mail_funcionario)

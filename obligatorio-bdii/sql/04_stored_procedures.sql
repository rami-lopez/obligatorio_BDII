SET FOREIGN_KEY_CHECKS= 0;

-- Registar usuario

DELIMITER $$

CREATE PROCEDURE SP_RegistrarUsuario(
    IN p_mail VARCHAR(255),
    IN p_auth0_sub VARCHAR(255),
    IN p_pais_doc VARCHAR(100),
    IN p_tipo_doc VARCHAR(50),
    IN p_nro_doc VARCHAR(50),
    IN p_pais_dir VARCHAR(100),
    IN p_localidad VARCHAR(100),
    IN p_calle VARCHAR(150),
    IN p_nro_dir VARCHAR(20),
    IN p_cod_postal VARCHAR(20),
    IN p_verificado BOOLEAN
)
BEGIN

    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE mail = p_mail
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='El mail ya existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE auth0_sub = p_auth0_sub
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='El usuario Auth0 ya existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE pais_doc = p_pais_doc
          AND tipo_doc = p_tipo_doc
          AND nro_doc = p_nro_doc
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='Documento ya registrado';
    END IF;

    INSERT INTO usuario(
        mail,
        auth0_sub,
        pais_doc,
        tipo_doc,
        nro_doc,
        pais_dir,
        localidad,
        calle,
        nro_dir,
        cod_postal
    )
    VALUES(
        p_mail,
        p_auth0_sub,
        p_pais_doc,
        p_tipo_doc,
        p_nro_doc,
        p_pais_dir,
        p_localidad,
        p_calle,
        p_nro_dir,
        p_cod_postal
    );

    INSERT INTO usuario_general(
        mail_usuario,
        fecha_registro,
        verificado
    )
    VALUES(
        p_mail,
        CURDATE(),
        p_verificado
    );

END$$

DELIMITER ;

-- Alta de evento

DELIMITER $$

CREATE PROCEDURE SP_AltaEvento(
    IN p_fecha_hora DATETIME,
    IN p_equipo_local VARCHAR(100),
    IN p_equipo_visitante VARCHAR(100),
    IN p_id_estadio INT,
    IN p_mail_admin VARCHAR(255)
)
BEGIN

    IF EXISTS(
        SELECT 1
        FROM evento
        WHERE id_estadio = p_id_estadio
          AND fecha_hora = p_fecha_hora
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='Ya existe un evento en ese estadio para esa fecha';
    END IF;

    INSERT INTO evento(
        fecha_hora,
        equipo_local,
        equipo_visitante,
        id_estadio,
        mail_admin
    )
    VALUES(
        p_fecha_hora,
        p_equipo_local,
        p_equipo_visitante,
        p_id_estadio,
        p_mail_admin
    );

END$$

DELIMITER ;

--Solicitar transferencia

DELIMITER $$

CREATE PROCEDURE SP_SolicitarTransferencia(
    IN p_id_entrada INT,
    IN p_mail_destino VARCHAR(255)
)
BEGIN

    DECLARE v_propietario VARCHAR(255);
    DECLARE v_estado VARCHAR(30);
    DECLARE v_transferencias INT;

    SELECT mail_propietario,
           estado
    INTO v_propietario,
         v_estado
    FROM entrada
    WHERE id_entrada = p_id_entrada;

    IF v_propietario IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='Entrada inexistente';
    END IF;

    IF v_estado = 'consumida' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='La entrada ya fue utilizada';
    END IF;

    SELECT COUNT(*)
    INTO v_transferencias
    FROM transferencia
    WHERE id_entrada = p_id_entrada
      AND estado = 'aceptada';

    IF v_transferencias >= 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='La entrada alcanzo el maximo de transferencias';
    END IF;

    INSERT INTO transferencia(
        fecha_solicitud,
        estado,
        nro_orden,
        id_entrada,
        mail_origen,
        mail_destino
    )
    VALUES(
        NOW(),
        'pendiente',
        v_transferencias + 1,
        p_id_entrada,
        v_propietario,
        p_mail_destino
    );

END$$

DELIMITER ;

--Aceptar transferencia

DELIMITER $$

CREATE PROCEDURE SP_AceptarTransferencia(
    IN p_id_transferencia INT
)
BEGIN

    DECLARE v_entrada INT;
    DECLARE v_destino VARCHAR(255);

    START TRANSACTION;

    SELECT id_entrada,
           mail_destino
    INTO v_entrada,
         v_destino
    FROM transferencia
    WHERE id_transferencia = p_id_transferencia
      AND estado = 'pendiente';

    IF v_entrada IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT='Transferencia inexistente o ya procesada';
    END IF;

    UPDATE transferencia
    SET estado='aceptada',
        fecha_aceptacion=NOW()
    WHERE id_transferencia=p_id_transferencia;

    UPDATE entrada
    SET mail_propietario=v_destino
    WHERE id_entrada=v_entrada;

    COMMIT;

END$$

DELIMITER ;

-- Comprar entradas

DELIMITER $$

CREATE PROCEDURE SP_ComprarEntradas(
    IN p_mail_usuario    VARCHAR(255),
    IN p_id_evento       INT,
    IN p_id_estadio      INT,
    IN p_codigo_sector   VARCHAR(10),
    IN p_cantidad        INT
)
BEGIN
    DECLARE v_costo     DECIMAL(10,2);
    DECLARE v_monto     DECIMAL(10,2);
    DECLARE v_tasa      DECIMAL(5,4) DEFAULT 0.0500;
    DECLARE v_i         INT DEFAULT 0;
    DECLARE v_existe    INT;
    DECLARE v_id_venta  INT;

    IF p_cantidad < 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cantidad invalida';
    END IF;

    IF p_cantidad > 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden comprar mas de 5 entradas';
    END IF;

    SELECT COUNT(*) INTO v_existe
    FROM evento_sector
    WHERE id_evento = p_id_evento
      AND id_estadio = p_id_estadio
      AND codigo_sector = p_codigo_sector;

    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sector no habilitado para el evento';
    END IF;

    SELECT costo INTO v_costo
    FROM sector
    WHERE id_estadio = p_id_estadio AND codigo = p_codigo_sector;

    IF v_costo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sector inexistente';
    END IF;

    SET v_monto = v_costo * p_cantidad * (1 + v_tasa);

    START TRANSACTION;

    INSERT INTO venta(estado, monto_total, tasa_comision, mail_usuario)
    VALUES ('pendiente', v_monto, v_tasa, p_mail_usuario);

    SET v_id_venta = LAST_INSERT_ID();

    WHILE v_i < p_cantidad DO
        INSERT INTO entrada(estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario)
        VALUES ('pendiente', v_id_venta, p_id_evento, p_id_estadio, p_codigo_sector, p_mail_usuario);
        SET v_i = v_i + 1;
    END WHILE;

    COMMIT;

    SELECT v_id_venta AS id_venta, p_cantidad AS cantidad, v_monto AS monto_total;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
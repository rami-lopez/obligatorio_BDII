USE ticketing_mundial;
DELIMITER $$

-- ============================================================
-- token_qr — BEFORE INSERT
-- Consolida: no QR para entrada consumida + solo un activo por entrada
-- Nota: el UPDATE del token anterior debe hacerlo la app antes de insertar
-- ============================================================
DROP TRIGGER IF EXISTS trg_token_qr_bi$$
CREATE TRIGGER trg_token_qr_bi
BEFORE INSERT ON token_qr
FOR EACH ROW
BEGIN
    DECLARE v_estado VARCHAR(20);
    DECLARE v_activos INT;

    SELECT estado INTO v_estado FROM entrada WHERE id_entrada = NEW.id_entrada;
    IF v_estado = 'consumida' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede generar QR para entrada consumida';
    END IF;

    SELECT COUNT(*) INTO v_activos FROM token_qr
    WHERE id_entrada = NEW.id_entrada AND activo = 1;
    IF v_activos >= 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe un token activo para esta entrada';
    END IF;
END$$

-- ============================================================
-- entrada — BEFORE INSERT
-- Consolida: sector habilitado + consistencia estadio +
--            capacidad maxima + max 5 por venta
-- ============================================================
DROP TRIGGER IF EXISTS trg_entrada_bi$$
DROP TRIGGER IF EXISTS trg_max_entradas_por_venta$$
DROP TRIGGER IF EXISTS trg_capacidad_sector$$
DROP TRIGGER IF EXISTS trg_entrada_bi_sector_habilitado$$
DROP TRIGGER IF EXISTS trg_entrada_bi_consistencia_estadio$$
CREATE TRIGGER trg_entrada_bi
BEFORE INSERT ON entrada
FOR EACH ROW
BEGIN
    DECLARE v_count           INT;
    DECLARE v_capacidad       INT;
    DECLARE v_vendidas        INT;
    DECLARE v_existe_sector   INT DEFAULT 0;
    DECLARE v_estadio_evento  INT;

    -- Max 5 entradas por venta
    SELECT COUNT(*) INTO v_count FROM entrada WHERE id_venta = NEW.id_venta;
    IF v_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una venta no puede tener mas de 5 entradas';
    END IF;

    -- Estadio de la entrada coincide con el del evento
    SELECT id_estadio INTO v_estadio_evento FROM evento WHERE id_evento = NEW.id_evento;
    IF v_estadio_evento != NEW.id_estadio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Estadio de la entrada no coincide con el del evento';
    END IF;

    -- Sector habilitado para el evento
    SELECT COUNT(*) INTO v_existe_sector FROM evento_sector
    WHERE id_evento = NEW.id_evento AND id_estadio = NEW.id_estadio AND codigo_sector = NEW.codigo_sector;
    IF v_existe_sector = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El sector no esta habilitado para este evento';
    END IF;

    -- Capacidad maxima del sector
    SELECT s.capacidad_max INTO v_capacidad FROM sector s
    WHERE s.id_estadio = NEW.id_estadio AND s.codigo = NEW.codigo_sector;
    SELECT COUNT(*) INTO v_vendidas FROM entrada
    WHERE id_evento = NEW.id_evento AND id_estadio = NEW.id_estadio
      AND codigo_sector = NEW.codigo_sector AND estado <> 'anulada';
    IF v_vendidas >= v_capacidad THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Capacidad maxima del sector alcanzada para este evento';
    END IF;
END$$

-- ============================================================
-- entrada — BEFORE UPDATE
-- Estado consumida es irreversible
-- ============================================================
DROP TRIGGER IF EXISTS trg_entrada_bu$$
DROP TRIGGER IF EXISTS trg_entrada_bu_consumida_irreversible$$
CREATE TRIGGER trg_entrada_bu
BEFORE UPDATE ON entrada
FOR EACH ROW
BEGIN
    IF OLD.estado = 'consumida' AND NEW.estado != 'consumida' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una entrada consumida no puede cambiar de estado';
    END IF;
END$$

-- ============================================================
-- transferencia — BEFORE INSERT
-- Consolida: max 3 aceptadas + no consumida + origen es propietario
--            + no pendiente duplicada
-- ============================================================
DROP TRIGGER IF EXISTS trg_transferencia_bi$$
DROP TRIGGER IF EXISTS trg_max_transferencias$$
DROP TRIGGER IF EXISTS trg_transferencia_bi_no_consumida$$
DROP TRIGGER IF EXISTS trg_transferencia_bi_origen_es_propietario$$
DROP TRIGGER IF EXISTS trg_transferencia_bi_no_pendiente_duplicada$$
CREATE TRIGGER trg_transferencia_bi
BEFORE INSERT ON transferencia
FOR EACH ROW
BEGIN
    DECLARE v_count       INT;
    DECLARE v_estado      VARCHAR(20);
    DECLARE v_propietario VARCHAR(255);
    DECLARE v_pendientes  INT;

    -- Max 3 transferencias aceptadas
    SELECT COUNT(*) INTO v_count FROM transferencia
    WHERE id_entrada = NEW.id_entrada AND estado = 'aceptada';
    IF v_count >= 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una entrada no puede tener mas de 3 transferencias';
    END IF;

    -- No transferir entrada consumida
    SELECT estado INTO v_estado FROM entrada WHERE id_entrada = NEW.id_entrada;
    IF v_estado = 'consumida' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede transferir una entrada consumida';
    END IF;

    -- Origen debe ser propietario actual
    SELECT mail_propietario INTO v_propietario FROM entrada WHERE id_entrada = NEW.id_entrada;
    IF v_propietario != NEW.mail_origen THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El origen no es el propietario actual de la entrada';
    END IF;

    -- No duplicar transferencia pendiente
    SELECT COUNT(*) INTO v_pendientes FROM transferencia
    WHERE id_entrada = NEW.id_entrada AND estado = 'pendiente';
    IF v_pendientes > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe una transferencia pendiente para esta entrada';
    END IF;
END$$

-- ============================================================
-- transferencia — AFTER UPDATE
-- Al aceptar: actualizar propietario y estado de la entrada
-- ============================================================
DROP TRIGGER IF EXISTS trg_transferencia_au$$
DROP TRIGGER IF EXISTS trg_transferencia_au_actualizar_propietario$$
CREATE TRIGGER trg_transferencia_au
AFTER UPDATE ON transferencia
FOR EACH ROW
BEGIN
    IF NEW.estado = 'aceptada' AND OLD.estado = 'pendiente' THEN
        UPDATE entrada
        SET mail_propietario = NEW.mail_destino,
            estado           = 'transferida'
        WHERE id_entrada = NEW.id_entrada;
    END IF;
END$$

-- ============================================================
-- validacion — BEFORE INSERT
-- Consolida: funcionario asignado + entrada no consumida + token activo/vigente
-- ============================================================
DROP TRIGGER IF EXISTS trg_validacion_bi$$
DROP TRIGGER IF EXISTS trg_validacion_bi_funcionario_asignado$$
DROP TRIGGER IF EXISTS trg_validacion_bi_no_consumida$$
DROP TRIGGER IF EXISTS trg_validacion_bi_token_activo$$
CREATE TRIGGER trg_validacion_bi
BEFORE INSERT ON validacion
FOR EACH ROW
BEGIN
    DECLARE v_existe    INT DEFAULT 0;
    DECLARE v_sector    VARCHAR(10);
    DECLARE v_id_evento INT;
    DECLARE v_estado    VARCHAR(20);
    DECLARE v_activo    TINYINT;
    DECLARE v_expira_en DATETIME;

    -- Funcionario asignado al sector del evento
    SELECT e.codigo_sector, e.id_evento INTO v_sector, v_id_evento
    FROM entrada e WHERE e.id_entrada = NEW.id_entrada;

    SELECT COUNT(*) INTO v_existe FROM asignacion
    WHERE mail_funcionario = NEW.mail_funcionario
      AND id_evento        = v_id_evento
      AND codigo_sector    = v_sector;
    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Funcionario sin asignacion en ese sector/evento';
    END IF;

    -- Entrada no consumida
    SELECT estado INTO v_estado FROM entrada WHERE id_entrada = NEW.id_entrada;
    IF v_estado = 'consumida' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La entrada ya fue consumida';
    END IF;

    -- Token activo y vigente
    SELECT activo, expira_en INTO v_activo, v_expira_en
    FROM token_qr WHERE id_token = NEW.id_token;
    IF v_activo IS NULL OR v_activo = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El QR no existe o no esta activo';
    END IF;
    IF v_expira_en < NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El codigo QR ha expirado';
    END IF;
END$$

-- ============================================================
-- validacion — AFTER INSERT
-- Marcar entrada como consumida automaticamente
-- ============================================================
DROP TRIGGER IF EXISTS trg_validacion_ai$$
DROP TRIGGER IF EXISTS trg_validacion_ai_consumir_entrada$$
CREATE TRIGGER trg_validacion_ai
AFTER INSERT ON validacion
FOR EACH ROW
BEGIN
    UPDATE entrada SET estado = 'consumida' WHERE id_entrada = NEW.id_entrada;
END$$

-- ============================================================
-- evento — BEFORE INSERT
-- Consolida: superposicion estadio + superposicion equipo + admin su sede
-- ============================================================
DROP TRIGGER IF EXISTS trg_evento_bi$$
DROP TRIGGER IF EXISTS trg_evento_bi_superposicion_estadio$$
DROP TRIGGER IF EXISTS trg_evento_bi_superposicion_equipo$$
DROP TRIGGER IF EXISTS trg_evento_bi_admin_su_sede$$
CREATE TRIGGER trg_evento_bi
BEFORE INSERT ON evento
FOR EACH ROW
BEGIN
    DECLARE v_existe       INT DEFAULT 0;
    DECLARE v_sede_admin   INT;
    DECLARE v_sede_estadio INT;

    -- Superposicion en estadio
    SELECT COUNT(*) INTO v_existe FROM evento
    WHERE id_estadio = NEW.id_estadio AND fecha_hora = NEW.fecha_hora;
    IF v_existe > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe un evento en ese estadio a esa fecha y hora';
    END IF;

    -- Superposicion de equipo
    SELECT COUNT(*) INTO v_existe FROM evento
    WHERE fecha_hora = NEW.fecha_hora
      AND (equipo_local = NEW.equipo_local OR equipo_visitante = NEW.equipo_local
        OR equipo_local = NEW.equipo_visitante OR equipo_visitante = NEW.equipo_visitante);
    IF v_existe > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Un equipo ya tiene partido a esa fecha y hora';
    END IF;

    -- Admin solo gestiona su sede
    SELECT id_sede INTO v_sede_admin FROM administrador WHERE mail_usuario = NEW.mail_admin;
    SELECT id_sede INTO v_sede_estadio FROM estadio WHERE id_estadio = NEW.id_estadio;
    IF v_sede_admin IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario no es administrador';
    END IF;
    IF v_sede_admin != v_sede_estadio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Admin solo gestiona eventos de su sede';
    END IF;
END$$

-- ============================================================
-- evento — BEFORE UPDATE
-- Consolida: superposicion estadio + superposicion equipo + admin su sede
-- ============================================================
DROP TRIGGER IF EXISTS trg_evento_bu$$
DROP TRIGGER IF EXISTS trg_evento_bu_superposicion_estadio$$
DROP TRIGGER IF EXISTS trg_evento_bu_superposicion_equipo$$
DROP TRIGGER IF EXISTS trg_evento_bu_admin_su_sede$$
CREATE TRIGGER trg_evento_bu
BEFORE UPDATE ON evento
FOR EACH ROW
BEGIN
    DECLARE v_existe       INT DEFAULT 0;
    DECLARE v_sede_admin   INT;
    DECLARE v_sede_estadio INT;

    -- Superposicion en estadio
    IF NEW.id_estadio != OLD.id_estadio OR NEW.fecha_hora != OLD.fecha_hora THEN
        SELECT COUNT(*) INTO v_existe FROM evento
        WHERE id_estadio = NEW.id_estadio AND fecha_hora = NEW.fecha_hora AND id_evento != OLD.id_evento;
        IF v_existe > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ya existe un evento en ese estadio a esa fecha y hora';
        END IF;
    END IF;

    -- Superposicion de equipo
    IF NEW.fecha_hora != OLD.fecha_hora OR NEW.equipo_local != OLD.equipo_local OR NEW.equipo_visitante != OLD.equipo_visitante THEN
        SELECT COUNT(*) INTO v_existe FROM evento
        WHERE fecha_hora = NEW.fecha_hora AND id_evento != OLD.id_evento
          AND (equipo_local = NEW.equipo_local OR equipo_visitante = NEW.equipo_local
            OR equipo_local = NEW.equipo_visitante OR equipo_visitante = NEW.equipo_visitante);
        IF v_existe > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Un equipo ya tiene partido a esa fecha y hora';
        END IF;
    END IF;

    -- Admin solo gestiona su sede
    IF NEW.id_estadio != OLD.id_estadio THEN
        SELECT id_sede INTO v_sede_admin FROM administrador WHERE mail_usuario = NEW.mail_admin;
        SELECT id_sede INTO v_sede_estadio FROM estadio WHERE id_estadio = NEW.id_estadio;
        IF v_sede_admin != v_sede_estadio THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Admin solo gestiona eventos de su sede';
        END IF;
    END IF;
END$$

DELIMITER ;
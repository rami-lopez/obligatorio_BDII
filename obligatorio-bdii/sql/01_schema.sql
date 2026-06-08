
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USUARIO
-- ============================================================

CREATE TABLE usuario (
    mail                VARCHAR(255)    NOT NULL,
    pais_doc            VARCHAR(100)    NOT NULL,
    tipo_doc            VARCHAR(50)     NOT NULL,
    nro_doc             VARCHAR(50)     NOT NULL,
    pais_dir            VARCHAR(100)    NOT NULL,
    localidad           VARCHAR(100)    NOT NULL,
    calle               VARCHAR(150)    NOT NULL,
    nro_dir             VARCHAR(20)     NOT NULL,
    cod_postal          VARCHAR(20)     NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_usuario           PRIMARY KEY (mail),
    CONSTRAINT uq_usuario_nro_doc   UNIQUE (pais_doc, tipo_doc, nro_doc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TELEFONO (debil de USUARIO)
-- ============================================================

CREATE TABLE telefono (
    mail_usuario        VARCHAR(255)    NOT NULL,
    numero              VARCHAR(30)     NOT NULL,

    CONSTRAINT pk_telefono          PRIMARY KEY (mail_usuario, numero),
    CONSTRAINT fk_telefono_usuario  FOREIGN KEY (mail_usuario)
        REFERENCES usuario (mail)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ESPECIALIZACIONES DE USUARIO
-- ============================================================

CREATE TABLE administrador (
    mail_usuario        VARCHAR(255)    NOT NULL,
    fecha_asignacion    DATE            NOT NULL,
    id_sede             INT,

    CONSTRAINT pk_administrador         PRIMARY KEY (mail_usuario),
    CONSTRAINT uq_administrador_sede    UNIQUE (id_sede),
    CONSTRAINT fk_administrador_usuario FOREIGN KEY (mail_usuario)
        REFERENCES usuario (mail)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE funcionario (
    mail_usuario        VARCHAR(255)    NOT NULL,
    nro_legajo          VARCHAR(50)     NOT NULL,

    CONSTRAINT pk_funcionario           PRIMARY KEY (mail_usuario),
    CONSTRAINT uq_funcionario_legajo    UNIQUE (nro_legajo),
    CONSTRAINT fk_funcionario_usuario   FOREIGN KEY (mail_usuario)
        REFERENCES usuario (mail)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuario_general (
    mail_usuario        VARCHAR(255)    NOT NULL,
    fecha_registro      DATE            NOT NULL,
    verificado          TINYINT(1)      NOT NULL DEFAULT 0,

    CONSTRAINT pk_usuario_general           PRIMARY KEY (mail_usuario),
    CONSTRAINT fk_usuario_general_usuario   FOREIGN KEY (mail_usuario)
        REFERENCES usuario (mail)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEDE
-- ============================================================

CREATE TABLE sede (
    id_sede             INT             NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150)    NOT NULL,
    pais                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_sede PRIMARY KEY (id_sede)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE administrador
    ADD CONSTRAINT fk_administrador_sede FOREIGN KEY (id_sede)
        REFERENCES sede (id_sede);

-- ============================================================
-- ESTADIO
-- ============================================================

CREATE TABLE estadio (
    id_estadio          INT             NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150)    NOT NULL,
    pais                VARCHAR(100)    NOT NULL,
    ciudad              VARCHAR(100)    NOT NULL,
    id_sede             INT             NOT NULL,

    CONSTRAINT pk_estadio           PRIMARY KEY (id_estadio),
    CONSTRAINT fk_estadio_sede      FOREIGN KEY (id_sede)
        REFERENCES sede (id_sede)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SECTOR (debil de ESTADIO)
-- ============================================================

CREATE TABLE sector (
    id_estadio          INT             NOT NULL,
    codigo              VARCHAR(10)     NOT NULL,
    capacidad_max       INT             NOT NULL,
    costo               DECIMAL(10,2)   NOT NULL,

    CONSTRAINT pk_sector                PRIMARY KEY (id_estadio, codigo),
    CONSTRAINT fk_sector_estadio        FOREIGN KEY (id_estadio)
        REFERENCES estadio (id_estadio)
        ON DELETE CASCADE,
    CONSTRAINT ck_sector_capacidad      CHECK (capacidad_max > 0),
    CONSTRAINT ck_sector_costo          CHECK (costo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- EVENTO
-- ============================================================

CREATE TABLE evento (
    id_evento           INT             NOT NULL AUTO_INCREMENT,
    fecha_hora          DATETIME        NOT NULL,
    equipo_local        VARCHAR(100)    NOT NULL,
    equipo_visitante    VARCHAR(100)    NOT NULL,
    id_estadio          INT             NOT NULL,
    mail_admin          VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_evento                PRIMARY KEY (id_evento),
    CONSTRAINT uq_evento_estadio        UNIQUE (id_evento, id_estadio),
    CONSTRAINT fk_evento_estadio        FOREIGN KEY (id_estadio)
        REFERENCES estadio (id_estadio),
    CONSTRAINT fk_evento_admin          FOREIGN KEY (mail_admin)
        REFERENCES administrador (mail_usuario),
    CONSTRAINT ck_evento_equipos        CHECK (equipo_local <> equipo_visitante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- AGG1: EVENTO_SECTOR (EVENTO -- habilita -- SECTOR)
-- ============================================================

CREATE TABLE evento_sector (
    id_evento           INT             NOT NULL,
    id_estadio          INT             NOT NULL,
    codigo_sector       VARCHAR(10)     NOT NULL,

    CONSTRAINT pk_evento_sector                     PRIMARY KEY (id_evento, id_estadio, codigo_sector),
    CONSTRAINT fk_evento_sector_evento_estadio      FOREIGN KEY (id_evento, id_estadio)
        REFERENCES evento (id_evento, id_estadio),
    CONSTRAINT fk_evento_sector_sector              FOREIGN KEY (id_estadio, codigo_sector)
        REFERENCES sector (id_estadio, codigo)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: consistencia de id_estadio entre evento y sector
-- (reemplaza la FK diferida de PostgreSQL)
DELIMITER $$
CREATE TRIGGER trg_evento_sector_consistencia
BEFORE INSERT ON evento_sector
FOR EACH ROW
BEGIN
    DECLARE v_estadio_evento INT;
    SELECT id_estadio INTO v_estadio_evento
    FROM evento WHERE id_evento = NEW.id_evento;

    IF v_estadio_evento <> NEW.id_estadio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estadio del sector no coincide con el estadio del evento';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- ASIGNACION (AGG1 -- asignado a -- FUNCIONARIO)
-- ============================================================

CREATE TABLE asignacion (
    id_evento           INT             NOT NULL,
    id_estadio          INT             NOT NULL,
    codigo_sector       VARCHAR(10)     NOT NULL,
    mail_funcionario    VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_asignacion                    PRIMARY KEY (id_evento, id_estadio, codigo_sector, mail_funcionario),
    CONSTRAINT fk_asignacion_evento_sector      FOREIGN KEY (id_evento, id_estadio, codigo_sector)
        REFERENCES evento_sector (id_evento, id_estadio, codigo_sector)
        ON DELETE CASCADE,
    CONSTRAINT fk_asignacion_funcionario        FOREIGN KEY (mail_funcionario)
        REFERENCES funcionario (mail_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DISPOSITIVO (debil de FUNCIONARIO, AGG2)
-- ============================================================

CREATE TABLE dispositivo (
    mail_funcionario    VARCHAR(255)    NOT NULL,
    identificador       VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_dispositivo               PRIMARY KEY (mail_funcionario, identificador),
    CONSTRAINT fk_dispositivo_funcionario   FOREIGN KEY (mail_funcionario)
        REFERENCES funcionario (mail_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- VENTA
-- ============================================================

CREATE TABLE venta (
    id_venta            INT             NOT NULL AUTO_INCREMENT,
    fecha               DATETIME        NOT NULL DEFAULT NOW(),
    estado              VARCHAR(30)     NOT NULL DEFAULT 'pendiente',
    monto_total         DECIMAL(10,2)   NOT NULL,
    tasa_comision       DECIMAL(5,4)    NOT NULL,
    mail_usuario        VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_venta                     PRIMARY KEY (id_venta),
    CONSTRAINT fk_venta_usuario_general     FOREIGN KEY (mail_usuario)
        REFERENCES usuario_general (mail_usuario),
    CONSTRAINT ck_venta_estado              CHECK (estado IN ('pendiente', 'confirmada', 'anulada')),
    CONSTRAINT ck_venta_monto               CHECK (monto_total >= 0),
    CONSTRAINT ck_venta_tasa                CHECK (tasa_comision >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ENTRADA (debil de VENTA)
-- ============================================================

CREATE TABLE entrada (
    id_entrada          INT             NOT NULL AUTO_INCREMENT,
    estado              VARCHAR(30)     NOT NULL DEFAULT 'activa',
    id_venta            INT             NOT NULL,
    id_evento           INT             NOT NULL,
    id_estadio          INT             NOT NULL,
    codigo_sector       VARCHAR(10)     NOT NULL,
    mail_propietario    VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_entrada                   PRIMARY KEY (id_entrada),
    CONSTRAINT fk_entrada_venta             FOREIGN KEY (id_venta)
        REFERENCES venta (id_venta),
    CONSTRAINT fk_entrada_evento_sector     FOREIGN KEY (id_evento, id_estadio, codigo_sector)
        REFERENCES evento_sector (id_evento, id_estadio, codigo_sector),
    CONSTRAINT fk_entrada_propietario       FOREIGN KEY (mail_propietario)
        REFERENCES usuario (mail),
    CONSTRAINT ck_entrada_estado            CHECK (estado IN ('activa', 'transferida', 'consumida', 'anulada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: maximo 5 entradas por venta
DELIMITER $$
CREATE TRIGGER trg_max_entradas_por_venta
BEFORE INSERT ON entrada
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM entrada WHERE id_venta = NEW.id_venta;

    IF v_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una venta no puede tener mas de 5 entradas';
    END IF;
END$$
DELIMITER ;

-- Trigger: no superar capacidad del sector por evento
DELIMITER $$
CREATE TRIGGER trg_capacidad_sector
BEFORE INSERT ON entrada
FOR EACH ROW
BEGIN
    DECLARE v_capacidad INT;
    DECLARE v_vendidas  INT;

    SELECT s.capacidad_max INTO v_capacidad
    FROM sector s
    WHERE s.id_estadio = NEW.id_estadio
      AND s.codigo = NEW.codigo_sector;

    SELECT COUNT(*) INTO v_vendidas
    FROM entrada
    WHERE id_evento = NEW.id_evento
      AND id_estadio = NEW.id_estadio
      AND codigo_sector = NEW.codigo_sector
      AND estado <> 'anulada';

    IF v_vendidas >= v_capacidad THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Capacidad maxima del sector alcanzada para este evento';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRANSFERENCIA (debil de ENTRADA)
-- ============================================================

CREATE TABLE transferencia (
    id_transferencia    INT             NOT NULL AUTO_INCREMENT,
    fecha_solicitud     DATETIME        NOT NULL DEFAULT NOW(),
    fecha_aceptacion    DATETIME,
    estado              VARCHAR(30)     NOT NULL DEFAULT 'pendiente',
    nro_orden           INT             NOT NULL,
    id_entrada          INT             NOT NULL,
    mail_origen         VARCHAR(255)    NOT NULL,
    mail_destino        VARCHAR(255)    NOT NULL,

    CONSTRAINT pk_transferencia             PRIMARY KEY (id_transferencia),
    CONSTRAINT fk_transferencia_entrada     FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada),
    CONSTRAINT fk_transferencia_origen      FOREIGN KEY (mail_origen)
        REFERENCES usuario (mail),
    CONSTRAINT fk_transferencia_destino     FOREIGN KEY (mail_destino)
        REFERENCES usuario (mail),
    CONSTRAINT ck_transferencia_estado      CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    CONSTRAINT ck_transferencia_nro_orden   CHECK (nro_orden BETWEEN 1 AND 3),
    CONSTRAINT ck_transferencia_usuarios    CHECK (mail_origen <> mail_destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: maximo 3 transferencias aceptadas por entrada
DELIMITER $$
CREATE TRIGGER trg_max_transferencias
BEFORE INSERT ON transferencia
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM transferencia
    WHERE id_entrada = NEW.id_entrada
      AND estado = 'aceptada';

    IF v_count >= 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una entrada no puede tener mas de 3 transferencias';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TOKEN QR (debil de ENTRADA)
-- ============================================================

CREATE TABLE token_qr (
    id_token            INT             NOT NULL AUTO_INCREMENT,
    codigo_hash         VARCHAR(255)    NOT NULL,
    generado_en         DATETIME        NOT NULL DEFAULT NOW(),
    expira_en           DATETIME        NOT NULL,
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    id_entrada          INT             NOT NULL,

    CONSTRAINT pk_token_qr          PRIMARY KEY (id_token),
    CONSTRAINT uq_token_qr_hash     UNIQUE (codigo_hash),
    CONSTRAINT fk_token_qr_entrada  FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: solo un token activo por entrada
-- (reemplaza el indice unico parcial de PostgreSQL)
DELIMITER $$
CREATE TRIGGER trg_token_activo_unico
BEFORE INSERT ON token_qr
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    IF NEW.activo = 1 THEN
        SELECT COUNT(*) INTO v_count
        FROM token_qr
        WHERE id_entrada = NEW.id_entrada AND activo = 1;

        IF v_count >= 1 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ya existe un token activo para esta entrada';
        END IF;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- VALIDACION (AGG2 -- valida -- ENTRADA, acepta TOKEN QR)
-- ============================================================

CREATE TABLE validacion (
    id_validacion       INT             NOT NULL AUTO_INCREMENT,
    fecha_hora          DATETIME        NOT NULL DEFAULT NOW(),
    mail_funcionario    VARCHAR(255)    NOT NULL,
    identificador_disp  VARCHAR(100)    NOT NULL,
    id_entrada          INT             NOT NULL,
    id_token            INT             NOT NULL,

    CONSTRAINT pk_validacion                PRIMARY KEY (id_validacion),
    CONSTRAINT uq_validacion_entrada        UNIQUE (id_entrada),
    CONSTRAINT fk_validacion_dispositivo    FOREIGN KEY (mail_funcionario, identificador_disp)
        REFERENCES dispositivo (mail_funcionario, identificador),
    CONSTRAINT fk_validacion_entrada        FOREIGN KEY (id_entrada)
        REFERENCES entrada (id_entrada),
    CONSTRAINT fk_validacion_token          FOREIGN KEY (id_token)
        REFERENCES token_qr (id_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

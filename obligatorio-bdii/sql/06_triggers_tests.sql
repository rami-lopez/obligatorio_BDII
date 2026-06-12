USE ticketing_mundial;

-- ============================================================
-- TESTS DE TRIGGERS
-- Cada bloque tiene:
--   [OK]  -> debe ejecutarse sin error
--   [ERR] -> debe fallar con el mensaje indicado
-- ============================================================


-- ------------------------------------------------------------
-- trg_entrada_bi: MAX 5 ENTRADAS POR VENTA
-- ------------------------------------------------------------

-- Llenar la venta 4 hasta 4 entradas (ya tiene 2, agregamos 2 más válidas)
INSERT INTO venta (fecha, estado, monto_total, tasa_comision, mail_usuario)
VALUES ('2026-05-25 10:00:00', 'confirmada', 480.00, 0.05, 'usuario1@example.com');
-- [OK] entradas 1 a 5 en la venta creada arriba
SET @v = (SELECT MAX(id_venta) FROM venta);
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');

-- [ERR] 'Una venta no puede tener mas de 5 entradas'
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES ('activa', @v, 1, 1, 'A1', 'usuario1@example.com');


-- ------------------------------------------------------------
-- trg_entrada_bi: ESTADIO NO COINCIDE CON EL EVENTO
-- ------------------------------------------------------------

-- [ERR] 'Estadio de la entrada no coincide con el del evento'
-- Evento 1 es en estadio 1, acá ponemos estadio 2
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario)
VALUES ('activa', 1, 1, 2, 'A1', 'usuario1@example.com');


-- ------------------------------------------------------------
-- trg_entrada_bi: SECTOR NO HABILITADO PARA EL EVENTO
-- ------------------------------------------------------------

-- [ERR] 'El sector no esta habilitado para este evento'
-- Evento 3 tiene habilitados A1 y B1 del estadio 3, no C1
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario)
VALUES ('activa', 4, 3, 3, 'C1', 'usuario3@example.com');


-- ------------------------------------------------------------
-- trg_entrada_bi: CAPACIDAD MAXIMA DEL SECTOR
-- ------------------------------------------------------------

-- Sector A1 del estadio 1 tiene capacidad 500. Para probar rápido
-- reducimos la capacidad temporalmente y forzamos el límite.
-- En su lugar probamos con un sector casi lleno:
-- [OK] insertar una entrada válida en sector con espacio
INSERT INTO venta (fecha, estado, monto_total, tasa_comision, mail_usuario)
VALUES ('2026-05-26 10:00:00', 'confirmada', 150.00, 0.05, 'usuario2@example.com');
SET @v2 = (SELECT MAX(id_venta) FROM venta);
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario)
VALUES ('activa', @v2, 1, 1, 'A1', 'usuario2@example.com');

-- Para forzar el error de capacidad, bajamos momentáneamente la capacidad del sector
UPDATE sector SET capacidad_max = (SELECT COUNT(*) FROM entrada e WHERE e.id_evento = 1 AND e.id_estadio = 1 AND e.codigo_sector = 'A1' AND e.estado <> 'anulada') WHERE id_estadio = 1 AND codigo = 'A1';
-- [ERR] 'Capacidad maxima del sector alcanzada para este evento'
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario)
VALUES ('activa', @v2, 1, 1, 'A1', 'usuario2@example.com');
-- Restaurar capacidad original
UPDATE sector SET capacidad_max = 500 WHERE id_estadio = 1 AND codigo = 'A1';


-- ------------------------------------------------------------
-- trg_entrada_bu: CONSUMIDA ES IRREVERSIBLE
-- ------------------------------------------------------------

-- [OK] cambiar estado de activa a consumida
UPDATE entrada SET estado = 'consumida' WHERE id_entrada = 2;
-- [ERR] 'Una entrada consumida no puede cambiar de estado'
UPDATE entrada SET estado = 'activa' WHERE id_entrada = 2;
-- Dejar en consumida para no romper otros tests
-- (entrada 2 queda consumida a partir de acá)


-- ------------------------------------------------------------
-- trg_transferencia_bi: MAX 3 TRANSFERENCIAS ACEPTADAS
-- ------------------------------------------------------------

-- Entrada 7 ya tiene 1 transferencia aceptada.
-- Agregamos 2 más respetando el flujo pendiente -> aceptada para actualizar propietario.


SET @owner7 = (SELECT mail_propietario FROM entrada WHERE id_entrada = 7);
INSERT INTO transferencia (fecha_solicitud, estado, nro_orden, id_entrada, mail_origen, mail_destino)
VALUES (NOW(), 'pendiente', 2, 7, @owner7, 'usuario4@example.com');
SET @t7_2 = LAST_INSERT_ID();
UPDATE transferencia
SET estado = 'aceptada', fecha_aceptacion = NOW()
WHERE id_transferencia = @t7_2;

SET @owner7 = (SELECT mail_propietario FROM entrada WHERE id_entrada = 7);
INSERT INTO transferencia (fecha_solicitud, estado, nro_orden, id_entrada, mail_origen, mail_destino)
VALUES (NOW(), 'pendiente', 3, 7, @owner7, 'usuario5@example.com');
SET @t7_3 = LAST_INSERT_ID();
UPDATE transferencia
SET estado = 'aceptada', fecha_aceptacion = NOW()
WHERE id_transferencia = @t7_3;


-- ------------------------------------------------------------
-- trg_transferencia_bi: NO TRANSFERIR ENTRADA CONSUMIDA
-- ------------------------------------------------------------

-- Entrada 12 está consumida
-- [ERR] 'No se puede transferir una entrada consumida'
INSERT INTO transferencia (fecha_solicitud, estado, nro_orden, id_entrada, mail_origen, mail_destino)
VALUES (NOW(), 'pendiente', 1, 12, 'usuario5@example.com', 'usuario1@example.com');


-- ------------------------------------------------------------
-- trg_transferencia_bi: ORIGEN DEBE SER PROPIETARIO ACTUAL
-- ------------------------------------------------------------

-- Entrada 8 es de usuario3@example.com
-- [ERR] 'El origen no es el propietario actual de la entrada'
INSERT INTO transferencia (fecha_solicitud, estado, nro_orden, id_entrada, mail_origen, mail_destino)
VALUES (NOW(), 'pendiente', 1, 8, 'usuario1@example.com', 'usuario4@example.com');


-- ------------------------------------------------------------
-- trg_transferencia_bi: NO DOS TRANSFERENCIAS PENDIENTES
-- ------------------------------------------------------------

-- Entrada 1 ya tiene una transferencia pendiente (id_transferencia 2)
-- [ERR] 'Ya existe una transferencia pendiente para esta entrada'
INSERT INTO transferencia (fecha_solicitud, estado, nro_orden, id_entrada, mail_origen, mail_destino)
VALUES (NOW(), 'pendiente', 2, 1, 'usuario1@example.com', 'usuario2@example.com');


-- ------------------------------------------------------------
-- trg_transferencia_au: ACEPTAR TRANSFERENCIA ACTUALIZA PROPIETARIO
-- ------------------------------------------------------------

-- Entrada 6 tiene una transferencia pendiente, propietario actual: usuario1@example.com
-- [OK] aceptar -> propietario debe pasar a usuario7@example.com y estado a 'transferida'
UPDATE transferencia
SET estado = 'aceptada', fecha_aceptacion = NOW()
WHERE id_entrada = 6 AND estado = 'pendiente'
LIMIT 1;
-- Verificar:
SELECT mail_propietario, estado FROM entrada WHERE id_entrada = 6;
-- Esperado: usuario7@example.com / transferida


-- ------------------------------------------------------------
-- trg_token_qr_bi: NO QR PARA ENTRADA CONSUMIDA
-- ------------------------------------------------------------

-- Entrada 12 está consumida
-- [ERR] 'No se puede generar QR para entrada consumida'
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada)
VALUES ('hash_nueva_consumida', NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), 1, 12);


-- ------------------------------------------------------------
-- trg_token_qr_bi: SOLO UN TOKEN ACTIVO POR ENTRADA
-- ------------------------------------------------------------

-- Tomamos una entrada que tenga token activo y no este consumida
SET @entrada_token = (
	SELECT tq.id_entrada
	FROM token_qr tq
	JOIN entrada e ON e.id_entrada = tq.id_entrada
	WHERE tq.activo = 1 AND e.estado <> 'consumida'
	LIMIT 1
);

-- [ERR] 'Ya existe un token activo para esta entrada'
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada)
VALUES (CONCAT('hash_duplicado_activo_', UUID()), NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), 1, @entrada_token);

-- [OK] insertar token inactivo no debe fallar
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada)
VALUES (CONCAT('hash_inactivo_ok_', UUID()), NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), 0, @entrada_token);


-- ------------------------------------------------------------
-- trg_validacion_bi: FUNCIONARIO SIN ASIGNACION EN ESE SECTOR/EVENTO
-- ------------------------------------------------------------

-- func2 no tiene asignación en evento 2 sector A1
-- Necesitamos un token activo para entrada 5 (evento 2, sector A1)
-- Entrada 5 ya tiene token activo (id_token 5), pero expirado. Insertamos uno vigente:
-- Primero desactivar el existente
UPDATE token_qr SET activo = 0 WHERE id_entrada = 5 AND activo = 1;
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada)
VALUES ('hash_test_func2', NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), 1, 5);
SET @tk = (SELECT id_token FROM token_qr WHERE codigo_hash = 'hash_test_func2');
-- [ERR] 'Funcionario sin asignacion en ese sector/evento'
INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token)
VALUES (NOW(), 'func2@example.com', 'DISP-F2-001', 5, @tk);


-- ------------------------------------------------------------
-- trg_validacion_bi: ENTRADA YA CONSUMIDA
-- ------------------------------------------------------------

-- Reutilizamos entrada 5 y su token (@tk) del bloque anterior,
-- pero con funcionario asignado para que el trigger falle por consumida.
SET @func_consumida = (
	SELECT a.mail_funcionario
	FROM asignacion a
	JOIN entrada e
	  ON e.id_evento = a.id_evento
	 AND e.id_estadio = a.id_estadio
	 AND e.codigo_sector = a.codigo_sector
	WHERE e.id_entrada = 5
	LIMIT 1
);
SET @disp_consumida = (
	SELECT d.identificador
	FROM dispositivo d
	WHERE d.mail_funcionario = @func_consumida
	LIMIT 1
);
UPDATE entrada SET estado = 'consumida' WHERE id_entrada = 5;
-- [ERR] 'La entrada ya fue consumida'
    INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token)
    VALUES (NOW(), @func_consumida, @disp_consumida, 5, @tk);


-- ------------------------------------------------------------
-- trg_validacion_bi: TOKEN NO ACTIVO O EXPIRADO
-- ------------------------------------------------------------

-- Token id 1 está inactivo (activo=0), entrada 1
SET @func_e1 = (
	SELECT a.mail_funcionario
	FROM entrada e
	JOIN asignacion a
	  ON a.id_evento = e.id_evento
	 AND a.id_estadio = e.id_estadio
	 AND a.codigo_sector = e.codigo_sector
	WHERE e.id_entrada = 1
	LIMIT 1
);
SET @disp_e1 = (
	SELECT d.identificador
	FROM dispositivo d
	WHERE d.mail_funcionario = @func_e1
	LIMIT 1
);
-- [ERR] 'El QR no existe o no esta activo'
INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token)
VALUES (NOW(), @func_e1, @disp_e1, 1, 1);

-- Token vigente pero expirado (expira_en en el pasado): entrada 3, token 3 (expira_en 19:50:30 del 11/06)
SET @func_e3 = (
	SELECT a.mail_funcionario
	FROM entrada e
	JOIN asignacion a
	  ON a.id_evento = e.id_evento
	 AND a.id_estadio = e.id_estadio
	 AND a.codigo_sector = e.codigo_sector
	WHERE e.id_entrada = 3
	LIMIT 1
);
SET @disp_e3 = (
	SELECT d.identificador
	FROM dispositivo d
	WHERE d.mail_funcionario = @func_e3
	LIMIT 1
);
-- [ERR] 'El codigo QR ha expirado'
INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token)
VALUES (NOW(), @func_e3, @disp_e3, 3, 3);


-- ------------------------------------------------------------
-- trg_validacion_ai: ENTRADA SE MARCA CONSUMIDA AL VALIDAR
-- ------------------------------------------------------------

-- Entrada 9 activa, asignada a func3 en evento 2 sector A1
-- Necesitamos token activo y vigente para entrada 9
UPDATE token_qr SET activo = 0 WHERE id_entrada = 9 AND activo = 1;
SET @hash_validar = CONCAT('hash_test_validar_', UUID());
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada)
VALUES (@hash_validar, NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), 1, 9);
SET @tk2 = LAST_INSERT_ID();
SET @evt9 = (SELECT id_evento FROM entrada WHERE id_entrada = 9);
SET @est9 = (SELECT id_estadio FROM entrada WHERE id_entrada = 9);
SET @sec9 = (SELECT codigo_sector FROM entrada WHERE id_entrada = 9);

-- Elegimos un funcionario que seguro tenga dispositivo
SET @func_e9 = (SELECT d.mail_funcionario FROM dispositivo d LIMIT 1);
SET @disp_e9 = (
	SELECT d.identificador
	FROM dispositivo d
	WHERE d.mail_funcionario = @func_e9
	LIMIT 1
);

-- Garantizamos asignacion al sector/evento de la entrada 9
INSERT IGNORE INTO asignacion (id_evento, id_estadio, codigo_sector, mail_funcionario)
VALUES (@evt9, @est9, @sec9, @func_e9);
-- [OK] validar -> entrada debe quedar consumida
INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token)
VALUES (NOW(), @func_e9, @disp_e9, 9, @tk2);
-- Verificar:
SELECT estado FROM entrada WHERE id_entrada = 9;
-- Esperado: consumida


-- ------------------------------------------------------------
-- trg_evento_bi: SUPERPOSICION EN ESTADIO
-- ------------------------------------------------------------

-- Evento 1 ya ocupa estadio 1 el 2026-06-11 20:00:00
-- [ERR] 'Ya existe un evento en ese estadio a esa fecha y hora'
INSERT INTO evento (fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin)
VALUES ('2026-06-11 20:00:00', 'Bolivia', 'Peru', 1, 'admin1@example.com');


-- ------------------------------------------------------------
-- trg_evento_bi: SUPERPOSICION DE EQUIPO
-- ------------------------------------------------------------

-- Mexico ya juega el 2026-06-11 20:00:00
-- [ERR] 'Un equipo ya tiene partido a esa fecha y hora'
INSERT INTO evento (fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin)
VALUES ('2026-06-11 20:00:00', 'Mexico', 'Brasil', 2, 'admin2@example.com');


-- ------------------------------------------------------------
-- trg_evento_bi: ADMIN SOLO GESTIONA SU SEDE
-- ------------------------------------------------------------

-- admin1 pertenece a sede 1 (estadio 1, 2). Estadio 3 pertenece a sede 3.
-- [ERR] 'Admin solo gestiona eventos de su sede'
INSERT INTO evento (fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin)
VALUES ('2026-07-01 20:00:00', 'Bolivia', 'Peru', 3, 'admin1@example.com');

-- [OK] admin1 crea evento en estadio 1 (su sede)
INSERT INTO evento (fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin)
VALUES ('2026-07-01 20:00:00', 'Bolivia', 'Peru', 1, 'admin1@example.com');


-- ------------------------------------------------------------
-- trg_evento_bu: SUPERPOSICION EN ESTADIO (UPDATE)
-- ------------------------------------------------------------

-- Mover evento 2 al mismo estadio y hora que evento 1
-- [ERR] 'Ya existe un evento en ese estadio a esa fecha y hora'
UPDATE evento SET id_estadio = 1, fecha_hora = '2026-06-11 20:00:00' WHERE id_evento = 2;


-- ------------------------------------------------------------
-- trg_evento_bu: SUPERPOSICION DE EQUIPO (UPDATE)
-- ------------------------------------------------------------

-- Cambiar equipo del evento 2 a Mexico, que ya juega a esa hora
-- [ERR] 'Un equipo ya tiene partido a esa fecha y hora'
UPDATE evento SET equipo_local = 'Mexico', fecha_hora = '2026-06-11 20:00:00' WHERE id_evento = 2;


-- ------------------------------------------------------------
-- trg_evento_bu: ADMIN SOLO GESTIONA SU SEDE (UPDATE)
-- ------------------------------------------------------------

-- admin1 intenta mover evento 1 (suyo) a estadio 3 (sede 3, no es la suya)
-- [ERR] 'Admin solo gestiona eventos de su sede'
UPDATE evento SET id_estadio = 3 WHERE id_evento = 1;
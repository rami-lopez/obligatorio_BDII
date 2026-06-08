/*
-- CHEQUEAR LOS NOMBRES DE LAS TUPLAS


-- 1. Entradas actualmente asignadas a un usuario ---------------- PARA TODOS

SELECT e.id_entrada, ev.equipo_local, ev.equipo_visitante, ev.fecha_hora, e.codigo_sector, e.estado
FROM entrada e
JOIN evento ev
ON e.id_evento = ev.id_evento
WHERE e.mail_propietario = '[usuario@correo.com](mailto:usuario@correo.com)';

-- 2. Compras realizadas por un usuario ---------------- PARA TODOS

SELECT v.id_venta, v.fecha, v.estado, v.monto_total, COUNT(e.id_entrada) AS cantidad_entradas
FROM venta v
LEFT JOIN entrada e
ON v.id_venta = e.id_venta
WHERE v.mail_usuario = '[usuario@correo.com](mailto:usuario@correo.com)'
GROUP BY v.id_venta;

-- 3. Historial de transferencias de una entrada ---------------- PARA TODOS?????

SELECT t.nro_orden, t.fecha_solicitud, t.fecha_aceptacion, t.mail_origen, t.mail_destino, t.estado
FROM transferencia t
WHERE t.id_entrada = 1
ORDER BY t.nro_orden;

-- 4. Eventos con más entradas vendidas ---------------- PARA ADMINS

SELECT ev.id_evento, ev.equipo_local, ev.equipo_visitante, COUNT(e.id_entrada) AS entradas_vendidas
FROM evento ev
LEFT JOIN entrada e
ON ev.id_evento = e.id_evento
GROUP BY ev.id_evento
ORDER BY entradas_vendidas DESC;

-- 5. Ranking de compradores ----------- PARA ADMIMN

SELECT v.mail_usuario, COUNT(e.id_entrada) AS entradas_compradas, SUM(v.monto_total) AS dinero_gastado
FROM venta v
JOIN entrada e
ON v.id_venta = e.id_venta
GROUP BY v.mail_usuario
ORDER BY entradas_compradas DESC;

-- 6. Entradas validadas por funcionario ---------------- PARA ADMIN

SELECT va.mail_funcionario, COUNT(*) AS total_validaciones
FROM validacion va
GROUP BY va.mail_funcionario
ORDER BY total_validaciones DESC;

-- 7. Ocupación actual de cada sector ---------------- PARA ADMIN

SELECT s.id_estadio, s.codigo, s.capacidad_max, COUNT(e.id_entrada) AS vendidas, s.capacidad_max - COUNT(e.id_entrada) AS disponibles
FROM sector s
LEFT JOIN entrada e
ON s.id_estadio = e.id_estadio
AND s.codigo = e.codigo_sector
AND e.estado <> 'anulada'
GROUP BY s.id_estadio, s.codigo;

-- 8. Entradas consumidas para un evento  ---------------- PARA ADMIN

SELECT ev.id_evento, ev.equipo_local, ev.equipo_visitante, COUNT(*) AS entradas_consumidas
FROM entrada e
JOIN evento ev
ON e.id_evento = ev.id_evento
WHERE e.estado = 'consumida'
GROUP BY ev.id_evento;


-- 9. Funcionarios asignados a cada sector ---------------- PARA ADMIN

SELECT a.id_evento, a.codigo_sector, a.mail_funcionario
FROM asignacion a
ORDER BY a.id_evento, a.codigo_sector;

-- 10. Tokens QR activos ---------------- PARA ADMIN Y FUNCIONARIO

SELECT tq.id_token, tq.id_entrada, tq.generado_en, tq.expira_en
FROM token_qr tq
WHERE tq.activo = 1;

-- 11. Sectores en los que los funcionario validaron entradas

SELECT a.mail_funcionario
FROM asignacion a
LEFT JOIN validacion v ON a.mail_funcionario = v.mail_funcionario
GROUP BY a.mail_funcionario
HAVING COUNT(DISTINCT a.codigo_sector) <= COUNT(DISTINCT v.id_entrada);
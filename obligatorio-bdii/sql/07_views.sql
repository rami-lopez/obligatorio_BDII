-- ============================================================
-- VISTA: Entradas vendidas por evento
-- ============================================================

CREATE OR REPLACE VIEW vw_entradas_por_evento AS
SELECT
    e.id_evento,
    e.equipo_local,
    e.equipo_visitante,
    e.fecha_hora,
    COUNT(en.id_entrada) AS entradas_vendidas
FROM evento e
LEFT JOIN entrada en
    ON e.id_evento = en.id_evento
    AND en.estado <> 'anulada'
GROUP BY
    e.id_evento,
    e.equipo_local,
    e.equipo_visitante,
    e.fecha_hora;


-- ============================================================
-- VISTA: Ocupación de sectores por evento
-- ============================================================

CREATE OR REPLACE VIEW vw_ocupacion_sector AS
SELECT
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante,
    s.id_estadio,
    s.codigo AS sector,
    s.capacidad_max,
    COUNT(en.id_entrada) AS entradas_vendidas,
    ROUND(
        COUNT(en.id_entrada) * 100.0 / s.capacidad_max,
        2
    ) AS porcentaje_ocupacion
FROM evento ev
JOIN evento_sector es
    ON ev.id_evento = es.id_evento
    AND ev.id_estadio = es.id_estadio
JOIN sector s
    ON es.id_estadio = s.id_estadio
    AND es.codigo_sector = s.codigo
LEFT JOIN entrada en
    ON en.id_evento = ev.id_evento
    AND en.id_estadio = s.id_estadio
    AND en.codigo_sector = s.codigo
    AND en.estado <> 'anulada'
GROUP BY
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante,
    s.id_estadio,
    s.codigo,
    s.capacidad_max;


-- ============================================================
-- VISTA: Recaudación por evento
-- ============================================================

CREATE OR REPLACE VIEW vw_recaudacion_evento AS
SELECT
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante,
    COUNT(en.id_entrada) AS entradas_vendidas,
    COALESCE(SUM(v.monto_total), 0) AS recaudacion_total
FROM evento ev
LEFT JOIN entrada en
    ON ev.id_evento = en.id_evento
LEFT JOIN venta v
    ON en.id_venta = v.id_venta
    AND v.estado = 'confirmada'
GROUP BY
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante;


-- ============================================================
-- VISTA: Transferencias realizadas por usuario
-- ============================================================

CREATE OR REPLACE VIEW vw_transferencias_usuario AS
SELECT
    mail_origen,
    COUNT(*) AS transferencias_realizadas
FROM transferencia
WHERE estado = 'aceptada'
GROUP BY mail_origen;


-- ============================================================
-- VISTA: Funcionarios asignados por evento
-- ============================================================

CREATE OR REPLACE VIEW vw_funcionarios_por_evento AS
SELECT
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante,
    COUNT(DISTINCT a.mail_funcionario) AS funcionarios_asignados
FROM evento ev
LEFT JOIN asignacion a
    ON ev.id_evento = a.id_evento
    AND ev.id_estadio = a.id_estadio
GROUP BY
    ev.id_evento,
    ev.equipo_local,
    ev.equipo_visitante;


-- ============================================================
-- VISTA: Entradas validadas por funcionario
-- ============================================================

CREATE OR REPLACE VIEW vw_validaciones_funcionario AS
SELECT
    v.mail_funcionario,
    COUNT(*) AS entradas_validadas
FROM validacion v
GROUP BY v.mail_funcionario;


-- ============================================================
-- VISTA: Disponibilidad de entradas por evento
-- ============================================================

CREATE OR REPLACE VIEW vw_eventos_disponibles AS
SELECT
    ev.id_evento,
    ev.fecha_hora,
    ev.equipo_local,
    ev.equipo_visitante,
    est.nombre AS estadio,
    COUNT(en.id_entrada) AS entradas_vendidas,
    SUM(s.capacidad_max) AS capacidad_total,
    SUM(s.capacidad_max) - COUNT(en.id_entrada) AS entradas_disponibles
FROM evento ev
JOIN estadio est
    ON ev.id_estadio = est.id_estadio
JOIN sector s
    ON est.id_estadio = s.id_estadio
LEFT JOIN entrada en
    ON ev.id_evento = en.id_evento
    AND en.estado <> 'anulada'
GROUP BY
    ev.id_evento,
    ev.fecha_hora,
    ev.equipo_local,
    ev.equipo_visitante,
    est.nombre;
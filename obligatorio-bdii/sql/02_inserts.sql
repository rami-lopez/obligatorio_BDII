SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SEDE
-- ============================================================
INSERT INTO sede (nombre, pais) VALUES
('Sede Montevideo',      'Uruguay'),
('Sede Buenos Aires',    'Argentina'),
('Sede Santiago',        'Chile'),
('Sede São Paulo',       'Brasil'),
('Sede Bogotá',          'Colombia');

-- ============================================================
-- USUARIO
-- ============================================================
INSERT INTO usuario (mail, pais_doc, tipo_doc, nro_doc, pais_dir, localidad, calle, nro_dir, cod_postal) VALUES
('admin1@example.com',    'Uruguay',   'CI',       '12345678',  'Uruguay',   'Montevideo',    'Av. 18 de Julio',  '1234', '11000'),
('admin2@example.com',    'Argentina', 'DNI',      '30123456',  'Argentina', 'Buenos Aires',  'Corrientes',       '800',  'C1043'),
('admin3@example.com',    'Chile',     'RUT',      '12345678-9','Chile',     'Santiago',      'Providencia',      '500',  '7500000'),
('func1@example.com',     'Uruguay',   'CI',       '23456789',  'Uruguay',   'Montevideo',    'Bulevar Artigas',  '2000', '11300'),
('func2@example.com',     'Uruguay',   'CI',       '34567890',  'Uruguay',   'Canelones',     'Av. Italia',       '450',  '90000'),
('func3@example.com',     'Argentina', 'DNI',      '40123456',  'Argentina', 'Rosario',       'Córdoba',          '1200', 'S2000'),
('func4@example.com',     'Uruguay',   'CI',       '45678901',  'Uruguay',   'Montevideo',    'Colonia',          '900',  '11100'),
('usuario1@example.com',  'Uruguay',   'CI',       '56789012',  'Uruguay',   'Montevideo',    'Rivera',           '3100', '11600'),
('usuario2@example.com',  'Argentina', 'DNI',      '50123456',  'Argentina', 'Mendoza',       'San Martín',       '200',  'M5500'),
('usuario3@example.com',  'Brasil',    'CPF',      '123.456.789-00', 'Brasil','São Paulo',    'Paulista',         '1000', '01310-100'),
('usuario4@example.com',  'Uruguay',   'CI',       '67890123',  'Uruguay',   'Paysandú',      'Leandro Gómez',    '500',  '60000'),
('usuario5@example.com',  'Chile',     'RUT',      '98765432-1','Chile',     'Valparaíso',    'Pedro Montt',      '300',  '2360000'),
('usuario6@example.com',  'Uruguay',   'CI',       '78901234',  'Uruguay',   'Montevideo',    'Jackson',          '1400', '11400'),
('usuario7@example.com',  'Colombia',  'CC',       '1023456789','Colombia',  'Bogotá',        'Carrera 7',        '32',   '110111');

-- ============================================================
-- ADMINISTRADOR
-- ============================================================
INSERT INTO administrador (mail_usuario, fecha_asignacion, id_sede) VALUES
('admin1@example.com', '2024-01-15', 1),
('admin2@example.com', '2024-02-20', 2),
('admin3@example.com', '2024-03-10', 3);

-- ============================================================
-- FUNCIONARIO
-- ============================================================
INSERT INTO funcionario (mail_usuario, nro_legajo) VALUES
('func1@example.com', 'LEG-001'),
('func2@example.com', 'LEG-002'),
('func3@example.com', 'LEG-003'),
('func4@example.com', 'LEG-004');

-- ============================================================
-- USUARIO GENERAL
-- ============================================================
INSERT INTO usuario_general (mail_usuario, fecha_registro, verificado) VALUES
('usuario1@example.com', '2024-06-01', 1),
('usuario2@example.com', '2024-06-15', 1),
('usuario3@example.com', '2024-07-01', 0),
('usuario4@example.com', '2024-07-20', 1),
('usuario5@example.com', '2024-08-05', 1),
('usuario6@example.com', '2024-09-10', 0),
('usuario7@example.com', '2024-10-01', 1);

-- ============================================================
-- TELEFONO
-- ============================================================
INSERT INTO telefono (mail_usuario, numero) VALUES
('admin1@example.com',   '+598 99 111 111'),
('admin2@example.com',   '+54 11 2222 2222'),
('func1@example.com',    '+598 99 333 333'),
('func2@example.com',    '+598 99 444 444'),
('usuario1@example.com', '+598 99 555 555'),
('usuario1@example.com', '+598 99 555 556'),
('usuario2@example.com', '+54 261 333 3333'),
('usuario3@example.com', '+55 11 91234 5678'),
('usuario4@example.com', '+598 97 666 666'),
('usuario5@example.com', '+56 9 8765 4321');

-- ============================================================
-- ESTADIO
-- ============================================================
INSERT INTO estadio (nombre, pais, ciudad, id_sede) VALUES
('Estadio Centenario',        'Uruguay',   'Montevideo',    1),
('Estadio Gran Parque Central', 'Uruguay',   'Montevideo',    1),
('Estadio Campeon del Siglo', 'Uruguay', 'Buenos Aires',  2),
('Estadio Nacional',          'Chile',     'Santiago',      3),
('Arena Corinthians',         'Brasil',    'São Paulo',     4);

-- ============================================================
-- SECTOR
-- ============================================================
INSERT INTO sector (id_estadio, codigo, capacidad_max, costo) VALUES
-- Centenario
(1, 'A1', 500,  150.00),
(1, 'B1', 800,  100.00),
(1, 'C1', 1200,  60.00),
-- Gran Parque Central
(2, 'A1', 400,  200.00),
(2, 'B1', 600,  130.00),
(2, 'C1', 1000,  80.00),
-- Campeon del Siglo
(3, 'A1', 600,  180.00),
(3, 'B1', 900,  120.00),
-- Nacional
(4, 'A1', 450,  160.00),
(4, 'B1', 700,   90.00),
-- Arena Corinthians
(5, 'A1', 500,  220.00),
(5, 'B1', 800,  140.00);

-- ============================================================
-- EVENTO
-- ============================================================
INSERT INTO evento (fecha_hora, equipo_local, equipo_visitante, id_estadio, mail_admin) VALUES
('2025-03-15 20:00:00', 'España',         'Paises Bajos',          1, 'admin1@example.com'),
('2025-03-22 18:00:00', 'Alemania',          'Portugal',         2, 'admin1@example.com'),
('2025-04-05 21:00:00', 'Argentina',      'Uruguay',     3, 'admin2@example.com'),
('2025-04-12 19:00:00', 'Corea del Sur',        'Mexico',      4, 'admin3@example.com'),
('2025-04-20 16:00:00', 'Francia',      'Alemania',        5, 'admin3@example.com'),
('2025-05-10 20:00:00', 'Noruega',         'Uruguay',         1, 'admin1@example.com'),
('2025-05-18 17:00:00', 'Brasil',          'Colombia',            2, 'admin1@example.com');

-- ============================================================
-- EVENTO_SECTOR
-- ============================================================
INSERT INTO evento_sector (id_evento, id_estadio, codigo_sector) VALUES
-- Evento 1 - Centenario
(1, 1, 'A1'), (1, 1, 'B1'), (1, 1, 'C1'),
-- Evento 2 - Gran Parque Central
(2, 2, 'A1'), (2, 2, 'B1'), (2, 2, 'C1'),
-- Evento 3 - Campeon del Siglo
(3, 3, 'A1'), (3, 3, 'B1'),
-- Evento 4 - Nacional
(4, 4, 'A1'), (4, 4, 'B1'),
-- Evento 5 - Arena Corinthians
(5, 5, 'A1'), (5, 5, 'B1'),
-- Evento 6 - Centenario
(6, 1, 'A1'), (6, 1, 'B1'),
-- Evento 7 - Campeón del Siglo
(7, 2, 'A1'), (7, 2, 'B1');

-- ============================================================
-- ASIGNACION (funcionario -> evento_sector)
-- ============================================================
INSERT INTO asignacion (id_evento, id_estadio, codigo_sector, mail_funcionario) VALUES
(1, 1, 'A1', 'func1@example.com'),
(1, 1, 'B1', 'func2@example.com'),
(1, 1, 'C1', 'func1@example.com'),
(2, 2, 'A1', 'func3@example.com'),
(2, 2, 'B1', 'func4@example.com'),
(3, 3, 'A1', 'func3@example.com'),
(4, 4, 'A1', 'func4@example.com'),
(6, 1, 'A1', 'func1@example.com'),
(7, 2, 'B1', 'func2@example.com');

-- ============================================================
-- DISPOSITIVO
-- ============================================================
INSERT INTO dispositivo (mail_funcionario, identificador) VALUES
('func1@example.com', 'DISP-F1-001'),
('func1@example.com', 'DISP-F1-002'),
('func2@example.com', 'DISP-F2-001'),
('func3@example.com', 'DISP-F3-001'),
('func4@example.com', 'DISP-F4-001');

-- ============================================================
-- VENTA
-- ============================================================
INSERT INTO venta (fecha, estado, monto_total, tasa_comision, mail_usuario) VALUES
('2025-02-10 10:00:00', 'confirmada', 300.00, 0.0500, 'usuario1@example.com'),
('2025-02-11 11:30:00', 'confirmada', 200.00, 0.0500, 'usuario2@example.com'),
('2025-02-12 09:00:00', 'confirmada', 450.00, 0.0500, 'usuario1@example.com'),
('2025-02-13 14:00:00', 'confirmada', 160.00, 0.0500, 'usuario3@example.com'),
('2025-02-14 16:00:00', 'confirmada', 260.00, 0.0500, 'usuario4@example.com'),
('2025-02-15 08:00:00', 'confirmada', 400.00, 0.0500, 'usuario5@example.com'),
('2025-02-20 20:00:00', 'anulada',    100.00, 0.0500, 'usuario6@example.com');

-- ============================================================
-- ENTRADA
-- ============================================================
INSERT INTO entrada (estado, id_venta, id_evento, id_estadio, codigo_sector, mail_propietario) VALUES
-- Venta 1: 2 entradas sector A1 evento 1
('activa',     1, 1, 1, 'A1', 'usuario1@example.com'),
('activa',     1, 1, 1, 'A1', 'usuario1@example.com'),
-- Venta 2: 2 entradas sector B1 evento 1
('activa',     2, 1, 1, 'B1', 'usuario2@example.com'),
('activa',     2, 1, 1, 'B1', 'usuario2@example.com'),
-- Venta 3: 3 entradas sector A1 evento 2
('activa',     3, 2, 2, 'A1', 'usuario1@example.com'),
('activa',     3, 2, 2, 'A1', 'usuario1@example.com'),
('transferida',3, 2, 2, 'A1', 'usuario3@example.com'),
-- Venta 4: 2 entradas sector B1 evento 3
('activa',     4, 3, 3, 'B1', 'usuario3@example.com'),
('activa',     4, 3, 3, 'B1', 'usuario3@example.com'),
-- Venta 5: 2 entradas evento 4
('activa',     5, 4, 4, 'A1', 'usuario4@example.com'),
('activa',     5, 4, 4, 'B1', 'usuario4@example.com'),
-- Venta 6: 2 entradas evento 5
('consumida',  6, 5, 5, 'A1', 'usuario5@example.com'),
('activa',     6, 5, 5, 'B1', 'usuario5@example.com');

-- ============================================================
-- TRANSFERENCIA
-- ============================================================
INSERT INTO transferencia (fecha_solicitud, fecha_aceptacion, estado, nro_orden, id_entrada, mail_origen, mail_destino) VALUES
('2025-02-18 10:00:00', '2025-02-18 12:00:00', 'aceptada',  1, 7, 'usuario1@example.com', 'usuario3@example.com'),
('2025-02-19 09:00:00', NULL,                  'pendiente', 1, 1, 'usuario1@example.com', 'usuario4@example.com'),
('2025-02-20 15:00:00', '2025-02-20 16:00:00', 'rechazada', 1, 3, 'usuario2@example.com', 'usuario5@example.com'),
('2025-02-21 11:00:00', '2025-02-21 13:00:00', 'aceptada',  1, 4, 'usuario2@example.com', 'usuario6@example.com'),
('2025-02-22 08:00:00', NULL,                  'pendiente', 1, 6, 'usuario1@example.com', 'usuario7@example.com');

-- ============================================================
-- TOKEN QR
-- ============================================================
INSERT INTO token_qr (codigo_hash, generado_en, expira_en, activo, id_entrada) VALUES
('hash_abc123def456', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 0, 1),
('hash_bcd234efg567', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 0, 2),
('hash_cde345fgh678', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 1, 3),
('hash_def456ghi789', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 1, 4),
('hash_efg567hij890', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 1, 5),
('hash_fgh678ijk901', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 1, 8),
('hash_ghi789jkl012', '2025-03-15 19:50:00', '2025-03-15 19:50:30', 1, 9),
-- entrada 12 ya consumida, token inactivo
('hash_hij890klm123', '2025-04-20 15:50:00', '2025-04-20 15:50:30', 0, 12);

-- ============================================================
-- VALIDACION
-- ============================================================
INSERT INTO validacion (fecha_hora, mail_funcionario, identificador_disp, id_entrada, id_token) VALUES
('2025-04-20 16:05:00', 'func3@example.com', 'DISP-F3-001', 12, 8);

SET FOREIGN_KEY_CHECKS = 1;

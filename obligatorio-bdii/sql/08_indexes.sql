-- Mis entradas
CREATE INDEX idx_entrada_propietario
ON entrada(mail_propietario);

-- Entradas por evento
CREATE INDEX idx_entrada_evento
ON entrada(id_evento);

-- Entradas por sector y evento
CREATE INDEX idx_entrada_evento_sector
ON entrada(id_evento, codigo_sector);

-- Historial de transferencias de una entrada
CREATE INDEX idx_transferencia_entrada
ON transferencia(id_entrada);

-- Transferencias pendientes para un usuario
CREATE INDEX idx_transferencia_destino_estado
ON transferencia(mail_destino, estado);

-- Transferencias realizadas por usuario
CREATE INDEX idx_transferencia_origen
ON transferencia(mail_origen);

-- Validaciones por funcionario
CREATE INDEX idx_validacion_funcionario
ON validacion(mail_funcionario);

-- Validaciones por entrada
CREATE INDEX idx_validacion_entrada
ON validacion(id_entrada);

-- Listado y búsqueda por fecha
CREATE INDEX idx_evento_fecha
ON evento(fecha_hora);

-- Consultas por estadio
CREATE INDEX idx_evento_estadio
ON evento(id_estadio);

-- Sectores asignados a funcionarios
CREATE INDEX idx_asignacion_funcionario
ON asignacion(mail_funcionario);

-- Sectores de un evento
CREATE INDEX idx_asignacion_evento
ON asignacion(id_evento);
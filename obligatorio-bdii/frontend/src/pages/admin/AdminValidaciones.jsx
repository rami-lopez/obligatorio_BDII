import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Alert, Chip,
} from '@mui/material';
import { getValidacionesReporte } from '../../api/reportes';

const formatearFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function AdminValidaciones() {
  const [validaciones, setValidaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getValidacionesReporte()
      .then(setValidaciones)
      .catch(() => setError('Error al cargar validaciones'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const validacionesHoy = validaciones.filter(v => {
      const d = new Date(v.fecha_hora);
      return d >= hoy;
    });

    const eventosSet = new Set(validaciones.map(v => v.id_evento));
    const funcionariosSet = new Set(validaciones.map(v => v.mail_funcionario));

    return {
      total: validaciones.length,
      hoy: validacionesHoy.length,
      eventos: eventosSet.size,
      funcionarios: funcionariosSet.size,
    };
  }, [validaciones]);

  const filtradas = validaciones.filter(v => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      v.mail_funcionario.toLowerCase().includes(q) ||
      v.mail_propietario.toLowerCase().includes(q) ||
      v.equipo_local.toLowerCase().includes(q) ||
      (v.equipo_visitante && v.equipo_visitante.toLowerCase().includes(q)) ||
      v.codigo_sector.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando validaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid', borderColor: 'divider',
        px: 3, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontWeight={500} fontSize={15}>Validaciones</Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {/* Stats cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Total validaciones', val: stats.total, sub: 'Histórico' },
            { label: 'Validadas hoy', val: stats.hoy, sub: new Date().toLocaleDateString('es-ES') },
            { label: 'Eventos', val: stats.eventos, sub: 'Con validaciones' },
            { label: 'Funcionarios', val: stats.funcionarios, sub: 'Activos' },
          ].map((s, i) => (
            <Paper key={i} elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
              <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
                {s.label}
              </Typography>
              <Typography fontWeight={500} fontSize={22} mb={0.25}>{s.val}</Typography>
              <Typography fontSize={11} color="text.secondary">{s.sub}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Tabla de validaciones */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography fontWeight={500} fontSize={13}>Historial de validaciones</Typography>
            <TextField
              size="small"
              placeholder="Buscar validación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              sx={{ width: 220, '& .MuiInputBase-input': { fontSize: 13 } }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['Fecha', 'Evento', 'Sector', 'Funcionario', 'Propietario', 'Entrada'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtradas.map(v => (
                  <TableRow
                    key={v.id_validacion}
                    sx={{ '&:hover': { bgcolor: 'background.default' }, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatearFecha(v.fecha_hora)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                      {v.equipo_visitante ? `${v.equipo_local} vs. ${v.equipo_visitante}` : v.equipo_local}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={v.codigo_sector}
                        size="small"
                        sx={{ bgcolor: '#E6F1FB', color: '#185FA5', fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{v.mail_funcionario}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{v.mail_propietario}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>#{v.id_entrada}</TableCell>
                  </TableRow>
                ))}
                {filtradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      {validaciones.length === 0 ? 'No hay validaciones registradas' : 'No se encontraron validaciones'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default AdminValidaciones;

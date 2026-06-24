import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, Chip,
} from '@mui/material';
import { getEventosMasVendidos, getMayoresCompradores } from '../../api/reportes';
import { listarEventos } from '../../api/eventos';

function AdminVentas() {
  const [eventosVendidos, setEventosVendidos] = useState([]);
  const [mayoresCompradores, setMayoresCompradores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getEventosMasVendidos(),
      getMayoresCompradores(),
      listarEventos(),
    ])
      .then(([vendidos, compradores, evts]) => {
        setEventosVendidos(vendidos);
        setMayoresCompradores(compradores);
        setEventos(evts);
      })
      .catch(() => setError('Error al cargar datos de ventas'))
      .finally(() => setLoading(false));
  }, []);

  const totalEntradas = eventosVendidos.reduce((s, e) => s + e.entradas_vendidas, 0);
  const totalEventos = eventosVendidos.length;
  const totalDinero = mayoresCompradores.reduce((s, c) => s + parseFloat(c.dinero_gastado), 0);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando ventas...</Typography>
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
        <Typography fontWeight={500} fontSize={15}>Ventas</Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {/* Stats cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Entradas vendidas', val: totalEntradas, sub: 'Total global' },
            { label: 'Eventos con ventas', val: totalEventos, sub: `De ${eventos.length} eventos` },
            { label: 'Ingresos totales', val: `$${totalDinero.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, sub: 'USD' },
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

        {/* Eventos más vendidos */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
          }}>
            <Typography fontWeight={500} fontSize={13}>Eventos más vendidos</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['#', 'Evento', 'Entradas vendidas', '%'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {eventosVendidos.map((e, i) => {
                  const pct = totalEntradas > 0 ? ((e.entradas_vendidas / totalEntradas) * 100).toFixed(1) : '0';
                  return (
                    <TableRow
                      key={e.id_evento}
                      sx={{ '&:hover': { bgcolor: 'background.default' }, '&:last-child td': { border: 0 } }}
                    >
                      <TableCell sx={{ fontSize: 13, color: 'text.disabled' }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                        {e.equipo_visitante ? `${e.equipo_local} vs. ${e.equipo_visitante}` : e.equipo_local}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{e.entradas_vendidas}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${pct}%`}
                          size="small"
                          sx={{ bgcolor: '#EAF3DE', color: '#27500A', fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {eventosVendidos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      No hay datos de ventas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Mayores compradores */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
          }}>
            <Typography fontWeight={500} fontSize={13}>Mayores compradores</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['#', 'Usuario', 'Entradas compradas', 'Total gastado'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mayoresCompradores.map((c, i) => (
                  <TableRow
                    key={c.mail_usuario}
                    sx={{ '&:hover': { bgcolor: 'background.default' }, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontSize: 13, color: 'text.disabled' }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{c.mail_usuario}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{c.entradas_compradas}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                      ${parseFloat(c.dinero_gastado).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {mayoresCompradores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      No hay compradores registrados
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

export default AdminVentas;

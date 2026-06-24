import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Divider, Paper, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stepper, Step, StepLabel, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getVenta, confirmarPago, anularPago } from '../../api/compras';

const ESTADO_COLOR = {
  pendiente: { bg: '#FAEEDA', color: '#633806' },
  confirmada: { bg: '#EAF3DE', color: '#27500A' },
  activa: { bg: '#EAF3DE', color: '#27500A' },
  anulada: { bg: '#FDECEA', color: '#9A1F0A' },
};

function EstadoChip({ estado }) {
  const c = ESTADO_COLOR[estado] || { bg: '#F5F5F5', color: '#757575' };
  return (
    <Chip
      label={estado}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500, textTransform: 'capitalize' }}
    />
  );
}

function PasarelaPago() {
  const { idVenta } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { evento, sector, cantidad } = location.state || {};

  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!idVenta) { navigate('/'); return; }
    getVenta(idVenta)
      .then(setVenta)
      .catch(err => {
        const detail = err?.response?.data?.detail || 'Error al cargar la venta';
        setError(detail);
      })
      .finally(() => setLoading(false));
  }, [idVenta, navigate]);

  const handleConfirmar = async () => {
    setAccionando(true);
    setError('');
    try {
      const res = await confirmarPago(parseInt(idVenta));
      setVenta(prev => ({
        ...prev,
        estado: res.estado_venta,
        entradas: prev.entradas.map(e => ({ ...e, estado: res.estado_entradas })),
      }));
      setResultado('confirmado');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al confirmar pago');
    } finally {
      setAccionando(false);
    }
  };

  const handleAnular = async () => {
    setAccionando(true);
    setError('');
    try {
      const res = await anularPago(parseInt(idVenta));
      setVenta(prev => ({
        ...prev,
        estado: res.estado_venta,
        entradas: prev.entradas.map(e => ({ ...e, estado: res.estado_entradas })),
      }));
      setResultado('anulado');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al anular pago');
    } finally {
      setAccionando(false);
    }
  };

  const stepIndex = resultado === 'confirmado' ? 2 : resultado === 'anulado' ? 2 : 1;

  const titulo = evento
    ? (evento.equipo_visitante ? `${evento.equipo_local} vs. ${evento.equipo_visitante}` : evento.equipo_local)
    : (venta?.id_venta ? `Venta #${venta.id_venta}` : '');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      <Stepper activeStep={stepIndex} sx={{ mb: 3 }}>
        {['Reservar entradas', 'Pasarela de pago', 'Finalizado'].map(label => (
          <Step key={label}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': { fontSize: 13 },
                '& .MuiStepIcon-root.Mui-completed': { color: 'primary.main' },
                '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography fontWeight={500} fontSize={14}>Pasarela de pago simulada</Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Resumen */}
          {evento && (
            <Stack gap={1} mb={2}>
              <Typography fontWeight={500} fontSize={15}>{titulo}</Typography>
              <Typography fontSize={13} color="text.secondary">
                {evento.fecha_hora && new Date(evento.fecha_hora).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })} hs
              </Typography>
            </Stack>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Estado actual */}
          {venta && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography fontSize={13} color="text.secondary">Venta #{venta.id_venta}</Typography>
                <EstadoChip estado={venta.estado} />
              </Stack>

              <Stack direction="row" justifyContent="space-between" mb={1.5}>
                <Typography fontSize={13} color="text.secondary">Entradas</Typography>
                <Typography fontSize={13} fontWeight={500}>{venta.cantidad}</Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography fontSize={13} color="text.secondary">Total</Typography>
                <Typography fontSize={16} fontWeight={500}>USD {venta.monto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Stack>

              {/* Tabla de entradas */}
              <Typography fontSize={12} fontWeight={500} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
                Entradas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      {['#', 'Sector', 'Estado'].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {venta.entradas.map((e, i) => (
                      <TableRow key={e.id_entrada} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>#{e.id_entrada}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{e.codigo_sector}</TableCell>
                        <TableCell><EstadoChip estado={e.estado} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {error && <Alert severity="error" sx={{ mt: 2, fontSize: 13 }}>{error}</Alert>}

          {/* Acciones */}
          {!resultado && venta?.estado === 'pendiente' && (
            <Stack direction="row" gap={2} mt={3} justifyContent="center">
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={handleConfirmar}
                disabled={accionando}
                sx={{ px: 4, py: 1.25, fontSize: 14 }}
              >
                {accionando ? 'Procesando...' : 'Confirmar pago'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={handleAnular}
                disabled={accionando}
                sx={{ px: 4, py: 1.25, fontSize: 14 }}
              >
                {accionando ? 'Procesando...' : 'Rechazar pago'}
              </Button>
            </Stack>
          )}

          {/* Resultado */}
          {resultado === 'confirmado' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 28, color: '#3B6D11' }} />
              </Box>
              <Typography fontWeight={500} fontSize={18} mb={0.5}>¡Pago confirmado!</Typography>
              <Typography fontSize={13} color="text.secondary" mb={2}>
                Las entradas ahora están activas. Podés verlas en "Mis entradas".
              </Typography>
              <Stack direction="row" gap={1.5} justifyContent="center">
                <Button variant="contained" onClick={() => navigate('/mis-entradas')} sx={{ px: 3 }}>
                  Ver mis entradas
                </Button>
                <Button variant="outlined" onClick={() => navigate('/')} sx={{ px: 3 }}>
                  Volver al catálogo
                </Button>
              </Stack>
            </Box>
          )}

          {resultado === 'anulado' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <CancelIcon sx={{ fontSize: 28, color: '#9A1F0A' }} />
              </Box>
              <Typography fontWeight={500} fontSize={18} mb={0.5}>Pago rechazado</Typography>
              <Typography fontSize={13} color="text.secondary" mb={2}>
                La compra fue anulada. Las entradas quedaron marcadas como anuladas.
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/')} sx={{ px: 3 }}>
                Volver al catálogo
              </Button>
            </Box>
          )}

          {venta?.estado !== 'pendiente' && !resultado && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography fontSize={13} color="text.secondary" mb={2}>
                Esta venta ya fue procesada.
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/mis-entradas')} sx={{ px: 3 }}>
                Ver mis entradas
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Button
        startIcon={<ArrowBackIcon />}
        size="small"
        onClick={() => navigate(-1)}
        sx={{ fontSize: 12, color: 'text.secondary' }}
      >
        Volver
      </Button>
    </Box>
  );
}

export default PasarelaPago;

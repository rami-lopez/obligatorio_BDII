import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, Tabs, Tab,
  Divider, Collapse, Alert, CircularProgress,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { AuthContext } from '../../context/AuthContext';
import { listarTransferencias, getPendientes, aceptarTransferencia, rechazarTransferencia } from '../../api/transferencias';

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: '#FAEEDA', color: '#633806', icon: <AccessTimeIcon sx={{ fontSize: 12 }} /> },
  aceptada:   { label: 'Aceptada',   bg: '#EAF3DE', color: '#27500A', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
  rechazada:  { label: 'Rechazada',  bg: '#FCEBEB', color: '#791F1F', icon: <CancelIcon sx={{ fontSize: 12 }} /> },
};

function formatearFecha(fecha_hora) {
  if (!fecha_hora) return '';
  return new Date(fecha_hora).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function EstadoPill({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  return (
    <Chip
      icon={c.icon}
      label={c.label}
      size="small"
      sx={{
        bgcolor: c.bg, color: c.color,
        fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500,
        '& .MuiChip-icon': { color: c.color },
      }}
    />
  );
}

function TransferItem({ item, tipo, onAceptar, onRechazar, loading }) {
  const esRecibida = tipo === 'recibida';
  const esPendiente = item.estado === 'pendiente';

  const titulo = item.equipo_visitante
    ? `${item.equipo_local} vs. ${item.equipo_visitante}`
    : item.equipo_local;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        transition: 'all 0.18s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
          borderColor: '#B9D7EF',
        },
      }}
    >
      <Box
        sx={{
          px: 1.75,
          py: 1.5,
          borderLeft: '4px solid',
          borderColor:
            item.estado === 'pendiente'
              ? '#C88719'
              : item.estado === 'aceptada'
                ? '#3B6D11'
                : '#E24B4A',
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} fontSize={15} lineHeight={1.25} mb={0.75}>
              {titulo}
            </Typography>

            <Stack gap={0.45}>
              <Typography
                fontSize={12}
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <PlaceIcon sx={{ fontSize: 14 }} />
                Sector {item.codigo_sector} · {item.estadio}
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <CalendarTodayIcon sx={{ fontSize: 13 }} />
                {formatearFecha(item.fecha_hora)}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ flexShrink: 0 }}>
            <EstadoPill estado={item.estado} />
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 1.25,
            px: 1.25,
            py: 0.85,
            borderRadius: 1.5,
            bgcolor: '#F8FAFC',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontSize={12} color="text.secondary">
            {esRecibida ? 'De' : 'Para'}
          </Typography>

          <Typography fontSize={13} fontWeight={600} sx={{ wordBreak: 'break-word' }}>
            {esRecibida ? item.mail_origen : item.mail_destino}
          </Typography>

          <Typography fontSize={11.5} color="text.disabled" mt={0.25}>
            Solicitada el {formatearFecha(item.fecha_solicitud)}
          </Typography>
        </Box>
      </Box>

      {esRecibida && esPendiente && (
        <>
          <Divider />

          <Stack direction="row" gap={1} p={1.5}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              disabled={loading}
              startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              onClick={() => onAceptar(item.id_transferencia)}
              sx={{
                fontSize: 12,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: '#3B6D11',
                '&:hover': { bgcolor: '#27500A' },
              }}
            >
              Aceptar entrada
            </Button>

            <Button
              variant="outlined"
              size="small"
              fullWidth
              disabled={loading}
              startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
              onClick={() => onRechazar(item.id_transferencia)}
              sx={{
                fontSize: 12,
                py: 0.75,
                borderRadius: 1.5,
                color: '#791F1F',
                borderColor: '#F5B8B8',
                '&:hover': {
                  bgcolor: '#FCEBEB',
                  borderColor: '#E24B4A',
                },
              }}
            >
              Rechazar
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

function Transferencias() {
  const navigate = useNavigate();
  const { user, perfil } = useContext(AuthContext);
  const [tab, setTab] = useState(0);
  const [todas, setTodas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertas, setAlertas] = useState([]);

  const mostrarAlerta = (msg, severity) => {
    const id = Date.now();
    setAlertas(prev => [...prev, { id, msg, severity }]);
    setTimeout(() => setAlertas(prev => prev.filter(a => a.id !== id)), 4000);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const historial = await listarTransferencias();
      setTodas(historial);
    } catch {
      mostrarAlerta('Error al cargar transferencias', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const mailActual = (perfil?.mail || user?.email || '').toLowerCase();

  const recibidas = todas.filter(t => (t.mail_destino || '').toLowerCase() === mailActual);
  const enviadas = todas.filter(t => (t.mail_origen || '').toLowerCase() === mailActual);

  const recibidasPendientes = recibidas.filter(t => t.estado === 'pendiente');
  const recibidasHistorial = recibidas.filter(t => t.estado !== 'pendiente');
  const enviadasPendientes  = enviadas.filter(t => t.estado === 'pendiente');
  const enviadasHistorial   = enviadas.filter(t => t.estado !== 'pendiente');

  const handleAceptar = async (transferId) => {
    setActionLoading(true);
    try {
      await aceptarTransferencia(transferId);
      await cargarDatos();
      mostrarAlerta('Entrada aceptada. Ya aparece en Mis entradas.', 'success');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al aceptar';
      mostrarAlerta(detail, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async (transferId) => {
    setActionLoading(true);
    try {
      await rechazarTransferencia(transferId);
      await cargarDatos();
      mostrarAlerta('Transferencia rechazada.', 'info');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al rechazar';
      mostrarAlerta(detail, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>

      <Stack gap={1} sx={{ position: 'fixed', top: 72, right: 16, zIndex: 1400, width: 320 }}>
        {alertas.map(a => (
          <Collapse key={a.id} in>
            <Alert severity={a.severity} elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', fontSize: 13 }}>
              {a.msg}
            </Alert>
          </Collapse>
        ))}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
        <Typography fontWeight={500} fontSize={18}>Transferencias</Typography>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: '0.5px solid', borderColor: 'divider', mb: 2.5,
          '& .MuiTab-root': { fontSize: 13, textTransform: 'none', minHeight: 40, px: 2 },
          '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
        }}
      >
        <Tab
          label={
            <Stack direction="row" alignItems="center" gap={0.75}>
              Recibidas
              {recibidasPendientes.length > 0 && (
                <Chip
                  label={recibidasPendientes.length}
                  size="small"
                  sx={{ bgcolor: '#E24B4A', color: '#fff', fontSize: 10, height: 16, minWidth: 16, borderRadius: 1 }}
                />
              )}
            </Stack>
          }
        />
        <Tab label="Enviadas" />
      </Tabs>

      {tab === 0 && (
        <Stack gap={2.5}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recibidasPendientes.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Pendientes de aceptar
              </Typography>
              <Stack gap={1}>
                {recibidasPendientes.map(t => (
                  <TransferItem
                    key={t.id_transferencia}
                    item={t}
                    tipo="recibida"
                    onAceptar={handleAceptar}
                    onRechazar={handleRechazar}
                    loading={actionLoading}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {!loading && recibidasHistorial.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Historial recibido
              </Typography>
              <Stack gap={1}>
                {recibidasHistorial.map(t => (
                  <TransferItem key={t.id_transferencia} item={t} tipo="recibida" />
                ))}
              </Stack>
            </Box>
          )}

          {!loading && recibidas.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
              <SwapHorizIcon sx={{ fontSize: 36, mb: 1 }} />
              <Typography fontSize={14}>No recibiste ninguna transferencia todavía</Typography>
            </Box>
          )}
        </Stack>
      )}

      {tab === 1 && (
        <Stack gap={2.5}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {enviadasPendientes.length > 0 && (
                <Box>
                  <Typography
                    fontSize={12} fontWeight={500} color="text.secondary"
                    textTransform="uppercase" letterSpacing={0.5} mb={1}
                  >
                    Esperando respuesta
                  </Typography>
                  <Stack gap={1}>
                    {enviadasPendientes.map(t => (
                      <TransferItem key={t.id_transferencia} item={t} tipo="enviada" />
                    ))}
                  </Stack>
                </Box>
              )}

              {enviadasHistorial.length > 0 && (
                <Box>
                  <Typography
                    fontSize={12} fontWeight={500} color="text.secondary"
                    textTransform="uppercase" letterSpacing={0.5} mb={1}
                  >
                    Historial enviado
                  </Typography>
                  <Stack gap={1}>
                    {enviadasHistorial.map(t => (
                      <TransferItem key={t.id_transferencia} item={t} tipo="enviada" />
                    ))}
                  </Stack>
                </Box>
              )}

              {enviadas.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                  <SwapHorizIcon sx={{ fontSize: 36, mb: 1 }} />
                  <Typography fontSize={14}>No enviaste ninguna transferencia todavía</Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      )}

    </Box>
  );
}

export default Transferencias;
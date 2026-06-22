import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, Tabs, Tab,
  Divider, Collapse, Alert,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { getPendientes, aceptarTransferencia, rechazarTransferencia } from '../../api/transferencias';
import { getEntrada } from '../../api/entradas';

// Mock historial recibido — no existe endpoint que devuelva historial completo
const MOCK_HISTORIAL_RECIBIDAS = [
  {
    id: 'hist-01', estado: 'aceptada',
    de: 'Ana P.', deEmail: 'ana@email.com',
    evento: 'Francia vs. Polonia', estadio: 'BC Place', ciudad: 'Vancouver',
    sector: 'Tribuna Norte', tipo: 'General', fecha: '20 jun 2026',
    foto: '', fechaTransferencia: '12 jun 2026', mensaje: '',
  },
];

// Mock enviadas — no existe endpoint para consultar transferencias enviadas
const MOCK_ENVIADAS = [
  {
    id: 'env-01', estado: 'aceptada',
    para: 'Lucía G.', paraEmail: 'lucia@email.com',
    evento: 'Francia vs. Polonia', estadio: 'BC Place', ciudad: 'Vancouver',
    sector: 'Tribuna Norte', tipo: 'General', fecha: '20 jun 2026',
    foto: '', fechaTransferencia: '10 jun 2026',
  },
  {
    id: 'env-02', estado: 'rechazada',
    para: 'Martín R.', paraEmail: 'martin@email.com',
    evento: 'España vs. Alemania', estadio: 'AT&T Stadium', ciudad: 'Dallas',
    sector: 'Tribuna Sur', tipo: 'General', fecha: '18 jun 2026',
    foto: '', fechaTransferencia: '8 jun 2026',
  },
];

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: '#FAEEDA', color: '#633806', icon: <AccessTimeIcon sx={{ fontSize: 12 }} /> },
  aceptada:   { label: 'Aceptada',   bg: '#EAF3DE', color: '#27500A', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
  rechazada:  { label: 'Rechazada',  bg: '#FCEBEB', color: '#791F1F', icon: <CancelIcon sx={{ fontSize: 12 }} /> },
  enviada:    { label: 'Enviada',    bg: '#E6F1FB', color: '#185FA5', icon: <SwapHorizIcon sx={{ fontSize: 12 }} /> },
};

const SECTOR_NOMBRES = {
  norte: 'Tribuna Norte', sur: 'Tribuna Sur',
  este: 'Lateral Este', oeste: 'Lateral Oeste',
  vip_n: 'VIP Norte', vip_s: 'VIP Sur',
};

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

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      border: '0.5px solid', borderColor: 'divider',
      borderRadius: 2, overflow: 'hidden',
    }}>
      <Stack direction="row" alignItems="center" gap={1.5} p={1.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={500} fontSize={14} noWrap mb={0.25}>
            {item.evento}
          </Typography>
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.3}>
              <PlaceIcon sx={{ fontSize: 12 }} />{item.sector}
            </Typography>
            <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.3}>
              <CalendarTodayIcon sx={{ fontSize: 11 }} />{item.fecha}
            </Typography>
          </Stack>
          <Typography fontSize={11} color="text.disabled" mt={0.25}>
            {esRecibida ? `De: ${item.de}` : `Para: ${item.para}`}
            {' · '}{item.fechaTransferencia}
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
          <EstadoPill estado={item.estado} />
        </Box>
      </Stack>

      {esRecibida && esPendiente && (
        <>
          <Divider />
          <Stack direction="row" gap={1} p={1.5} pt={1.25}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              disabled={loading}
              startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              onClick={() => onAceptar(item.id)}
              sx={{
                fontSize: 12, py: 0.75,
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
              onClick={() => onRechazar(item.id)}
              sx={{
                fontSize: 12, py: 0.75,
                color: '#791F1F', borderColor: '#F5B8B8',
                '&:hover': { bgcolor: '#FCEBEB', borderColor: '#E24B4A' },
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
  const [tab, setTab] = useState(0);
  const [pendientes, setPendientes] = useState([]);
  const [enviadas] = useState(MOCK_ENVIADAS);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertas, setAlertas] = useState([]);

  const mostrarAlerta = (msg, severity) => {
    const id = Date.now();
    setAlertas(prev => [...prev, { id, msg, severity }]);
    setTimeout(() => setAlertas(prev => prev.filter(a => a.id !== id)), 4000);
  };

  const cargarPendientes = useCallback(async () => {
    setLoading(true);
    try {
      const transfers = await getPendientes();
      const enriched = await Promise.all(
        transfers.map(async (t) => {
          try {
            const entrada = await getEntrada(t.id_entrada);
            const titulo = entrada.equipo_visitante
              ? `${entrada.equipo_local} vs. ${entrada.equipo_visitante}`
              : entrada.equipo_local;
            const fechaStr = new Date(entrada.fecha_hora).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            return {
              id: t.id_transferencia,
              estado: 'pendiente',
              de: t.mail_origen,
              deEmail: t.mail_origen,
              evento: titulo,
              estadio: entrada.estadio,
              sector: SECTOR_NOMBRES[entrada.codigo_sector] || entrada.codigo_sector,
              fecha: fechaStr,
              fechaTransferencia: new Date(t.fecha_solicitud).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short', year: 'numeric',
              }),
            };
          } catch {
            return {
              id: t.id_transferencia,
              estado: 'pendiente',
              de: t.mail_origen,
              deEmail: t.mail_origen,
              evento: `Entrada #${t.id_entrada}`,
              sector: '',
              fecha: '',
              fechaTransferencia: new Date(t.fecha_solicitud).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short', year: 'numeric',
              }),
            };
          }
        })
      );
      setPendientes(enriched);
    } catch {
      mostrarAlerta('Error al cargar transferencias', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
    const interval = setInterval(cargarPendientes, 30000);
    return () => clearInterval(interval);
  }, [cargarPendientes]);

  const pendientesCount = pendientes.length;

  const handleAceptar = async (transferId) => {
    setActionLoading(true);
    try {
      await aceptarTransferencia(transferId);
      setPendientes(prev => prev.filter(t => t.id !== transferId));
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
      setPendientes(prev => prev.filter(t => t.id !== transferId));
      mostrarAlerta('Transferencia rechazada.', 'info');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al rechazar';
      mostrarAlerta(detail, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const historialRecibidas  = MOCK_HISTORIAL_RECIBIDAS;
  const pendientesEnviadas  = enviadas.filter(t => t.estado === 'pendiente');
  const historialEnviadas   = enviadas.filter(t => t.estado !== 'pendiente');

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>

      {/* Alertas flotantes */}
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
        <Button
          variant="outlined"
          size="small"
          startIcon={<ConfirmationNumberIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/mis-entradas')}
          sx={{ fontSize: 12 }}
        >
          Ir a Mis entradas
        </Button>
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
              {pendientesCount > 0 && (
                <Chip
                  label={pendientesCount}
                  size="small"
                  sx={{ bgcolor: '#E24B4A', color: '#fff', fontSize: 10, height: 16, minWidth: 16, borderRadius: 1 }}
                />
              )}
            </Stack>
          }
        />
        <Tab label="Enviadas" />
      </Tabs>

      {/* Tab recibidas */}
      {tab === 0 && (
        <Stack gap={2.5}>
          {pendientes.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Pendientes de aceptar
              </Typography>
              <Stack gap={1}>
                {pendientes.map(t => (
                  <TransferItem
                    key={t.id}
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

          {loading && pendientes.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
              <Typography fontSize={14}>Cargando...</Typography>
            </Box>
          )}

          {!loading && pendientes.length === 0 && historialRecibidas.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
              <SwapHorizIcon sx={{ fontSize: 36, mb: 1 }} />
              <Typography fontSize={14}>No recibiste ninguna transferencia todavía</Typography>
            </Box>
          )}

          {!loading && historialRecibidas.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Historial recibido
              </Typography>
              <Typography fontSize={12} color="text.disabled" mb={1} fontStyle="italic">
                (No hay endpoint de historial — datos de ejemplo)
              </Typography>
              <Stack gap={1}>
                {historialRecibidas.map(t => (
                  <TransferItem key={t.id} item={t} tipo="recibida" />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {/* Tab enviadas */}
      {tab === 1 && (
        <Stack gap={2.5}>
          <Typography fontSize={12} color="text.disabled" mb={1} fontStyle="italic">
            (No hay endpoint para consultar transferencias enviadas — datos de ejemplo)
          </Typography>

          {pendientesEnviadas.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Esperando respuesta
              </Typography>
              <Stack gap={1}>
                {pendientesEnviadas.map(t => (
                  <TransferItem key={t.id} item={t} tipo="enviada" />
                ))}
              </Stack>
            </Box>
          )}

          {historialEnviadas.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Historial enviado
              </Typography>
              <Stack gap={1}>
                {historialEnviadas.map(t => (
                  <TransferItem key={t.id} item={t} tipo="enviada" />
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
        </Stack>
      )}

    </Box>
  );
}

export default Transferencias;
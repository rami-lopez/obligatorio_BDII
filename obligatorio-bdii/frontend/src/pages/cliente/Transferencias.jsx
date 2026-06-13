import React, { useState, useEffect } from 'react';
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

// Mock — reemplazar con fetch a /api/transferencias
const MOCK_RECIBIDAS = [
  {
    id: 'T001',
    estado: 'pendiente',
    de: 'Carlos M.',
    deEmail: 'carlos@email.com',
    evento: 'Brasil vs. Uruguay',
    estadio: 'MetLife Stadium',
    ciudad: 'Nueva York',
    sector: 'Lateral Este',
    tipo: 'Preferencial',
    fecha: '1 jul 2026',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/MetLife_Stadium_-_aerial_crop.jpg/800px-MetLife_Stadium_-_aerial_crop.jpg',
    fechaTransferencia: 'Hace 5 min',
    mensaje: '¡Que la disfrutes!',
  },
  {
    id: 'T002',
    estado: 'aceptada',
    de: 'Ana P.',
    deEmail: 'ana@email.com',
    evento: 'Francia vs. Polonia',
    estadio: 'BC Place',
    ciudad: 'Vancouver',
    sector: 'Tribuna Norte',
    tipo: 'General',
    fecha: '20 jun 2026',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BC_Place_Vancouver_2011.jpg/800px-BC_Place_Vancouver_2011.jpg',
    fechaTransferencia: '12 jun 2026',
    mensaje: '',
  },
];

const MOCK_ENVIADAS = [
  {
    id: 'T003',
    estado: 'aceptada',
    para: 'Lucía G.',
    paraEmail: 'lucia@email.com',
    evento: 'Francia vs. Polonia',
    estadio: 'BC Place',
    ciudad: 'Vancouver',
    sector: 'Tribuna Norte',
    tipo: 'General',
    fecha: '20 jun 2026',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BC_Place_Vancouver_2011.jpg/800px-BC_Place_Vancouver_2011.jpg',
    fechaTransferencia: '10 jun 2026',
  },
  {
    id: 'T004',
    estado: 'rechazada',
    para: 'Martín R.',
    paraEmail: 'martin@email.com',
    evento: 'España vs. Alemania',
    estadio: 'AT&T Stadium',
    ciudad: 'Dallas',
    sector: 'Tribuna Sur',
    tipo: 'General',
    fecha: '18 jun 2026',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AT%26T_Stadium_-_Interior_2013.jpg/800px-AT%26T_Stadium_-_Interior_2013.jpg',
    fechaTransferencia: '8 jun 2026',
  },
  {
    id: 'T005',
    estado: 'pendiente',
    para: 'Diego F.',
    paraEmail: 'diego@email.com',
    evento: 'Argentina vs. México',
    estadio: 'Estadio Azteca',
    ciudad: 'Ciudad de México',
    sector: 'Tribuna Norte',
    tipo: 'General',
    fecha: '14 jun 2026',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Estadio_Azteca_2015.jpg/800px-Estadio_Azteca_2015.jpg',
    fechaTransferencia: 'Hace 2 horas',
  },
];

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: '#FAEEDA', color: '#633806', icon: <AccessTimeIcon sx={{ fontSize: 12 }} /> },
  aceptada:   { label: 'Aceptada',   bg: '#EAF3DE', color: '#27500A', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
  rechazada:  { label: 'Rechazada',  bg: '#FCEBEB', color: '#791F1F', icon: <CancelIcon sx={{ fontSize: 12 }} /> },
  enviada:    { label: 'Enviada',    bg: '#E6F1FB', color: '#185FA5', icon: <SwapHorizIcon sx={{ fontSize: 12 }} /> },
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

function TransferItem({ item, tipo, onAceptar, onRechazar }) {
  const esRecibida = tipo === 'recibida';
  const esPendiente = item.estado === 'pendiente';

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      border: '0.5px solid', borderColor: 'divider',
      borderRadius: 2, overflow: 'hidden',
    }}>
      <Stack direction="row" alignItems="center" gap={1.5} p={1.5}>
        <Box
          component="img"
          src={item.foto}
          alt={item.estadio}
          sx={{ width: 56, height: 42, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
        />

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

      {/* Mensaje si existe */}
      {item.mensaje && (
        <>
          <Divider />
          <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.default' }}>
            <Typography fontSize={12} color="text.secondary" fontStyle="italic">
              "{item.mensaje}"
            </Typography>
          </Box>
        </>
      )}

      {/* Acciones para pendientes recibidas */}
      {esRecibida && esPendiente && (
        <>
          <Divider />
          <Stack direction="row" gap={1} p={1.5} pt={1.25}>
            <Button
              variant="contained"
              size="small"
              fullWidth
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
  const [recibidas, setRecibidas] = useState(MOCK_RECIBIDAS);
  const [enviadas] = useState(MOCK_ENVIADAS);
  const [alertas, setAlertas] = useState([]);

  // Reemplazar con fetch a /api/transferencias y polling cada 30s
  useEffect(() => {
    setRecibidas(MOCK_RECIBIDAS);
  }, []);

  const pendientesCount = recibidas.filter(t => t.estado === 'pendiente').length;

  const mostrarAlerta = (msg, severity) => {
    const id = Date.now();
    setAlertas(prev => [...prev, { id, msg, severity }]);
    setTimeout(() => setAlertas(prev => prev.filter(a => a.id !== id)), 4000);
  };

  const handleAceptar = (transferId) => {
    // Reemplazar con: fetch(`/api/transferencias/${transferId}/aceptar`, { method: 'POST' })
    setRecibidas(prev =>
      prev.map(t => t.id === transferId ? { ...t, estado: 'aceptada' } : t)
    );
    mostrarAlerta('Entrada aceptada. Ya aparece en Mis entradas.', 'success');
  };

  const handleRechazar = (transferId) => {
    // Reemplazar con: fetch(`/api/transferencias/${transferId}/rechazar`, { method: 'POST' })
    setRecibidas(prev =>
      prev.map(t => t.id === transferId ? { ...t, estado: 'rechazada' } : t)
    );
    mostrarAlerta('Transferencia rechazada.', 'info');
  };

  const pendientesRecibidas = recibidas.filter(t => t.estado === 'pendiente');
  const historialRecibidas  = recibidas.filter(t => t.estado !== 'pendiente');
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
          {pendientesRecibidas.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Pendientes de aceptar
              </Typography>
              <Stack gap={1}>
                {pendientesRecibidas.map(t => (
                  <TransferItem
                    key={t.id}
                    item={t}
                    tipo="recibida"
                    onAceptar={handleAceptar}
                    onRechazar={handleRechazar}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {historialRecibidas.length > 0 && (
            <Box>
              <Typography
                fontSize={12} fontWeight={500} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1}
              >
                Historial recibido
              </Typography>
              <Stack gap={1}>
                {historialRecibidas.map(t => (
                  <TransferItem key={t.id} item={t} tipo="recibida" />
                ))}
              </Stack>
            </Box>
          )}

          {recibidas.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
              <SwapHorizIcon sx={{ fontSize: 36, mb: 1 }} />
              <Typography fontSize={14}>No recibiste ninguna transferencia todavía</Typography>
            </Box>
          )}
        </Stack>
      )}

      {/* Tab enviadas */}
      {tab === 1 && (
        <Stack gap={2.5}>
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
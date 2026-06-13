import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, LinearProgress, Divider,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const QR_SEGUNDOS = 30;
const MAX_TRANSFERENCIAS = 3;

// Mock — reemplazar con fetch a /api/entradas/mis-entradas
const MOCK_ENTRADAS_ACTIVAS = [
  {
    id: 'E001',
    evento: 'Argentina vs. México',
    estadio: 'Estadio Azteca',
    ciudad: 'Ciudad de México',
    fecha: '14 jun 2026',
    hora: '20:00',
    sector: 'Tribuna Norte',
    tipo: 'General',
    numero: 'A-00421',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Estadio_Azteca_2015.jpg/800px-Estadio_Azteca_2015.jpg',
    transferencias: 0,
  },
  {
    id: 'E002',
    evento: 'Argentina vs. México',
    estadio: 'Estadio Azteca',
    ciudad: 'Ciudad de México',
    fecha: '14 jun 2026',
    hora: '20:00',
    sector: 'Tribuna Norte',
    tipo: 'General',
    numero: 'A-00422',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Estadio_Azteca_2015.jpg/800px-Estadio_Azteca_2015.jpg',
    transferencias: 1,
  },
  {
    id: 'E003',
    evento: 'Brasil vs. Uruguay',
    estadio: 'MetLife Stadium',
    ciudad: 'Nueva York',
    fecha: '1 jul 2026',
    hora: '18:00',
    sector: 'Lateral Este',
    tipo: 'Preferencial',
    numero: 'B-00104',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/MetLife_Stadium_-_aerial_crop.jpg/800px-MetLife_Stadium_-_aerial_crop.jpg',
    transferencias: 2,
  },
];

const MOCK_ENTRADAS_HISTORIAL = [
  {
    id: 'E004',
    evento: 'España vs. Alemania',
    estadio: 'AT&T Stadium',
    ciudad: 'Dallas',
    fecha: '18 jun 2026',
    sector: 'Tribuna Sur',
    tipo: 'General',
    numero: 'C-00098',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AT%26T_Stadium_-_Interior_2013.jpg/800px-AT%26T_Stadium_-_Interior_2013.jpg',
    estado: 'consumida',
    transferencias: 0,
  },
  {
    id: 'E005',
    evento: 'Francia vs. Polonia',
    estadio: 'BC Place',
    ciudad: 'Vancouver',
    fecha: '20 jun 2026',
    sector: 'Tribuna Norte',
    tipo: 'General',
    numero: 'D-00211',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BC_Place_Vancouver_2011.jpg/800px-BC_Place_Vancouver_2011.jpg',
    estado: 'transferida',
    transferencias: 3,
  },
];

// QR SVG esquemático — en producción se genera con una lib como qrcode.react
function QRCode({ size = 140 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <rect width="140" height="140" fill="transparent" />
      <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="20" y="20" width="30" height="30" rx="2" fill="currentColor" />
      <rect x="80" y="10" width="50" height="50" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="90" y="20" width="30" height="30" rx="2" fill="currentColor" />
      <rect x="10" y="80" width="50" height="50" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="20" y="90" width="30" height="30" rx="2" fill="currentColor" />
      <rect x="80" y="80" width="8" height="8" fill="currentColor" />
      <rect x="92" y="80" width="8" height="8" fill="currentColor" />
      <rect x="104" y="80" width="8" height="8" fill="currentColor" />
      <rect x="116" y="80" width="8" height="8" fill="currentColor" />
      <rect x="80" y="92" width="8" height="8" fill="currentColor" />
      <rect x="104" y="92" width="8" height="8" fill="currentColor" />
      <rect x="80" y="104" width="8" height="8" fill="currentColor" />
      <rect x="92" y="104" width="8" height="8" fill="currentColor" />
      <rect x="116" y="104" width="8" height="8" fill="currentColor" />
      <rect x="80" y="116" width="8" height="8" fill="currentColor" />
      <rect x="104" y="116" width="8" height="8" fill="currentColor" />
      <rect x="116" y="116" width="8" height="8" fill="currentColor" />
      <rect x="68" y="10" width="4" height="4" fill="currentColor" />
      <rect x="68" y="18" width="4" height="8" fill="currentColor" />
      <rect x="68" y="30" width="4" height="4" fill="currentColor" />
      <rect x="68" y="38" width="4" height="16" fill="currentColor" />
      <rect x="68" y="58" width="4" height="4" fill="currentColor" />
      <rect x="68" y="66" width="4" height="8" fill="currentColor" />
    </svg>
  );
}

function EstadoPill({ estado }) {
  const config = {
    activa:      { label: 'Activa',      bg: '#EAF3DE', color: '#27500A', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
    consumida:   { label: 'Consumida',   bg: '#F5F5F5', color: '#757575', icon: <CancelOutlinedIcon sx={{ fontSize: 12 }} /> },
    transferida: { label: 'Transferida', bg: '#FAEEDA', color: '#633806', icon: <SwapHorizIcon sx={{ fontSize: 12 }} /> },
  };
  const c = config[estado] || config.activa;
  return (
    <Chip
      icon={c.icon}
      label={c.label}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500 }}
    />
  );
}

function TransferenciasChip({ cantidad }) {
  const restantes = MAX_TRANSFERENCIAS - cantidad;
  const color = restantes === 0 ? '#633806' : restantes === 1 ? '#854F0B' : '#185FA5';
  const bg    = restantes === 0 ? '#FAEEDA' : restantes === 1 ? '#FDF3E3' : '#E6F1FB';
  return (
    <Chip
      label={`${cantidad}/${MAX_TRANSFERENCIAS} transf.`}
      size="small"
      sx={{ bgcolor: bg, color, fontSize: 10, height: 18, borderRadius: 1 }}
    />
  );
}

// Modal QR con temporizador de regeneración
function ModalQR({ open, entrada, onClose }) {
  const [segundos, setSegundos] = useState(QR_SEGUNDOS);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSegundos(QR_SEGUNDOS);
    intervalRef.current = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          // Aquí iría: fetch('/api/entradas/qr-token', { method: 'POST', body: entrada.id })
          return QR_SEGUNDOS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [open, entrada]);

  if (!entrada) return null;

  const progreso = (segundos / QR_SEGUNDOS) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { border: '0.5px solid', borderColor: 'divider', borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography fontWeight={500} fontSize={15}>Tu entrada</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* QR */}
        <Box sx={{
          bgcolor: 'background.default', borderRadius: 2,
          p: 2, display: 'flex', justifyContent: 'center', mb: 2,
          color: 'text.primary',
        }}>
          <QRCode size={160} />
        </Box>

        {/* Info */}
        <Box textAlign="center" mb={1.5}>
          <Typography fontWeight={500} fontSize={14} mb={0.25}>{entrada.evento}</Typography>
          <Typography fontSize={12} color="text.secondary">
            {entrada.sector} · {entrada.tipo} · Entrada #{entrada.numero}
          </Typography>
        </Box>

        {/* Timer */}
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <RefreshIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography fontSize={12} color="text.disabled" minWidth={120}>
            Se regenera en {segundos}s
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progreso}
            sx={{
              flex: 1, height: 3, borderRadius: 2,
              bgcolor: 'divider',
              '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main', borderRadius: 2 },
            }}
          />
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <Button
          fullWidth
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ fontSize: 13 }}
          onClick={() => {
            // Reemplazar con lógica de descarga real
            console.log('Descargar entrada', entrada.id);
          }}
        >
          Descargar entrada
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Modal de transferencia
function ModalTransferir({ open, entrada, onClose, onEnviada }) {
  const [destinatario, setDestinatario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setDestinatario(''); setMensaje(''); setError(''); }
  }, [open]);

  if (!entrada) return null;

  const restantes = MAX_TRANSFERENCIAS - entrada.transferencias;

  const handleEnviar = () => {
    if (!destinatario.trim()) { setError('Ingresá el email o ID del destinatario'); return; }
    // Reemplazar con: fetch('/api/transferencias', { method: 'POST', body: JSON.stringify({...}) })
    onEnviada(entrada.id, destinatario);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { border: '0.5px solid', borderColor: 'divider', borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography fontWeight={500} fontSize={15}>Transferir entrada</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* Advertencia */}
        <Box sx={{
          bgcolor: '#FAEEDA', border: '0.5px solid #F5C842',
          borderRadius: 1.5, p: 1.5, mb: 2,
          display: 'flex', gap: 1, alignItems: 'flex-start',
        }}>
          <Typography fontSize={12} color="#633806">
            Esta entrada puede transferirse{' '}
            <strong>{restantes} {restantes === 1 ? 'vez más' : 'veces más'}</strong>{' '}
            ({entrada.transferencias}/{MAX_TRANSFERENCIAS} usadas).
            Una vez aceptada la transferencia, el cambio es irreversible.
          </Typography>
        </Box>

        <Stack gap={1.5}>
          <TextField
            label="Email o ID del destinatario"
            size="small"
            fullWidth
            value={destinatario}
            onChange={e => { setDestinatario(e.target.value); setError(''); }}
            error={!!error}
            helperText={error}
            placeholder="usuario@email.com"
          />
          <TextField
            label="Mensaje opcional"
            size="small"
            fullWidth
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Ej: ¡Disfrutala!"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontSize: 13 }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleEnviar}
          disabled={restantes === 0}
          startIcon={<SendIcon />}
          sx={{ fontSize: 13 }}
        >
          Enviar solicitud
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EntradaCard({ entrada, activa, onVerQR, onTransferir }) {
  return (
    <Box sx={{
      border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
      overflow: 'hidden', bgcolor: 'background.paper',
      opacity: activa ? 1 : 0.65,
    }}>
      <Box
        component="img"
        src={entrada.foto}
        alt={entrada.estadio}
        sx={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
      />
      <Box sx={{ p: '10px 12px' }}>
        <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
          <EstadoPill estado={activa ? 'activa' : entrada.estado} />
          {activa && <TransferenciasChip cantidad={entrada.transferencias} />}
        </Stack>

        <Typography fontWeight={500} fontSize={13} mb={0.5}>{entrada.evento}</Typography>
        <Stack gap={0.25} mb={1}>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <PlaceIcon sx={{ fontSize: 12 }} />{entrada.sector} · {entrada.tipo}
          </Typography>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <CalendarTodayIcon sx={{ fontSize: 11 }} />{entrada.fecha}{entrada.hora ? ` · ${entrada.hora} hs` : ''}
          </Typography>
        </Stack>

        {activa ? (
          <Stack direction="row" gap={1}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<QrCodeIcon sx={{ fontSize: 14 }} />}
              onClick={() => onVerQR(entrada)}
              sx={{ fontSize: 12, py: 0.6 }}
            >
              Ver QR
            </Button>
            <Button
              size="small"
              fullWidth
              startIcon={<SendIcon sx={{ fontSize: 13 }} />}
              onClick={() => onTransferir(entrada)}
              disabled={entrada.transferencias >= MAX_TRANSFERENCIAS}
              sx={{
                fontSize: 12, py: 0.6,
                border: '0.5px solid #378ADD', color: '#185FA5',
                '&:hover': { bgcolor: '#E6F1FB' },
                '&.Mui-disabled': { border: '0.5px solid', borderColor: 'divider' },
              }}
            >
              Transferir
            </Button>
          </Stack>
        ) : (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            disabled
            startIcon={<QrCodeIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: 12, py: 0.6 }}
          >
            {entrada.estado === 'consumida' ? 'QR inválido' : 'Transferida'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

function MisEntradas() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [entradasActivas, setEntradasActivas] = useState(MOCK_ENTRADAS_ACTIVAS);
  const [entradasHistorial] = useState(MOCK_ENTRADAS_HISTORIAL);

  const [modalQR, setModalQR] = useState({ open: false, entrada: null });
  const [modalTransferir, setModalTransferir] = useState({ open: false, entrada: null });

  // Reemplazar con fetch a /api/entradas/mis-entradas
  useEffect(() => {
    setEntradasActivas(MOCK_ENTRADAS_ACTIVAS);
  }, []);

  const handleTransferenciaEnviada = (entradaId, destinatario) => {
    // Actualiza el contador local — en producción el backend devuelve el estado actualizado
    setEntradasActivas(prev =>
      prev.map(e =>
        e.id === entradaId
          ? { ...e, transferencias: e.transferencias + 1 }
          : e
      )
    );
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      <Typography fontWeight={500} fontSize={18} mb={2.5}>Mis entradas</Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: '0.5px solid', borderColor: 'divider', mb: 2.5,
          '& .MuiTab-root': { fontSize: 13, textTransform: 'none', minHeight: 40, px: 2 },
          '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
        }}
      >
        <Tab label={`Activas (${entradasActivas.length})`} />
        <Tab label="Historial" />
      </Tabs>

      {tab === 0 && (
        entradasActivas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <QrCodeIcon sx={{ fontSize: 36, mb: 1 }} />
            <Typography fontSize={14}>No tenés entradas activas</Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, fontSize: 13 }}
              onClick={() => navigate('/')}
            >
              Ver eventos disponibles
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.75 }}>
            {entradasActivas.map(e => (
              <EntradaCard
                key={e.id}
                entrada={e}
                activa
                onVerQR={entrada => setModalQR({ open: true, entrada })}
                onTransferir={entrada => setModalTransferir({ open: true, entrada })}
              />
            ))}
          </Box>
        )
      )}

      {tab === 1 && (
        entradasHistorial.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <Typography fontSize={14}>Sin historial de entradas</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.75 }}>
            {entradasHistorial.map(e => (
              <EntradaCard key={e.id} entrada={e} activa={false} />
            ))}
          </Box>
        )
      )}

      <ModalQR
        open={modalQR.open}
        entrada={modalQR.entrada}
        onClose={() => setModalQR({ open: false, entrada: null })}
      />

      <ModalTransferir
        open={modalTransferir.open}
        entrada={modalTransferir.entrada}
        onClose={() => setModalTransferir({ open: false, entrada: null })}
        onEnviada={handleTransferenciaEnviada}
      />
    </Box>
  );
}

export default MisEntradas;
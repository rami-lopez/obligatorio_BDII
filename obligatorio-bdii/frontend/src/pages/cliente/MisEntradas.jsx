import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, LinearProgress, Divider, CircularProgress,
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
import { listarEntradas, getQR } from '../../api/entradas';
import { crearTransferencia } from '../../api/transferencias';

const QR_SEGUNDOS = 30;
const MAX_TRANSFERENCIAS = 3;

function formatearFecha(fecha_hora) {
  if (!fecha_hora) return { fecha: '', hora: '' };
  const d = new Date(fecha_hora);
  return {
    fecha: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

function QRCode({ hash, size = 140 }) {
  return (
    <Stack spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
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

      <Box sx={{ textAlign: 'center' }}>
        <Typography fontSize={11} color="text.secondary" mb={0.5} textTransform="uppercase" letterSpacing={0.6}>
          Hash TOTP
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 1.5,
            wordBreak: 'break-word',
            lineHeight: 1.3,
          }}
        >
          {hash || 'Generando...'}
        </Typography>
      </Box>
    </Stack>
  );
}

function EstadoPill({ estado }) {
  const config = {
    activa:      { label: 'Activa',      bg: '#EAF3DE', color: '#27500A', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
    consumida:   { label: 'Consumida',   bg: '#F5F5F5', color: '#757575', icon: <CancelOutlinedIcon sx={{ fontSize: 12 }} /> },
    transferida: { label: 'Transferida', bg: '#FAEEDA', color: '#633806', icon: <SwapHorizIcon sx={{ fontSize: 12 }} /> },
    anulada:     { label: 'Anulada',     bg: '#F5F5F5', color: '#757575', icon: <CancelOutlinedIcon sx={{ fontSize: 12 }} /> },
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

function ModalQR({ open, entrada, onClose }) {
  const [hash, setHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [segundos, setSegundos] = useState(QR_SEGUNDOS);
  const intervalRef = useRef(null);

  const cargarQR = useCallback(async () => {
    if (!entrada) return;
    setLoading(true);
    try {
      const data = await getQR(entrada.id_entrada);
      setHash(data.hash_actual);
      setSegundos(data.ttl_restante ?? QR_SEGUNDOS);
    } catch {
      setHash(null);
    } finally {
      setLoading(false);
    }
  }, [entrada]);

  useEffect(() => {
    if (!open) return;

    cargarQR();

    intervalRef.current = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          cargarQR();
          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [open, entrada, cargarQR]);

  if (!entrada) return null;

  const { fecha, hora } = formatearFecha(entrada.fecha_hora);
  const progreso = (segundos / QR_SEGUNDOS) * 100;
  const titulo = entrada.equipo_visitante
    ? `${entrada.equipo_local} vs. ${entrada.equipo_visitante}`
    : entrada.equipo_local;

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
        <Box sx={{
          bgcolor: 'background.default', borderRadius: 2,
          p: 2, display: 'flex', justifyContent: 'center', mb: 2,
          color: 'text.primary',
        }}>
          {loading ? <CircularProgress size={32} /> : <QRCode hash={hash} size={160} />}
        </Box>

        <Box textAlign="center" mb={1.5}>
          <Typography fontWeight={500} fontSize={14} mb={0.25}>{titulo}</Typography>
          <Typography fontSize={12} color="text.secondary">
            {entrada.estadio} · Sector {entrada.codigo_sector}
          </Typography>
          {fecha && (
            <Typography fontSize={12} color="text.secondary">
              {fecha}{hora ? ` · ${hora} hs` : ''}
            </Typography>
          )}
        </Box>

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
            const payload = JSON.stringify({ hash, id_entrada: entrada.id_entrada });
            const blob = new Blob([payload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `entrada-${entrada.id_entrada}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Descargar entrada
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ModalTransferir({ open, entrada, onClose, onEnviada }) {
  const [destinatario, setDestinatario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setDestinatario(''); setMensaje(''); setError(''); }
  }, [open]);

  if (!entrada) return null;

  const restantes = MAX_TRANSFERENCIAS - entrada.transferencias;

  const handleEnviar = async () => {
    if (!destinatario.trim()) { setError('Ingresá el email del destinatario'); return; }
    setLoading(true);
    try {
      await crearTransferencia({ id_entrada: entrada.id_entrada, mail_destino: destinatario.trim() });
      onEnviada(entrada.id_entrada);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al transferir');
    } finally {
      setLoading(false);
    }
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
            label="Email del destinatario"
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
        <Button variant="outlined" onClick={onClose} sx={{ fontSize: 13 }} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleEnviar}
          disabled={restantes === 0 || loading}
          startIcon={<SendIcon />}
          sx={{ fontSize: 13 }}
        >
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EntradaCard({ entrada, activa, onVerQR, onTransferir }) {
  const { fecha, hora } = formatearFecha(entrada.fecha_hora);
  const titulo = entrada.equipo_visitante
    ? `${entrada.equipo_local} vs. ${entrada.equipo_visitante}`
    : entrada.equipo_local;

  return (
    <Box sx={{
      border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
      overflow: 'hidden', bgcolor: 'background.paper',
      opacity: activa ? 1 : 0.65,
    }}>
      <Box sx={{ height: 90, bgcolor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="rgba(255,255,255,0.3)" fontSize={11}>Estadio {entrada.estadio}</Typography>
      </Box>
      <Box sx={{ p: '10px 12px' }}>
        <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
          <EstadoPill estado={activa ? 'activa' : entrada.estado} />
          {activa && <TransferenciasChip cantidad={entrada.transferencias} />}
        </Stack>

        <Typography fontWeight={500} fontSize={13} mb={0.5}>{titulo}</Typography>
        <Stack gap={0.25} mb={1}>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <PlaceIcon sx={{ fontSize: 12 }} />Sector {entrada.codigo_sector} · {entrada.estadio}
          </Typography>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <CalendarTodayIcon sx={{ fontSize: 11 }} />{fecha}{hora ? ` · ${hora} hs` : ''}
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
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalQR, setModalQR] = useState({ open: false, entrada: null });
  const [modalTransferir, setModalTransferir] = useState({ open: false, entrada: null });

  const fetchEntradas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarEntradas();
      setEntradas(data);
    } catch {
      setEntradas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntradas();
  }, [fetchEntradas]);

  const entradasActivas = entradas.filter(e => e.estado === 'activa');
  const entradasHistorial = entradas.filter(e => e.estado !== 'activa');

  const handleTransferenciaEnviada = (entradaId) => {
    setEntradas(prev =>
      prev.map(e =>
        e.id_entrada === entradaId
          ? { ...e, transferencias: e.transferencias + 1 }
          : e
      )
    );
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
        <Typography fontWeight={500} fontSize={18} mb={2.5}>Mis entradas</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      </Box>
    );
  }

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
                key={e.id_entrada}
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
              <EntradaCard key={e.id_entrada} entrada={e} activa={false} />
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
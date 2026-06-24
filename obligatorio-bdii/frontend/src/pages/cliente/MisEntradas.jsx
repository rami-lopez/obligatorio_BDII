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

function QRCode({ hash, size = 128 }) {
  return (
    <Stack spacing={1.25} alignItems="center" sx={{ width: '100%' }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 2,
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1f1f1f',
        }}
      >
        <svg width={size - 20} height={size - 20} viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
      </Box>

      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography fontSize={11} color="text.secondary" mb={0.75} textTransform="uppercase" letterSpacing={0.8}>
          Código de validación
        </Typography>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 1.6,
              wordBreak: 'break-all',
              lineHeight: 1.35,
            }}
          >
            {hash || 'Generando...'}
          </Typography>
        </Box>
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
        sx: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.25,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography fontWeight={600} fontSize={16}>
            Tu entrada
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Mostrá este código al funcionario
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.25 }}>
        <Box
          sx={{
            bgcolor: '#F7F8FA',
            borderRadius: 2.5,
            p: 2,
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {loading ? (
            <Box sx={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <QRCode hash={hash} size={132} />
          )}
        </Box>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Typography fontWeight={600} fontSize={14} mb={0.75}>
            {titulo}
          </Typography>

          <Stack gap={0.4}>
            <Typography fontSize={12.5} color="text.secondary">
              {entrada.estadio} · Sector {entrada.codigo_sector}
            </Typography>

            {fecha && (
              <Typography fontSize={12.5} color="text.secondary">
                {fecha}{hora ? ` · ${hora} hs` : ''}
              </Typography>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            borderRadius: 2,
            bgcolor: '#F8FAFC',
            border: '1px solid',
            borderColor: 'divider',
            p: 1.25,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <RefreshIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography fontSize={12.5} color="text.secondary">
                Se regenera en
              </Typography>
            </Stack>

            <Typography fontWeight={700} fontSize={13}>
              {segundos}s
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progreso}
            sx={{
              height: 5,
              borderRadius: 5,
              bgcolor: 'divider',
              '& .MuiLinearProgress-bar': {
                bgcolor: segundos <= 5 ? 'error.main' : 'secondary.main',
                borderRadius: 5,
              },
            }}
          />
        </Box>
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
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        opacity: activa ? 1 : 0.65,
        transition: 'all 0.18s ease',
        '&:hover': activa
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
              borderColor: '#B9D7EF',
            }
          : {},
      }}
    >
      <Box
        sx={{
          height: 96,
          background: 'linear-gradient(135deg, #E6F1FB 0%, #F7FAFC 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Stack alignItems="center" spacing={0.4}>
          <Typography
            fontSize={10}
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.8}
          >
            Estadio
          </Typography>

          <Typography
            fontWeight={700}
            fontSize={15}
            color="primary.main"
            textAlign="center"
            noWrap
            sx={{ maxWidth: 260 }}
          >
            {entrada.estadio}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <EstadoPill estado={activa ? 'activa' : entrada.estado} />
          {activa && <TransferenciasChip cantidad={entrada.transferencias} />}
        </Stack>

        <Typography fontWeight={700} fontSize={15} mb={0.75} lineHeight={1.25}>
          {titulo}
        </Typography>

        <Stack gap={0.45} mb={1.25}>
          <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <PlaceIcon sx={{ fontSize: 14 }} />
            Sector {entrada.codigo_sector} · {entrada.estadio}
          </Typography>

          <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <CalendarTodayIcon sx={{ fontSize: 13 }} />
            {fecha}{hora ? ` · ${hora} hs` : ''}
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
              sx={{
                fontSize: 12,
                py: 0.65,
                borderRadius: 1.5,
              }}
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
                fontSize: 12,
                py: 0.65,
                borderRadius: 1.5,
                border: '1px solid #378ADD',
                color: '#185FA5',
                '&:hover': { bgcolor: '#E6F1FB' },
                '&.Mui-disabled': {
                  border: '1px solid',
                  borderColor: 'divider',
                },
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
            sx={{
              fontSize: 12,
              py: 0.65,
              borderRadius: 1.5,
            }}
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
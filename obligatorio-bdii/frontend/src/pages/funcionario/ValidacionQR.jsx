import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Stack, Button, Paper,
  TextField, InputAdornment, Divider, Chip, MenuItem,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import KeyIcon from '@mui/icons-material/Key';
import { getDispositivos, postValidacion } from '../../api/validacion';
import { getMiEvento } from '../../api/funcionarios';

const RESULTADO_TIMEOUT = 2200;

// Respuestas mock — reemplazar con fetch a /api/validacion/qr
const MOCK_VALIDO = {
  valido: true,
  numero: null, // se genera random en la simulación
  sector: 'Tribuna Norte',
  tipo: 'General',
};

const MOCK_INVALIDOS = [
  'QR ya utilizado',
  'Evento incorrecto',
  'QR expirado',
  'Entrada no encontrada',
];

function ResultadoOverlay({ resultado, onDismiss }) {
  if (!resultado) return null;

  return (
    <Box
      onClick={onDismiss}
      sx={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1.5,
        bgcolor: resultado.valido
          ? 'rgba(59, 109, 17, 0.92)'
          : 'rgba(226, 75, 74, 0.92)',
        cursor: 'pointer',
      }}
    >
      <Box sx={{
        width: 64, height: 64, borderRadius: '50%',
        border: '2.5px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {resultado.valido
          ? <CheckCircleIcon sx={{ fontSize: 34, color: '#fff' }} />
          : <CancelIcon sx={{ fontSize: 34, color: '#fff' }} />
        }
      </Box>
      <Typography fontWeight={500} fontSize={24} color="#fff" letterSpacing={1}>
        {resultado.valido ? 'VÁLIDA' : 'INVÁLIDA'}
      </Typography>
      <Typography fontSize={14} color="rgba(255,255,255,0.85)" textAlign="center" px={3}>
        {resultado.valido
          ? `Entrada #${resultado.numero} · ${resultado.sector}`
          : resultado.motivo
        }
      </Typography>
    </Box>
  );
}

function LogItem({ item }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.25,
      px: 1.25, py: 1, borderRadius: 1.5,
      bgcolor: 'background.default',
    }}>
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        bgcolor: item.valido ? '#3B6D11' : '#E24B4A',
      }} />
      <Typography fontSize={12} color="text.primary" flex={1} noWrap>
        {item.valido ? `Entrada #${item.numero}` : item.motivo}
      </Typography>
      <Typography fontSize={11} color="text.disabled" flexShrink={0}>{item.hora}</Typography>
    </Box>
  );
}

function ValidacionQR() {
  const [resultado, setResultado] = useState(null);
  const [idEntrada, setIdEntrada] = useState('');
  const [hashIngresado, setHashIngresado] = useState('');
  const [dispositivos, setDispositivos] = useState([]);
  const [identificadorDisp, setIdentificadorDisp] = useState('');
  const [loadingDispositivos, setLoadingDispositivos] = useState(true);
  const [validando, setValidando] = useState(false);
  const [error, setError] = useState('');
  const [okCount, setOkCount] = useState(0);
  const [errCount, setErrCount] = useState(0);
  const [log, setLog] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);

  const timeoutRef = useRef(null);
  const scanLineRef = useRef(null);

  const ahora = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const cargarDispositivos = async () => {
    setLoadingDispositivos(true);
    try {
      const data = await getDispositivos();
      setDispositivos(data);
      if (data.length > 0) {
        setIdentificadorDisp(prev => prev || data[0].identificador);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudieron cargar los dispositivos asignados');
    } finally {
      setLoadingDispositivos(false);
    }
  };

  useEffect(() => {
    cargarDispositivos();
  }, []);

  const mostrarResultado = (res) => {
    clearTimeout(timeoutRef.current);
    setResultado(res);

    // Agregar al log
    setLog(prev => [res, ...prev].slice(0, 8));

    // Actualizar contadores
    if (res.valido) setOkCount(c => c + 1);
    else setErrCount(c => c + 1);

    // Auto-dismiss
    timeoutRef.current = setTimeout(() => {
      setResultado(null);
    }, RESULTADO_TIMEOUT);
  };

  const cargarEjemplo = () => {
    setIdEntrada('1');
    setHashIngresado('123456');
    setError('');
  };

  const handleValidar = async () => {
    if (!idEntrada.trim() || !hashIngresado.trim() || !identificadorDisp.trim()) {
      setError('Completá el id de entrada, el hash y el dispositivo antes de validar');
      return;
    }

    setValidando(true);
    setError('');
    try {
      const payload = {
        id_entrada: Number(idEntrada),
        hash_ingresado: hashIngresado.trim(),
        identificador_disp: identificadorDisp.trim(),
      };
      const response = await postValidacion(payload);
      mostrarResultado({
        valido: true,
        numero: payload.id_entrada,
        sector: 'Validación registrada',
        tipo: null,
        motivo: response?.mensaje || 'Entrada validada correctamente',
        hora: ahora(),
      });
      setIdEntrada('');
      setHashIngresado('');
    } catch (err) {
      const motivo = err?.response?.data?.detail || 'No se pudo validar la entrada';
      mostrarResultado({
        valido: false,
        numero: null,
        motivo,
        hora: ahora(),
      });
    } finally {
      setValidando(false);
    }
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const cargarEvento = async () => {
      try {
        const data = await getMiEvento();
        const ahora = new Date();
        const futuros = data.filter(e => new Date(e.fecha_hora) > ahora);
        setEventos(futuros);
        if (futuros.length > 0) {
          setEventoActivo(futuros[0]);
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'No se pudo cargar el evento asignado');
      }
    };
    
    cargarEvento();
  }, []);

  const capacidadSector = eventoActivo?.capacidad_max ?? 3200;
  const progresoPct = Math.min((okCount / capacidadSector) * 100, 100);

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
      gap: 2.5,
      p: { xs: 2, md: '20px 24px' },
      maxWidth: 1000,
      mx: 'auto',
    }}>

      {/* Columna izquierda — escáner */}
      <Stack gap={2}>

        {/* Evento y sector activo */}
        <Paper elevation={0} sx={{
          border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
          p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <TextField
              select
              size="small"
              label="Evento / Sector"
              value={eventoActivo ? `${eventoActivo.id_evento}-${eventoActivo.sector_codigo}` : ''}
              onChange={e => {
                const val = e.target.value;
                if (!val) return;
                const [id, sector] = val.split('-');
                const sel = eventos.find(ev => ev.id_evento === Number(id) && ev.sector_codigo === sector);
                if (sel) setEventoActivo(sel);
              }}
              sx={{ minWidth: 320, flex: 1 }}
              disabled={eventos.length === 0}
              displayEmpty
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>
                {eventos.length === 0 ? 'No tenés eventos próximos asignados' : 'Seleccioná un evento y sector'}
              </MenuItem>
              {eventos.map(ev => {
                const fecha = new Date(ev.fecha_hora).toLocaleDateString('es-UY', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <MenuItem key={`${ev.id_evento}-${ev.sector_codigo}`} value={`${ev.id_evento}-${ev.sector_codigo}`}>
                    {ev.equipo_local} vs. {ev.equipo_visitante} · {fecha} · Sector {ev.sector_codigo}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              select
              size="small"
              label="Dispositivo"
              value={identificadorDisp}
              onChange={e => setIdentificadorDisp(e.target.value)}
              disabled={loadingDispositivos}
              sx={{ minWidth: 200, flexShrink: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DevicesOtherIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            >
              {dispositivos.map(d => (
                <MenuItem key={d.identificador} value={d.identificador}>
                  {d.identificador}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {eventoActivo && (
            <Typography fontSize={12} color="text.secondary">
              {eventoActivo.estadio_nombre} · {eventoActivo.estadio_ciudad}
            </Typography>
          )}
        </Paper>

        {/* Área del escáner */}
        <Box sx={{
          position: 'relative',
          borderRadius: 2, overflow: 'hidden',
          bgcolor: '#111',
          aspectRatio: '4/3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Marco del escáner */}
          <Box sx={{ position: 'relative', width: 200, height: 200 }}>
            {/* Esquinas */}
            {[
              { top: 0, left: 0, borderTop: '2.5px solid #fff', borderLeft: '2.5px solid #fff', borderRadius: '3px 0 0 0' },
              { top: 0, right: 0, borderTop: '2.5px solid #fff', borderRight: '2.5px solid #fff', borderRadius: '0 3px 0 0' },
              { bottom: 0, left: 0, borderBottom: '2.5px solid #fff', borderLeft: '2.5px solid #fff', borderRadius: '0 0 0 3px' },
              { bottom: 0, right: 0, borderBottom: '2.5px solid #fff', borderRight: '2.5px solid #fff', borderRadius: '0 0 3px 0' },
            ].map((style, i) => (
              <Box key={i} sx={{ position: 'absolute', width: 28, height: 28, ...style }} />
            ))}

            {/* Línea de escaneo */}
            {!resultado && (
              <Box
                ref={scanLineRef}
                sx={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, #4AE074, transparent)',
                  animation: 'scanline 2s linear infinite',
                  '@keyframes scanline': {
                    '0%': { top: 0 },
                    '100%': { top: 196 },
                  },
                }}
              />
            )}
          </Box>

          <Typography
            sx={{
              position: 'absolute', bottom: 16,
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
            }}
          >
            Cargá el id y hash del QR para validar contra el backend
          </Typography>

          {/* Overlay de resultado */}
          <ResultadoOverlay
            resultado={resultado}
            onDismiss={() => {
              clearTimeout(timeoutRef.current);
              setResultado(null);
            }}
          />
        </Box>

        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
          <Stack gap={1.25}>
            <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5}>
              Validación manual
            </Typography>
            <TextField
              size="small"
              fullWidth
              label="ID de entrada"
              value={idEntrada}
              onChange={e => setIdEntrada(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ConfirmationNumberIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              fullWidth
              label="Hash del QR"
              value={hashIngresado}
              onChange={e => setHashIngresado(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleValidar()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            {error && (
              <Typography fontSize={12} color="error.main">
                {error}
              </Typography>
            )}
            <Stack direction="row" gap={1}>
              <Button
                variant="outlined"
                startIcon={<QrCodeScannerIcon sx={{ fontSize: 14 }} />}
                onClick={cargarEjemplo}
                sx={{
                  fontSize: 12, py: 0.875,
                  color: '#185FA5', borderColor: '#B9D7EF',
                  bgcolor: '#E6F1FB',
                  '&:hover': { bgcolor: '#D6E9F8', borderColor: '#185FA5' },
                }}
              >
                Cargar ejemplo
              </Button>
              <Button
                variant="contained"
                onClick={handleValidar}
                disabled={validando || loadingDispositivos}
                sx={{ fontSize: 12, py: 0.875, flex: 1 }}
              >
                {validando ? 'Validando...' : 'Validar entrada'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      {/* Columna derecha — stats y log */}
      <Stack gap={1.5}>

        {/* Validadas */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
          <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
            Validadas hoy
          </Typography>
          <Typography fontWeight={500} fontSize={26} mb={0.25}>{okCount}</Typography>
          <Typography fontSize={12} color="text.secondary" mb={1}>
            de {capacidadSector.toLocaleString()} entradas del sector
          </Typography>
          <Box sx={{ height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', borderRadius: 2,
              bgcolor: 'secondary.main',
              width: `${progresoPct}%`,
              transition: 'width 0.4s ease',
            }} />
          </Box>
        </Paper>

        {/* Rechazadas */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
          <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
            Rechazadas
          </Typography>
          <Typography fontWeight={500} fontSize={26} color="error.main" mb={0.25}>{errCount}</Typography>
          <Typography fontSize={12} color="text.secondary">QR inválido o ya utilizado</Typography>
        </Paper>

        <Divider />

        {/* Log */}
        <Box>
          <Typography
            fontSize={11} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1}
          >
            Últimas validaciones
          </Typography>
          <Stack gap={0.75}>
            {log.map((item, i) => (
              <LogItem key={i} item={item} />
            ))}
          </Stack>
        </Box>

      </Stack>
    </Box>
  );
}

export default ValidacionQR;
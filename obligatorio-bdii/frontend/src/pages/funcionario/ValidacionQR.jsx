import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Stack, Button, Paper,
  TextField, InputAdornment, Divider, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

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
  const [busqueda, setBusqueda] = useState('');
  const [okCount, setOkCount] = useState(24);
  const [errCount, setErrCount] = useState(2);
  const [log, setLog] = useState([
    { valido: true,  numero: 'A-00419', motivo: null,                   hora: '20:14' },
    { valido: true,  numero: 'A-00411', motivo: null,                   hora: '20:13' },
    { valido: false, numero: null,      motivo: 'QR ya utilizado',       hora: '20:11' },
    { valido: true,  numero: 'A-00398', motivo: null,                   hora: '20:09' },
    { valido: false, numero: null,      motivo: 'Entrada de otro evento', hora: '20:07' },
  ]);

  const timeoutRef = useRef(null);
  const scanLineRef = useRef(null);

  const ahora = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const randomNumero = () => {
    const letra = String.fromCharCode(65 + Math.floor(Math.random() * 4));
    const num = String(Math.floor(Math.random() * 900) + 100).padStart(5, '0');
    return `${letra}-${num}`;
  };

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

  const simularValido = () => {
    const numero = randomNumero();
    mostrarResultado({
      valido: true,
      numero,
      sector: MOCK_VALIDO.sector,
      tipo: MOCK_VALIDO.tipo,
      motivo: null,
      hora: ahora(),
    });
  };

  const simularInvalido = () => {
    const motivo = MOCK_INVALIDOS[Math.floor(Math.random() * MOCK_INVALIDOS.length)];
    mostrarResultado({
      valido: false,
      numero: null,
      motivo,
      hora: ahora(),
    });
  };

  const handleBusqueda = () => {
    if (!busqueda.trim()) return;
    // Reemplazar con: fetch(`/api/validacion/manual?numero=${busqueda}`)
    const valido = Math.random() > 0.35;
    if (valido) {
      mostrarResultado({
        valido: true,
        numero: busqueda.trim().toUpperCase(),
        sector: 'Tribuna Norte',
        motivo: null,
        hora: ahora(),
      });
    } else {
      mostrarResultado({
        valido: false,
        numero: null,
        motivo: 'Entrada no encontrada',
        hora: ahora(),
      });
    }
    setBusqueda('');
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const capacidadSector = 3200;
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

        {/* Evento asignado */}
        <Paper elevation={0} sx={{
          border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
          p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.25}>
              Evento asignado
            </Typography>
            <Typography fontWeight={500} fontSize={14}>Argentina vs. México</Typography>
            <Typography fontSize={12} color="text.secondary">
              Estadio Azteca · 14 jun 2026 · 20:00 hs · Puerta C
            </Typography>
          </Box>
          <Button variant="outlined" size="small" sx={{ fontSize: 12, flexShrink: 0 }}>
            Cambiar
          </Button>
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
            Apuntá la cámara al código QR de la entrada
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

        {/* Botones de simulación */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon sx={{ fontSize: 14 }} />}
            onClick={simularValido}
            sx={{
              fontSize: 12, py: 0.875,
              color: '#27500A', borderColor: '#C0DD97',
              bgcolor: '#EAF3DE',
              '&:hover': { bgcolor: '#D4ECBA', borderColor: '#3B6D11' },
            }}
          >
            Simular QR válido
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon sx={{ fontSize: 14 }} />}
            onClick={simularInvalido}
            sx={{
              fontSize: 12, py: 0.875,
              color: '#791F1F', borderColor: '#F5B8B8',
              bgcolor: '#FCEBEB',
              '&:hover': { bgcolor: '#FAD4D4', borderColor: '#E24B4A' },
            }}
          >
            Simular QR inválido
          </Button>
        </Box>

        {/* Búsqueda manual */}
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar entrada por número (Ej: A-00421)"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBusqueda()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: busqueda && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleBusqueda}
                  sx={{ fontSize: 12, py: 0.4, px: 1.5, minWidth: 0 }}
                >
                  Buscar
                </Button>
              </InputAdornment>
            ),
          }}
        />
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
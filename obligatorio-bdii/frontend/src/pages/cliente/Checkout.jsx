import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Divider,
  TextField, MenuItem, Stepper, Step, StepLabel,
  Paper, Chip,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Tasa de comisión — reemplazar con fetch a /api/config/tasa
const TASA_COMISION = 0.05;

const PAISES = ['Uruguay', 'Argentina', 'Brasil', 'México', 'España', 'Francia', 'Alemania', 'Otro'];
const TIPOS_DOC = ['Cédula de identidad', 'Pasaporte', 'DNI'];

function SectionLabel({ children }) {
  return (
    <Typography
      fontSize={12} fontWeight={500} color="text.secondary"
      textTransform="uppercase" letterSpacing={0.5} mb={1.5}
    >
      {children}
    </Typography>
  );
}

function ResumenCard({ evento, sector, cantidad, tasa }) {
  const subtotal = sector.precio * cantidad;
  const comision = +(subtotal * tasa).toFixed(2);
  const total = +(subtotal + comision).toFixed(2);

  return { subtotal, comision, total };
}

function EstadoExito({ evento, sector, cantidad, onVerEntradas, onVolver }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', py: 6, px: 3, textAlign: 'center', gap: 2,
    }}>
      <Box sx={{
        width: 64, height: 64, borderRadius: '50%',
        bgcolor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleIcon sx={{ fontSize: 32, color: '#3B6D11' }} />
      </Box>
      <Typography fontWeight={500} fontSize={20}>¡Compra confirmada!</Typography>
      <Typography fontSize={14} color="text.secondary" maxWidth={320}>
        {cantidad === 1 ? 'Tu entrada' : `Tus ${cantidad} entradas`} para{' '}
        <strong>
          {evento.visitante ? `${evento.local} vs. ${evento.visitante}` : evento.local}
        </strong>{' '}
        {cantidad === 1 ? 'fue emitida.' : 'fueron emitidas.'} Podés verlas en "Mis entradas".
      </Typography>
      <Stack direction="row" gap={1.5} mt={1}>
        <Button
          variant="contained"
          onClick={onVerEntradas}
          sx={{ px: 3 }}
        >
          Ver mis entradas
        </Button>
        <Button
          variant="outlined"
          onClick={onVolver}
          sx={{ px: 3 }}
        >
          Volver al catálogo
        </Button>
      </Stack>
    </Box>
  );
}

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { evento, sector, cantidad } = location.state || {};

  const [confirmado, setConfirmado] = useState(false);
  const [tasa] = useState(TASA_COMISION);

  // Datos del titular — pre-llenado mock, conectar con contexto de usuario
  const [titular, setTitular] = useState({
    nombre: 'Nicolás',
    apellido: 'Rodríguez',
    email: 'nicolas@email.com',
  });

  // Documento
  const [doc, setDoc] = useState({
    pais: 'Uruguay',
    tipo: 'Cédula de identidad',
    numero: '',
  });

  // Pago simulado
  const [pago, setPago] = useState({
    numero: '',
    vencimiento: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!evento || !sector) navigate('/');
  }, [evento, sector, navigate]);

  if (!evento || !sector) return null;

  const subtotal = sector.precio * cantidad;
  const comision = +(subtotal * tasa).toFixed(2);
  const total = +(subtotal + comision).toFixed(2);
  const tasaPct = Math.round(tasa * 100);

  const validar = () => {
    const e = {};
    if (!titular.nombre.trim()) e.nombre = 'Requerido';
    if (!titular.apellido.trim()) e.apellido = 'Requerido';
    if (!titular.email.trim()) e.email = 'Requerido';
    if (!doc.numero.trim()) e.docNumero = 'Requerido';
    if (!pago.numero.trim()) e.pagoNumero = 'Requerido';
    if (!pago.vencimiento.trim()) e.pagoVenc = 'Requerido';
    if (!pago.cvv.trim()) e.pagoCvv = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmar = () => {
    if (!validar()) return;
    // Reemplazar con: fetch('/api/compras', { method: 'POST', body: JSON.stringify({...}) })
    setConfirmado(true);
  };

  if (confirmado) {
    return (
      <EstadoExito
        evento={evento}
        sector={sector}
        cantidad={cantidad}
        onVerEntradas={() => navigate('/mis-entradas')}
        onVolver={() => navigate('/')}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>

      {/* Stepper */}
      <Stepper activeStep={1} sx={{ mb: 3 }}>
        {['Elegir sector', 'Confirmar y pagar', 'Entradas emitidas'].map(label => (
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 280px' }, gap: 3 }}>

        {/* Columna izquierda */}
        <Stack gap={2.5}>

          {/* Detalle del pedido */}
          <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <SectionLabel>
              <Box sx={{ px: 2, pt: 2 }}>Detalle del pedido</Box>
            </SectionLabel>

            {/* Hero del evento */}
            <Box sx={{ mx: 2, mb: 1.5, borderRadius: 1.5, overflow: 'hidden', height: 110 }}>
              <Box
                component="img"
                src={evento.foto}
                alt={evento.estadio}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
              <Typography fontWeight={500} fontSize={15} mb={0.5}>
                {evento.visitante ? `${evento.local} vs. ${evento.visitante}` : evento.local}
              </Typography>
              <Stack direction="row" gap={1.5} flexWrap="wrap" mb={1.5}>
                <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
                  <PlaceIcon sx={{ fontSize: 14 }} />{evento.estadio}, {evento.ciudad}
                </Typography>
                <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
                  <CalendarTodayIcon sx={{ fontSize: 13 }} />{evento.fecha} · {evento.hora} hs
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontSize={13} color="text.secondary">
                  {sector.nombre}{' '}
                  <Chip
                    label={sector.tipo}
                    size="small"
                    sx={{ bgcolor: '#E6F1FB', color: '#185FA5', fontSize: 11, height: 20, borderRadius: 1, ml: 0.5 }}
                  />
                </Typography>
                <Typography fontWeight={500} fontSize={13}>
                  USD {sector.precio} × {cantidad}
                </Typography>
              </Stack>
            </Box>
          </Paper>

          {/* Datos del titular */}
          <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <SectionLabel>Datos del titular</SectionLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
              <TextField
                label="Nombre"
                size="small"
                value={titular.nombre}
                onChange={e => setTitular(p => ({ ...p, nombre: e.target.value }))}
                error={!!errors.nombre}
                helperText={errors.nombre}
              />
              <TextField
                label="Apellido"
                size="small"
                value={titular.apellido}
                onChange={e => setTitular(p => ({ ...p, apellido: e.target.value }))}
                error={!!errors.apellido}
                helperText={errors.apellido}
              />
            </Box>
            <TextField
              label="Email de confirmación"
              size="small"
              fullWidth
              value={titular.email}
              onChange={e => setTitular(p => ({ ...p, email: e.target.value }))}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2 }} />
            <SectionLabel>Documento de identidad</SectionLabel>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 1.5 }}>
              <TextField
                label="País"
                size="small"
                select
                value={doc.pais}
                onChange={e => setDoc(p => ({ ...p, pais: e.target.value }))}
              >
                {PAISES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
              <TextField
                label="Tipo"
                size="small"
                select
                value={doc.tipo}
                onChange={e => setDoc(p => ({ ...p, tipo: e.target.value }))}
              >
                {TIPOS_DOC.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField
                label="Número"
                size="small"
                value={doc.numero}
                onChange={e => setDoc(p => ({ ...p, numero: e.target.value }))}
                error={!!errors.docNumero}
                helperText={errors.docNumero}
                placeholder="Ej: 12345678"
              />
            </Box>

            <Typography fontSize={12} color="text.disabled" display="flex" alignItems="flex-start" gap={0.5} mt={1.5}>
              Las entradas quedan vinculadas al documento del titular. Las transferencias requieren verificación.
            </Typography>
          </Paper>

          {/* Pago simulado */}
          <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <SectionLabel>Pago simulado</SectionLabel>
            <Stack direction="row" gap={1} mb={1.5}>
              {['Visa', 'Mastercard', 'Amex'].map(c => (
                <Box
                  key={c}
                  sx={{
                    border: '0.5px solid', borderColor: 'divider', borderRadius: 1,
                    px: 1, py: 0.25, fontSize: 11, color: 'text.secondary',
                    bgcolor: 'background.default',
                  }}
                >
                  {c}
                </Box>
              ))}
            </Stack>
            <TextField
              label="Número de tarjeta"
              size="small"
              fullWidth
              value={pago.numero}
              onChange={e => setPago(p => ({ ...p, numero: e.target.value }))}
              error={!!errors.pagoNumero}
              helperText={errors.pagoNumero}
              placeholder="1234 5678 9012 3456"
              sx={{ mb: 1.5 }}
              inputProps={{ maxLength: 19 }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Vencimiento"
                size="small"
                value={pago.vencimiento}
                onChange={e => setPago(p => ({ ...p, vencimiento: e.target.value }))}
                error={!!errors.pagoVenc}
                helperText={errors.pagoVenc}
                placeholder="MM / AA"
                inputProps={{ maxLength: 7 }}
              />
              <TextField
                label="CVV"
                size="small"
                value={pago.cvv}
                onChange={e => setPago(p => ({ ...p, cvv: e.target.value }))}
                error={!!errors.pagoCvv}
                helperText={errors.pagoCvv}
                placeholder="···"
                inputProps={{ maxLength: 4 }}
              />
            </Box>
            <Typography
              fontSize={12} color="text.disabled"
              display="flex" alignItems="center" gap={0.5} mt={1.5}
            >
              <LockOutlinedIcon sx={{ fontSize: 14 }} />
              Entorno de pago simulado — no se procesa información real
            </Typography>
          </Paper>

        </Stack>

        {/* Columna derecha — resumen sticky */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 2,
              position: { md: 'sticky' }, top: { md: 16 },
            }}
          >
            <SectionLabel>Resumen</SectionLabel>

            <Stack gap={1.25} mb={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontSize={13} color="text.secondary">
                  {cantidad} × {sector.nombre}
                </Typography>
                <Typography fontSize={13}>USD {subtotal}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography fontSize={13} color="text.secondary">Comisión</Typography>
                  <Chip
                    label={`${tasaPct}%`}
                    size="small"
                    sx={{ bgcolor: '#FAEEDA', color: '#633806', fontSize: 11, height: 18, borderRadius: 1 }}
                  />
                </Stack>
                <Typography fontSize={13}>USD {comision}</Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.5}>
              <Typography fontWeight={500} fontSize={14}>Total</Typography>
              <Typography fontWeight={500} fontSize={20}>USD {total}</Typography>
            </Stack>
            <Typography fontSize={11} color="text.disabled" mb={2}>
              Tasa vigente al momento de la compra: {tasaPct}%
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleConfirmar}
              sx={{ py: 1.25, fontSize: 14, mb: 1 }}
            >
              Confirmar compra
            </Button>

            <Typography fontSize={11} color="text.disabled" textAlign="center" lineHeight={1.5}>
              Al confirmar aceptás los términos y condiciones de venta de entradas del Mundial 2026
            </Typography>

            <Button
              startIcon={<ArrowBackIcon />}
              size="small"
              onClick={() => navigate(-1)}
              sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary', width: '100%' }}
            >
              Volver al mapa de sectores
            </Button>
          </Paper>
        </Box>

      </Box>
    </Box>
  );
}

export default Checkout;
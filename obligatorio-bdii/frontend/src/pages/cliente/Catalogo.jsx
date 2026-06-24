import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Grid, Card,
  Button, Stack, Alert, Popover, ListItem, ListItemText,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import { listarEventos } from '../../api/eventos';
import { useAuth } from '../../hooks/useAuth';

function EventoCardChico({ evento, onClick }) {
  const fechaStr = evento.fecha_hora
    ? new Date(evento.fecha_hora).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const titulo = evento.equipo_visitante
    ? `${evento.equipo_local} vs. ${evento.equipo_visitante}`
    : evento.equipo_local;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        cursor: 'pointer',
        overflow: 'hidden',
        bgcolor: 'background.paper',
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
          height: 72,
          background: 'linear-gradient(135deg, #E6F1FB 0%, #F7FAFC 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Typography
          fontSize={11}
          color="primary.main"
          fontWeight={700}
          textTransform="uppercase"
          letterSpacing={0.8}
          textAlign="center"
          noWrap
          sx={{ maxWidth: '100%' }}
        >
          {evento.estadio_nombre}
        </Typography>
      </Box>

      <Box sx={{ p: 1.75 }}>
        <Typography fontWeight={700} fontSize={15} mb={1} lineHeight={1.25}>
          {titulo}
        </Typography>

        <Stack gap={0.6}>
          <Typography
            fontSize={12}
            color="text.secondary"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <CalendarTodayIcon sx={{ fontSize: 14 }} />
            {fechaStr}
          </Typography>

          <Typography
            fontSize={12}
            color="text.secondary"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <PlaceIcon sx={{ fontSize: 14 }} />
            {evento.estadio_nombre}
          </Typography>
        </Stack>
      </Box>
    </Card>
  );
}

function Catalogo() {
  const navigate = useNavigate();
  const { tokenListo } = useAuth();
  const [searchParams] = useSearchParams();
  const [sedeActiva, setSedeActiva] = useState(null);
  const [estadioActivo, setEstadioActivo] = useState(null);
  const [sedeAnchor, setSedeAnchor] = useState(null);
  const [estadioAnchor, setEstadioAnchor] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const q = searchParams.get('q')?.toLowerCase() || '';

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await listarEventos();
      setEventos(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Error al cargar eventos';
      setError(msg);
      console.error('Error al cargar eventos:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenListo) return;
    cargar();
  }, [tokenListo, cargar]);

  const sedes = useMemo(() => {
    const map = new Map();
    eventos.forEach(e => {
      if (e.id_sede == null) return;
      if (!map.has(e.id_sede)) {
        map.set(e.id_sede, { id_sede: e.id_sede, pais: e.sede_pais, estadios: [] });
      }
      if (e.estadio_nombre && !map.get(e.id_sede).estadios.includes(e.estadio_nombre)) {
        map.get(e.id_sede).estadios.push(e.estadio_nombre);
      }
    });
    return [...map.values()];
  }, [eventos]);

  const estadiosVisibles = useMemo(() => {
    if (sedeActiva) {
      const sede = sedes.find(s => s.id_sede === sedeActiva);
      return sede ? sede.estadios.sort() : [];
    }
    return [...new Set(eventos.map(e => e.estadio_nombre).filter(Boolean))].sort();
  }, [sedes, sedeActiva, eventos]);

  const filtrados = eventos.filter(e => {
    if (q) {
      const nom = `${e.equipo_local} ${e.equipo_visitante || ''}`.toLowerCase();
      if (!nom.includes(q)) return false;
    }
    if (sedeActiva && e.id_sede !== sedeActiva) return false;
    if (estadioActivo && e.estadio_nombre !== estadioActivo) return false;
    return true;
  });

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1200, mx: 'auto' }}>

      <Stack direction="row" gap={1} mb={3} flexWrap="wrap" alignItems="center">
        <Chip
          icon={<PlaceIcon sx={{ fontSize: '14px !important' }} />}
          label={sedeActiva ? sedes.find(s => s.id_sede === sedeActiva)?.pais : 'Sede'}
          variant="outlined"
          onClick={(e) => setSedeAnchor(e.currentTarget)}
          onDelete={sedeActiva ? () => { setSedeActiva(null); setEstadioActivo(null); } : undefined}
          sx={{
            fontSize: 13, height: 32, borderRadius: 3, cursor: 'pointer',
            borderColor: sedeActiva ? 'primary.main' : 'divider',
            color: sedeActiva ? 'primary.main' : 'text.secondary',
            bgcolor: sedeActiva ? '#E6F1FB' : 'transparent',
          }}
        />
        <Chip
          label={estadioActivo || 'Estadio'}
          variant="outlined"
          onClick={(e) => setEstadioAnchor(e.currentTarget)}
          onDelete={estadioActivo ? () => setEstadioActivo(null) : undefined}
          sx={{
            fontSize: 13, height: 32, borderRadius: 3, cursor: 'pointer',
            borderColor: estadioActivo ? 'primary.main' : 'divider',
            color: estadioActivo ? 'primary.main' : 'text.secondary',
            bgcolor: estadioActivo ? '#E6F1FB' : 'transparent',
          }}
        />
      </Stack>

      <Popover
        open={Boolean(sedeAnchor)}
        anchorEl={sedeAnchor}
        onClose={() => setSedeAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          elevation: 0,
          sx: { mt: 0.5, width: 200, border: '0.5px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 320 },
        }}
      >
        {sedes.map(sede => (
          <ListItem
            key={sede.id_sede}
            dense
            onClick={() => {
              setSedeActiva(sedeActiva === sede.id_sede ? null : sede.id_sede);
              setEstadioActivo(null);
              setSedeAnchor(null);
            }}
            sx={{
              cursor: 'pointer',
              bgcolor: sedeActiva === sede.id_sede ? '#E6F1FB' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemText
              primary={<Typography fontSize={13} fontWeight={sedeActiva === sede.id_sede ? 600 : 400}>{sede.pais}</Typography>}
            />
          </ListItem>
        ))}
        {sedes.length === 0 && (
          <Box sx={{ px: 2, py: 2, fontSize: 13, color: 'text.disabled', textAlign: 'center' }}>
            No hay sedes disponibles
          </Box>
        )}
      </Popover>

      <Popover
        open={Boolean(estadioAnchor)}
        anchorEl={estadioAnchor}
        onClose={() => setEstadioAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          elevation: 0,
          sx: { mt: 0.5, width: 260, border: '0.5px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 320 },
        }}
      >
        {estadiosVisibles.map(est => (
          <ListItem
            key={est}
            dense
            onClick={() => { setEstadioActivo(estadioActivo === est ? null : est); setEstadioAnchor(null); }}
            sx={{
              cursor: 'pointer',
              bgcolor: estadioActivo === est ? '#E6F1FB' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemText
              primary={<Typography fontSize={13} fontWeight={estadioActivo === est ? 600 : 400}>{est}</Typography>}
            />
          </ListItem>
        ))}
        {estadiosVisibles.length === 0 && (
          <Box sx={{ px: 2, py: 2, fontSize: 13, color: 'text.disabled', textAlign: 'center' }}>
            No hay estadios disponibles
          </Box>
        )}
      </Popover>

      {error && (
        <Alert
          severity="error"
          action={
            <Button size="small" startIcon={<RefreshIcon />} onClick={cargar}>
              Reintentar
            </Button>
          }
          sx={{ mb: 2, fontSize: 13 }}
        >
          {error}
        </Alert>
      )}

      {eventos.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography fontSize={13} color="text.secondary" fontWeight={500}>
            {filtrados.length} de {eventos.length} eventos
            {q && ` · buscando "${q}"`}
            {sedeActiva && ` · ${sedes.find(s => s.id_sede === sedeActiva)?.pais}`}
            {estadioActivo && ` · ${estadioActivo}`}
          </Typography>
        </Box>
      )}

      {cargando ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <Typography>Cargando eventos...</Typography>
        </Box>
      ) : filtrados.length > 0 ? (
        <Box>
          <Typography
            fontSize={12}
            fontWeight={700}
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.8}
            mb={1.5}
          >
            Eventos disponibles
          </Typography>
          <Grid container spacing={1.75}>
            {filtrados.map(e => (
              <Grid item xs={12} sm={6} md={4} key={e.id_evento}>
                <EventoCardChico evento={e} onClick={() => navigate(`/evento/${e.id_evento}`)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <Typography fontSize={14}>No se encontraron eventos</Typography>
        </Box>
      )}

    </Box>
  );
}

export default Catalogo;

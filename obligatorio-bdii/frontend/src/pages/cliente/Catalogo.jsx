import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Grid, Card, CardMedia,
  CardContent, CardActions, Button, Stack,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { listarEventos } from '../../api/eventos';

const FASES = ['Todos', 'Fase de grupos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

function EventoCardChico({ evento, onClick }) {
  const fechaStr = evento.fecha_hora
    ? new Date(evento.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const titulo = evento.equipo_visitante
    ? `${evento.equipo_local} vs. ${evento.equipo_visitante}`
    : evento.equipo_local;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
        cursor: 'pointer', overflow: 'hidden',
        '&:hover': { borderColor: 'secondary.main' },
        transition: 'border-color 0.15s',
      }}
    >
      <Box sx={{ p: '12px 14px' }}>
        <Typography fontWeight={500} fontSize={14} mb={0.75}>{titulo}</Typography>
        <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
          <CalendarTodayIcon sx={{ fontSize: 12 }} />{fechaStr}
        </Typography>
      </Box>
    </Card>
  );
}

function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [faseActiva, setFaseActiva] = useState('Todos');
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const q = searchParams.get('q')?.toLowerCase() || '';

  useEffect(() => {
    listarEventos()
      .then(setEventos)
      .catch(err => console.error('Error al cargar eventos:', err))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = eventos.filter(e => {
    const nom = `${e.equipo_local} ${e.equipo_visitante || ''}`.toLowerCase();
    const matchQ = !q || nom.includes(q);
    return matchQ;
  });

  const resto = filtrados;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1200, mx: 'auto' }}>

      {/* Filtros */}
      <Stack direction="row" gap={1} mb={3} flexWrap="wrap" alignItems="center">
        {FASES.map(fase => (
          <Chip
            key={fase}
            label={fase}
            onClick={() => setFaseActiva(fase)}
            sx={{
              fontSize: 13, height: 32, borderRadius: 3, cursor: 'pointer',
              bgcolor: faseActiva === fase ? 'primary.main' : 'background.paper',
              color: faseActiva === fase ? '#B5D4F4' : 'text.secondary',
              border: '0.5px solid',
              borderColor: faseActiva === fase ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: faseActiva === fase ? 'primary.dark' : 'action.hover',
              },
            }}
          />
        ))}
        <Box sx={{ width: '0.5px', height: 20, bgcolor: 'divider', mx: 0.5 }} />
        <Chip
          icon={<FilterAltIcon sx={{ fontSize: '14px !important' }} />}
          label="Sede"
          variant="outlined"
          sx={{ fontSize: 13, height: 32, borderRadius: 3, cursor: 'pointer', borderColor: 'divider' }}
        />
        <Chip
          icon={<CalendarTodayIcon sx={{ fontSize: '13px !important' }} />}
          label="Fecha"
          variant="outlined"
          sx={{ fontSize: 13, height: 32, borderRadius: 3, cursor: 'pointer', borderColor: 'divider' }}
        />
      </Stack>

      {/* Todos */}
      {resto.length > 0 && (
        <>
          <Typography fontSize={12} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
            Eventos
          </Typography>
          <Grid container spacing={1.75}>
            {resto.map(e => (
              <Grid item xs={12} sm={6} md={4} key={e.id_evento}>
                <EventoCardChico evento={e} onClick={() => navigate(`/evento/${e.id_evento}`)} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {filtrados.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <Typography fontSize={14}>No se encontraron eventos con ese filtro</Typography>
        </Box>
      )}

    </Box>
  );
}

export default Catalogo;
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Grid, Card, CardMedia,
  CardContent, CardActions, Button, Stack,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

// Mock de eventos — reemplazar con fetch a /api/eventos
const MOCK_EVENTOS = [
  {
    id: 1,
    local: 'Argentina', visitante: 'México',
    estadio: 'Estadio Azteca', ciudad: 'Ciudad de México',
    fecha: '14 jun 2026', hora: '20:00',
    fase: 'Fase de grupos', precioDesde: 120,
    disponibles: 892, agotado: false, destacado: true,
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Estadio_Azteca_2015.jpg/800px-Estadio_Azteca_2015.jpg',
  },
  {
    id: 2,
    local: 'Final', visitante: '',
    estadio: 'Rose Bowl', ciudad: 'Los Ángeles',
    fecha: '19 jul 2026', hora: '18:00',
    fase: 'Final', precioDesde: 850,
    disponibles: 4200, agotado: false, destacado: true,
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Rose_Bowl_Stadium_aerial_photo.jpg/800px-Rose_Bowl_Stadium_aerial_photo.jpg',
  },
  {
    id: 3,
    local: 'Brasil', visitante: 'Uruguay',
    estadio: 'MetLife Stadium', ciudad: 'Nueva York',
    fecha: '1 jul 2026', hora: '18:00',
    fase: 'Octavos', precioDesde: 200,
    disponibles: 201, agotado: false, destacado: false,
    foto: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Nrg_stadium.jpg',
  },
  {
    id: 4,
    local: 'España', visitante: 'Alemania',
    estadio: 'AT&T Stadium', ciudad: 'Dallas',
    fecha: '18 jun 2026', hora: '20:00',
    fase: 'Fase de grupos', precioDesde: 180,
    disponibles: 0, agotado: true, destacado: false,
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AT%26T_Stadium_-_Interior_2013.jpg/800px-AT%26T_Stadium_-_Interior_2013.jpg',
  },
  {
    id: 5,
    local: 'Francia', visitante: 'Polonia',
    estadio: 'BC Place', ciudad: 'Vancouver',
    fecha: '20 jun 2026', hora: '16:00',
    fase: 'Fase de grupos', precioDesde: 95,
    disponibles: 1800, agotado: false, destacado: false,
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BC_Place_Vancouver_2011.jpg/800px-BC_Place_Vancouver_2011.jpg',
  },
];

const FASES = ['Todos', 'Fase de grupos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

function DisponibilidadChip({ disponibles, agotado }) {
  if (agotado) return (
    <Chip label="Agotado" size="small"
      sx={{ bgcolor: '#FAEEDA', color: '#633806', fontSize: 11, height: 22, borderRadius: 1 }} />
  );
  if (disponibles < 300) return (
    <Chip label="Pocas entradas" size="small"
      sx={{ bgcolor: '#EAF3DE', color: '#27500A', fontSize: 11, height: 22, borderRadius: 1 }} />
  );
  return (
    <Chip label="Disponible" size="small"
      sx={{ bgcolor: '#EAF3DE', color: '#27500A', fontSize: 11, height: 22, borderRadius: 1 }} />
  );
}

function EventoCardGrande({ evento, onClick }) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
        cursor: 'pointer', overflow: 'hidden',
        '&:hover .evento-img': { transform: 'scale(1.03)' },
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'secondary.main' },
      }}
    >
      <Box sx={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        <CardMedia
          component="img"
          image={evento.foto}
          alt={evento.estadio}
          className="evento-img"
          sx={{ height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
        />
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
        }} />
        <Chip
          label={evento.fase}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10,
            bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 11, height: 22, borderRadius: 1,
          }}
        />
      </Box>
      <CardContent sx={{ pb: 0 }}>
        <Typography fontWeight={500} fontSize={15} mb={0.5}>
          {evento.visitante ? `${evento.local} vs. ${evento.visitante}` : evento.local}
        </Typography>
        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <PlaceIcon sx={{ fontSize: 14 }} />{evento.estadio}, {evento.ciudad}
          </Typography>
          <Typography fontSize={12} color="text.secondary" display="flex" alignItems="center" gap={0.4}>
            <CalendarTodayIcon sx={{ fontSize: 13 }} />{evento.fecha}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 1, justifyContent: 'space-between' }}>
        <Box>
          <Typography fontSize={11} color="text.disabled">desde</Typography>
          <Typography fontWeight={500} fontSize={16}>USD {evento.precioDesde}</Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          disabled={evento.agotado}
          sx={{ fontSize: 13, px: 2 }}
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          Ver entradas
        </Button>
      </CardActions>
    </Card>
  );
}

function EventoCardChico({ evento, onClick }) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '0.5px solid', borderColor: 'divider', borderRadius: 2,
        cursor: 'pointer', overflow: 'hidden',
        '&:hover .evento-img': { transform: 'scale(1.04)' },
        '&:hover': { borderColor: 'secondary.main' },
        transition: 'border-color 0.15s',
      }}
    >
      <Box sx={{ height: 120, overflow: 'hidden', position: 'relative' }}>
        <CardMedia
          component="img"
          image={evento.foto}
          alt={evento.estadio}
          className="evento-img"
          sx={{ height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
        />
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
        }} />
        <Chip
          label={evento.fase}
          size="small"
          sx={{
            position: 'absolute', top: 8, left: 8,
            bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, height: 20, borderRadius: 1,
          }}
        />
      </Box>
      <CardContent sx={{ p: '10px 12px !important' }}>
        <Typography fontWeight={500} fontSize={13} mb={0.5}>
          {evento.visitante ? `${evento.local} vs. ${evento.visitante}` : evento.local}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.3}>
            <PlaceIcon sx={{ fontSize: 12 }} />{evento.ciudad}
          </Typography>
          <Typography fontSize={11} color="text.secondary" display="flex" alignItems="center" gap={0.3}>
            <CalendarTodayIcon sx={{ fontSize: 11 }} />{evento.fecha}
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography fontWeight={500} fontSize={14}>
            {evento.agotado ? '—' : `USD ${evento.precioDesde}`}
          </Typography>
          <DisponibilidadChip disponibles={evento.disponibles} agotado={evento.agotado} />
        </Box>
      </CardContent>
    </Card>
  );
}

function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [faseActiva, setFaseActiva] = useState('Todos');
  const [eventos, setEventos] = useState(MOCK_EVENTOS);

  const q = searchParams.get('q')?.toLowerCase() || '';

  // Reemplazar con fetch a /api/eventos cuando el backend esté listo
  useEffect(() => {
    setEventos(MOCK_EVENTOS);
  }, []);

  const filtrados = eventos.filter(e => {
    const matchFase = faseActiva === 'Todos' || e.fase === faseActiva;
    const matchQ = !q || `${e.local} ${e.visitante} ${e.estadio} ${e.ciudad}`.toLowerCase().includes(q);
    return matchFase && matchQ;
  });

  const destacados = filtrados.filter(e => e.destacado);
  const resto = filtrados.filter(e => !e.destacado);

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

      {/* Destacados */}
      {destacados.length > 0 && (
        <>
          <Typography fontSize={12} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
            Destacados
          </Typography>
          <Grid container spacing={2} mb={4}>
            {destacados.map(e => (
              <Grid item xs={12} md={6} key={e.id}>
                <EventoCardGrande evento={e} onClick={() => navigate(`/eventos/${e.id}`)} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Todos */}
      {resto.length > 0 && (
        <>
          <Typography fontSize={12} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
            {destacados.length > 0 ? 'Todos los eventos' : 'Eventos'}
          </Typography>
          <Grid container spacing={1.75}>
            {resto.map(e => (
              <Grid item xs={12} sm={6} md={4} key={e.id}>
                <EventoCardChico evento={e} onClick={() => navigate(`/eventos/${e.id}`)} />
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
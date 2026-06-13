import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip,
  IconButton, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TouchAppIcon from '@mui/icons-material/TouchApp';

// Mock — reemplazar con fetch a /api/eventos/:id
const MOCK_EVENTOS = {
  1: {
    id: 1,
    local: 'Argentina', visitante: 'México',
    estadio: 'Estadio Azteca', ciudad: 'Ciudad de México',
    fecha: '14 jun 2026', hora: '20:00',
    fase: 'Fase de grupos — Grupo C',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Estadio_Azteca_2015.jpg/800px-Estadio_Azteca_2015.jpg',
    sectores: [
      { id: 'norte', nombre: 'Tribuna Norte',  tipo: 'General',      precio: 95,  disponibles: 842, capacidad: 3200 },
      { id: 'sur',   nombre: 'Tribuna Sur',    tipo: 'General',      precio: 95,  disponibles: 654, capacidad: 3100 },
      { id: 'este',  nombre: 'Lateral Este',   tipo: 'Preferencial', precio: 120, disponibles: 201, capacidad: 2800 },
      { id: 'oeste', nombre: 'Lateral Oeste',  tipo: 'Preferencial', precio: 120, disponibles: 0,   capacidad: 2800 },
      { id: 'vip_n', nombre: 'VIP Norte',      tipo: 'VIP',          precio: 380, disponibles: 38,  capacidad: 400  },
      { id: 'vip_s', nombre: 'VIP Sur',        tipo: 'VIP',          precio: 380, disponibles: 12,  capacidad: 400  },
    ],
  },
  2: {
    id: 2,
    local: 'Final', visitante: '',
    estadio: 'Rose Bowl', ciudad: 'Los Ángeles',
    fecha: '19 jul 2026', hora: '18:00',
    fase: 'Final',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Rose_Bowl_Stadium_aerial_photo.jpg/800px-Rose_Bowl_Stadium_aerial_photo.jpg',
    sectores: [
      { id: 'norte', nombre: 'Tribuna Norte',  tipo: 'General',      precio: 850,  disponibles: 1200, capacidad: 4000 },
      { id: 'sur',   nombre: 'Tribuna Sur',    tipo: 'General',      precio: 850,  disponibles: 980,  capacidad: 4000 },
      { id: 'este',  nombre: 'Lateral Este',   tipo: 'Preferencial', precio: 1200, disponibles: 430,  capacidad: 2000 },
      { id: 'oeste', nombre: 'Lateral Oeste',  tipo: 'Preferencial', precio: 1200, disponibles: 390,  capacidad: 2000 },
      { id: 'vip_n', nombre: 'VIP Norte',      tipo: 'VIP',          precio: 3500, disponibles: 80,   capacidad: 200  },
      { id: 'vip_s', nombre: 'VIP Sur',        tipo: 'VIP',          precio: 3500, disponibles: 60,   capacidad: 200  },
    ],
  },
  3: {
    id: 3,
    local: 'Brasil', visitante: 'Uruguay',
    estadio: 'MetLife Stadium', ciudad: 'Nueva York',
    fecha: '1 jul 2026', hora: '18:00',
    fase: 'Octavos de final',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Nrg_stadium.jpg',
    sectores: [
      { id: 'norte', nombre: 'Tribuna Norte',  tipo: 'General',      precio: 200, disponibles: 1100, capacidad: 3500 },
      { id: 'sur',   nombre: 'Tribuna Sur',    tipo: 'General',      precio: 200, disponibles: 980,  capacidad: 3500 },
      { id: 'este',  nombre: 'Lateral Este',   tipo: 'Preferencial', precio: 280, disponibles: 201,  capacidad: 2500 },
      { id: 'oeste', nombre: 'Lateral Oeste',  tipo: 'Preferencial', precio: 280, disponibles: 0,    capacidad: 2500 },
      { id: 'vip_n', nombre: 'VIP Norte',      tipo: 'VIP',          precio: 600, disponibles: 22,   capacidad: 300  },
      { id: 'vip_s', nombre: 'VIP Sur',        tipo: 'VIP',          precio: 600, disponibles: 15,   capacidad: 300  },
    ],
  },
  4: {
    id: 4,
    local: 'España', visitante: 'Alemania',
    estadio: 'AT&T Stadium', ciudad: 'Dallas',
    fecha: '18 jun 2026', hora: '20:00',
    fase: 'Fase de grupos — Grupo E',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AT%26T_Stadium_-_Interior_2013.jpg/800px-AT%26T_Stadium_-_Interior_2013.jpg',
    sectores: [
      { id: 'norte', nombre: 'Tribuna Norte',  tipo: 'General',      precio: 180, disponibles: 0, capacidad: 3200 },
      { id: 'sur',   nombre: 'Tribuna Sur',    tipo: 'General',      precio: 180, disponibles: 0, capacidad: 3200 },
      { id: 'este',  nombre: 'Lateral Este',   tipo: 'Preferencial', precio: 260, disponibles: 0, capacidad: 2400 },
      { id: 'oeste', nombre: 'Lateral Oeste',  tipo: 'Preferencial', precio: 260, disponibles: 0, capacidad: 2400 },
      { id: 'vip_n', nombre: 'VIP Norte',      tipo: 'VIP',          precio: 550, disponibles: 0, capacidad: 280  },
      { id: 'vip_s', nombre: 'VIP Sur',        tipo: 'VIP',          precio: 550, disponibles: 0, capacidad: 280  },
    ],
  },
  5: {
    id: 5,
    local: 'Francia', visitante: 'Polonia',
    estadio: 'BC Place', ciudad: 'Vancouver',
    fecha: '20 jun 2026', hora: '16:00',
    fase: 'Fase de grupos — Grupo D',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BC_Place_Vancouver_2011.jpg/800px-BC_Place_Vancouver_2011.jpg',
    sectores: [
      { id: 'norte', nombre: 'Tribuna Norte',  tipo: 'General',      precio: 95,  disponibles: 1800, capacidad: 3000 },
      { id: 'sur',   nombre: 'Tribuna Sur',    tipo: 'General',      precio: 95,  disponibles: 1600, capacidad: 3000 },
      { id: 'este',  nombre: 'Lateral Este',   tipo: 'Preferencial', precio: 140, disponibles: 820,  capacidad: 2200 },
      { id: 'oeste', nombre: 'Lateral Oeste',  tipo: 'Preferencial', precio: 140, disponibles: 750,  capacidad: 2200 },
      { id: 'vip_n', nombre: 'VIP Norte',      tipo: 'VIP',          precio: 420, disponibles: 45,   capacidad: 320  },
      { id: 'vip_s', nombre: 'VIP Sur',        tipo: 'VIP',          precio: 420, disponibles: 30,   capacidad: 320  },
    ],
  },
};
const TIPO_COLORES = {
  General:      { fill: '#378ADD', fillOpacity: 0.25, text: '#185FA5' },
  Preferencial: { fill: '#639922', fillOpacity: 0.25, text: '#3B6D11' },
  VIP:          { fill: '#BA7517', fillOpacity: 0.30, text: '#854F0B' },
  Agotado:      { fill: '#9E9E9E', fillOpacity: 0.20, text: '#757575' },
};

const MAX_POR_COMPRA = 8;

// Definición de paths SVG por sector — coordenadas del mapa esquemático
const SECTOR_PATHS = [
  {
    id: 'norte',
    d: 'M60,40 A155,125 0 0,1 260,40 L230,75 A100,80 0 0,0 90,75 Z',
    labelX: 160, labelY: 58,
  },
  {
    id: 'sur',
    d: 'M60,220 A155,125 0 0,0 260,220 L230,185 A100,80 0 0,1 90,185 Z',
    labelX: 160, labelY: 215,
  },
  {
    id: 'este',
    d: 'M265,40 A155,125 0 0,1 265,220 L230,185 A100,80 0 0,0 230,75 Z',
    labelX: 256, labelY: 130, rotate: 90,
  },
  {
    id: 'oeste',
    d: 'M55,40 A155,125 0 0,0 55,220 L90,185 A100,80 0 0,1 90,75 Z',
    labelX: 64, labelY: 130, rotate: -90,
  },
  {
    id: 'vip_n',
    d: 'M110,75 A100,80 0 0,1 210,75 L200,95 A75,60 0 0,0 120,95 Z',
    labelX: 160, labelY: 89,
  },
  {
    id: 'vip_s',
    d: 'M110,185 A100,80 0 0,0 210,185 L200,165 A75,60 0 0,1 120,165 Z',
    labelX: 160, labelY: 179,
  },
];

function EstadioSVG({ sectores, sectorSeleccionado, onSectorClick }) {
  const sectorMap = Object.fromEntries(sectores.map(s => [s.id, s]));

  return (
    <Box sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}>
      <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
        {/* Estadio base */}
        <ellipse cx="160" cy="130" rx="155" ry="125"
          fill="var(--color-bg, #F5F5F5)"
          stroke="#E0E0E0" strokeWidth="0.5" />

        {/* Cancha */}
        <ellipse cx="160" cy="130" rx="85" ry="65" fill="#3B6D11" opacity="0.15" />
        <ellipse cx="160" cy="130" rx="75" ry="55" fill="none" stroke="#3B6D11" strokeWidth="1" opacity="0.35" />
        <rect x="130" y="108" width="60" height="44" rx="2" fill="none" stroke="#3B6D11" strokeWidth="1" opacity="0.25" />
        <line x1="160" y1="108" x2="160" y2="152" stroke="#3B6D11" strokeWidth="0.5" opacity="0.35" />
        <text x="160" y="134" textAnchor="middle" fontSize="8" fill="#3B6D11" opacity="0.5"
          fontFamily="Inter, sans-serif">cancha</text>

        {/* Sectores */}
        {SECTOR_PATHS.map(sp => {
          const sector = sectorMap[sp.id];
          if (!sector) return null;
          const agotado = sector.disponibles === 0;
          const colores = agotado ? TIPO_COLORES.Agotado : TIPO_COLORES[sector.tipo];
          const isSelected = sectorSeleccionado?.id === sp.id;

          return (
            <g key={sp.id}>
              <path
                d={sp.d}
                fill={colores.fill}
                fillOpacity={colores.fillOpacity}
                stroke={isSelected ? '#042C53' : '#BDBDBD'}
                strokeWidth={isSelected ? 2 : 0.5}
                style={{ cursor: agotado ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                onClick={() => !agotado && onSectorClick(sector)}
                onMouseEnter={e => { if (!agotado) e.target.style.fillOpacity = colores.fillOpacity + 0.2; }}
                onMouseLeave={e => { e.target.style.fillOpacity = colores.fillOpacity; }}
              />
              <text
                x={sp.labelX}
                y={sp.labelY}
                textAnchor="middle"
                fontSize="9"
                fill={colores.text}
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                transform={sp.rotate ? `rotate(${sp.rotate},${sp.labelX},${sp.labelY})` : undefined}
              >
                {agotado ? `${sector.nombre.split(' ')[1] || sector.nombre} · Agotado` : `${sector.nombre.split(' ')[1] || sector.nombre} · USD ${sector.precio}`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="center" mt={1.5}>
        {[
          { label: 'General',      color: '#378ADD' },
          { label: 'Preferencial', color: '#639922' },
          { label: 'VIP',          color: '#BA7517' },
          { label: 'Agotado',      color: '#9E9E9E' },
        ].map(item => (
          <Stack key={item.label} direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color, opacity: 0.7 }} />
            <Typography fontSize={12} color="text.secondary">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function PanelSector({ sector, cantidad, onMenos, onMas, onContinuar }) {
  if (!sector) {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: 220, gap: 1.5,
        color: 'text.disabled', textAlign: 'center', px: 2,
      }}>
        <TouchAppIcon sx={{ fontSize: 32 }} />
        <Typography fontSize={14}>
          Hacé clic en un sector del mapa para ver disponibilidad y precio
        </Typography>
      </Box>
    );
  }

  const subtotal = sector.precio * cantidad;

  return (
    <Box>
      <Typography fontWeight={500} fontSize={18} mb={0.5}>{sector.nombre}</Typography>
      <Typography fontSize={13} color="text.secondary" mb={2}>
        {sector.tipo} · {sector.capacidad.toLocaleString()} butacas
      </Typography>

      <Stack direction="row" gap={1.5} mb={2}>
        <Box sx={{
          flex: 1, bgcolor: 'background.default', borderRadius: 2,
          border: '0.5px solid', borderColor: 'divider', p: 1.5,
        }}>
          <Typography fontSize={11} color="text.disabled" mb={0.25}>Precio unitario</Typography>
          <Typography fontWeight={500} fontSize={16}>USD {sector.precio}</Typography>
        </Box>
        <Box sx={{
          flex: 1, bgcolor: 'background.default', borderRadius: 2,
          border: '0.5px solid', borderColor: 'divider', p: 1.5,
        }}>
          <Typography fontSize={11} color="text.disabled" mb={0.25}>Disponibles</Typography>
          <Typography fontWeight={500} fontSize={16}>{sector.disponibles.toLocaleString()}</Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography fontSize={14}>Cantidad</Typography>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <IconButton
            size="small"
            onClick={onMenos}
            disabled={cantidad <= 1}
            sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.25 }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography fontWeight={500} fontSize={15} minWidth={20} textAlign="center">
            {cantidad}
          </Typography>
          <IconButton
            size="small"
            onClick={onMas}
            disabled={cantidad >= Math.min(MAX_POR_COMPRA, sector.disponibles)}
            sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.25 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={2}>
        <Typography fontSize={13} color="text.secondary">Total</Typography>
        <Typography fontWeight={500} fontSize={18}>USD {subtotal}</Typography>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={onContinuar}
        sx={{ py: 1.25, fontSize: 14 }}
      >
        Continuar al pago
      </Button>
    </Box>
  );
}

function DetalleEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    // Reemplazar con: fetch(`/api/eventos/${id}`).then(r => r.json()).then(setEvento)
    const data = MOCK_EVENTOS[parseInt(id)];
    if (data) setEvento(data);
    else navigate('/');
  }, [id, navigate]);
  

  const handleSectorClick = (sector) => {
    setSectorSeleccionado(sector);
    setCantidad(1);
  };

  const handleContinuar = () => {
    navigate('/checkout', {
      state: {
        evento,
        sector: sectorSeleccionado,
        cantidad,
      },
    });
  };

  if (!evento) return null;

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ height: 160, position: 'relative', overflow: 'hidden' }}>
        <Box
          component="img"
          src={evento.foto}
          alt={evento.estadio}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />

        {/* Back button */}
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute', top: 12, left: 16,
            bgcolor: 'rgba(0,0,0,0.35)', color: '#fff',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
          }}
          size="small"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: '16px 20px' }}>
          <Chip
            label={evento.fase}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, mb: 1, borderRadius: 1 }}
          />
          <Typography fontWeight={500} fontSize={22} color="#fff" mb={0.5}>
            {evento.visitante ? `${evento.local} vs. ${evento.visitante}` : evento.local}
          </Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <Typography fontSize={13} color="rgba(255,255,255,0.8)" display="flex" alignItems="center" gap={0.5}>
              <PlaceIcon sx={{ fontSize: 15 }} />{evento.estadio}, {evento.ciudad}
            </Typography>
            <Typography fontSize={13} color="rgba(255,255,255,0.8)" display="flex" alignItems="center" gap={0.5}>
              <CalendarTodayIcon sx={{ fontSize: 14 }} />{evento.fecha}
            </Typography>
            <Typography fontSize={13} color="rgba(255,255,255,0.8)" display="flex" alignItems="center" gap={0.5}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />{evento.hora} hs
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Contenido */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 300px' },
        minHeight: 420,
        borderTop: '0.5px solid',
        borderColor: 'divider',
      }}>
        {/* Mapa */}
        <Box sx={{
          p: { xs: 2, md: '20px 24px' },
          borderRight: { xs: 'none', md: '0.5px solid' },
          borderColor: 'divider',
        }}>
          <Typography
            fontSize={12} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1.75}
          >
            Seleccioná un sector
          </Typography>
          <EstadioSVG
            sectores={evento.sectores}
            sectorSeleccionado={sectorSeleccionado}
            onSectorClick={handleSectorClick}
          />
        </Box>

        {/* Panel lateral */}
        <Box sx={{ p: { xs: 2, md: '20px' } }}>
          <Typography
            fontSize={12} fontWeight={500} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.5} mb={1.75}
          >
            Resumen
          </Typography>
          <PanelSector
            sector={sectorSeleccionado}
            cantidad={cantidad}
            onMenos={() => setCantidad(c => Math.max(1, c - 1))}
            onMas={() => setCantidad(c => Math.min(Math.min(MAX_POR_COMPRA, sectorSeleccionado.disponibles), c + 1))}
            onContinuar={handleContinuar}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default DetalleEvento;
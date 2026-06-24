import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip,
  IconButton, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { getEvento, getSectoresEvento } from '../../api/eventos';
import EstadioSVGBase, { SECTOR_NOMBRES } from '../../components/shared/EstadioSVGBase';

const MAX_POR_COMPRA = 5;

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

  const subtotal = sector.costo * cantidad;

  return (
    <Box>
      <Typography fontWeight={500} fontSize={18} mb={0.5}>{SECTOR_NOMBRES[sector.codigo] || sector.codigo}</Typography>
      <Typography fontSize={13} color="text.secondary" mb={2}>
        {sector.capacidad_max.toLocaleString()} butacas
      </Typography>

      <Stack direction="row" gap={1.5} mb={2}>
        <Box sx={{
          flex: 1, bgcolor: 'background.default', borderRadius: 2,
          border: '0.5px solid', borderColor: 'divider', p: 1.5,
        }}>
          <Typography fontSize={11} color="text.disabled" mb={0.25}>Precio unitario</Typography>
          <Typography fontWeight={500} fontSize={16}>USD {sector.costo}</Typography>
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
  const [sectores, setSectores] = useState([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (!id) { navigate('/'); return; }
    const idNum = parseInt(id);
    Promise.all([
      getEvento(idNum),
      getSectoresEvento(idNum),
    ])
      .then(([ev, secs]) => {
        setEvento(ev);
        setSectores(secs);
      })
      .catch(() => navigate('/'));
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

  const fechaStr = evento.fecha_hora
    ? new Date(evento.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const horaStr = evento.fecha_hora
    ? new Date(evento.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';
  const titulo = evento.equipo_visitante
    ? `${evento.equipo_local} vs. ${evento.equipo_visitante}`
    : evento.equipo_local;

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ height: 160, position: 'relative', overflow: 'hidden', bgcolor: '#111' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }} />

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
          <Typography fontWeight={500} fontSize={22} color="#fff" mb={0.5}>{titulo}</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <Typography fontSize={13} color="rgba(255,255,255,0.8)" display="flex" alignItems="center" gap={0.5}>
              <CalendarTodayIcon sx={{ fontSize: 14 }} />{fechaStr}
            </Typography>
            {horaStr && (
              <Typography fontSize={13} color="rgba(255,255,255,0.8)" display="flex" alignItems="center" gap={0.5}>
                <AccessTimeIcon sx={{ fontSize: 14 }} />{horaStr} hs
              </Typography>
            )}
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
          <EstadioSVGBase
            sectores={sectores}
            selectedSectorId={sectorSeleccionado?.codigo}
            onSectorClick={handleSectorClick}
            pathSectorResolver={(index) => sectores[index] || null}
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
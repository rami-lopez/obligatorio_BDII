import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Paper, IconButton,
  Switch, Alert, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EstadioSVGAdmin from '../../components/admin/EstadioSVGAdmin';
import { getEvento, getSectoresAdmin, habilitarSector, deshabilitarSector } from '../../api/eventos';

const SECTOR_NOMBRES = {
  norte: 'Tribuna Norte',
  sur: 'Tribuna Sur',
  este: 'Lateral Este',
  oeste: 'Lateral Oeste',
  vip_n: 'VIP Norte',
  vip_s: 'VIP Sur',
};

const DATA_COLORES = {
  verde:  { fill: '#EAF3DE', color: '#27500A' },
  azul:   { fill: '#E6F1FB', color: '#185FA5' },
  gris:   { fill: '#F5F5F5', color: '#757575' },
};

function SectorRow({ sector, onToggle }) {
  const c = sector.habilitado
    ? sector.disponibles === 0 ? DATA_COLORES.gris : DATA_COLORES.verde
    : DATA_COLORES.gris;
  const bloqueada = sector.tieneEntradas && sector.habilitado;

  return (
    <Paper elevation={0} sx={{
      border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
      bgcolor: c.fill,
      opacity: bloqueada ? 0.7 : 1,
    }}>
      <Box>
        <Typography fontWeight={500} fontSize={14}>{SECTOR_NOMBRES[sector.codigo] || sector.codigo}</Typography>
        <Stack direction="row" gap={1.5} mt={0.25} flexWrap="wrap">
          <Typography fontSize={12} color="text.secondary">Cap. {sector.capacidad.toLocaleString()}</Typography>
          <Typography fontSize={12} color="text.secondary">USD {sector.precio}</Typography>
          {sector.habilitado && (
            <Typography fontSize={12} color={c.color}>
              {sector.disponibles.toLocaleString()} disponibles
            </Typography>
          )}
          {sector.vendidas > 0 && (
            <Typography fontSize={12} color="text.secondary">{sector.vendidas.toLocaleString()} vendidas</Typography>
          )}
          {bloqueada && (
            <Typography fontSize={11} color="error" fontWeight={500}>
              Tiene entradas — no se puede deshabilitar
            </Typography>
          )}
        </Stack>
      </Box>
      <Switch
        size="small"
        checked={sector.habilitado}
        disabled={bloqueada}
        onChange={() => onToggle(sector.codigo)}
      />
    </Paper>
  );
}

function AdminSectoresEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [sectores, setSectores] = useState(null);
  const originalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mapAdminSectores = (secs) =>
    secs.map(s => ({
      codigo: s.codigo,
      capacidad: s.capacidad_max,
      disponibles: s.disponibles,
      vendidas: s.vendidas,
      precio: s.costo,
      habilitado: s.habilitado,
      tieneEntradas: s.vendidas > 0,
    }));

  useEffect(() => {
    if (!id) { navigate('/admin/eventos'); return; }
    const idNum = parseInt(id);
    Promise.all([
      getEvento(idNum),
      getSectoresAdmin(idNum),
    ])
      .then(([ev, secs]) => {
        const mapped = mapAdminSectores(secs);
        setEvento(ev);
        setSectores(mapped);
        originalRef.current = mapped;
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const cambiosPendientes = sectores && originalRef.current
    ? sectores.some((s, i) => s.habilitado !== originalRef.current[i]?.habilitado)
    : false;

  const handleToggle = (codigo) => {
    setSectores(prev => {
      const s = prev.find(x => x.codigo === codigo);
      if (!s) return prev;
      if (s.habilitado && s.tieneEntradas) return prev;
      return prev.map(x => x.codigo === codigo ? { ...x, habilitado: !x.habilitado } : x);
    });
    setError('');
    setSuccess('');
  };

  const handleGuardar = async () => {
    if (!sectores || !originalRef.current) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const idNum = parseInt(id);
    const errores = [];

    for (const sector of sectores) {
      const original = originalRef.current.find(s => s.codigo === sector.codigo);
      if (!original || sector.habilitado === original.habilitado) continue;

      if (!sector.habilitado && sector.tieneEntradas) {
        errores.push(`${sector.codigo}: Tiene entradas vendidas, no se puede deshabilitar`);
        continue;
      }

      try {
        const resultado = sector.habilitado
          ? await habilitarSector(idNum, sector.codigo)
          : await deshabilitarSector(idNum, sector.codigo);

        if (Array.isArray(resultado)) {
          const mapped = mapAdminSectores(resultado);
          setSectores(mapped);
          originalRef.current = mapped;
        }
      } catch (err) {
        errores.push(`${sector.codigo}: ${err?.response?.data?.detail || 'Error'}`);
      }
    }

    setSaving(false);
    if (errores.length > 0) {
      setError('Errores al guardar:\n' + errores.join('\n'));
    } else {
      setSuccess('Cambios guardados correctamente');
    }
  };

  const handleCancelar = () => {
    if (originalRef.current) {
      setSectores([...originalRef.current]);
    }
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando sectores...</Typography>
      </Box>
    );
  }

  const habilitados = sectores?.filter(s => s.habilitado) || [];
  const capacidadTotal = sectores?.reduce((sum, s) => sum + s.capacidad, 0) || 0;
  const capacidadHabilitada = habilitados.reduce((sum, s) => sum + s.capacidad, 0);

  return (
    <Box>
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid', borderColor: 'divider',
        px: 3, height: 52,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <IconButton size="small" onClick={() => navigate('/admin/eventos')} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography fontWeight={500} fontSize={15}>
          {evento ? `${evento.equipo_local} vs. ${evento.equipo_visitante}` : 'Sectores'}
        </Typography>
        {evento && (
          <Typography fontSize={12} color="text.disabled">
            · Sectores
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {cambiosPendientes && (
          <>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
              onClick={handleCancelar}
              disabled={saving}
              sx={{ fontSize: 12 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
              onClick={handleGuardar}
              disabled={saving}
              sx={{ fontSize: 12 }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13, whiteSpace: 'pre-line' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, fontSize: 13 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Total sectores', val: sectores?.length || 0, sub: 'En el estadio' },
            { label: 'Capacidad estadio', val: capacidadTotal.toLocaleString(), sub: 'Butacas totales' },
            { label: 'Habilitados', val: habilitados.length, sub: 'Sectores habilitados' },
            { label: 'Cap. habilitada', val: `${capacidadHabilitada.toLocaleString()} / ${capacidadTotal.toLocaleString()}`, sub: 'Butacas disponibles' },
          ].map((s, i) => (
            <Paper key={i} elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
              <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
                {s.label}
              </Typography>
              <Typography fontWeight={500} fontSize={22} mb={0.25}>{s.val}</Typography>
              <Typography fontSize={11} color="text.secondary">{s.sub}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}>
          <Box>
            <Typography
              fontSize={12} fontWeight={500} color="text.secondary"
              textTransform="uppercase" letterSpacing={0.5} mb={1.5}
            >
              Mapa del estadio
            </Typography>
            <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <EstadioSVGAdmin
                sectores={sectores || []}
                onToggle={handleToggle}
              />
            </Paper>
          </Box>

          <Box>
            <Typography
              fontSize={12} fontWeight={500} color="text.secondary"
              textTransform="uppercase" letterSpacing={0.5} mb={1.5}
            >
              Lista de sectores
            </Typography>
            <Stack gap={1}>
              {sectores?.map(s => (
                <SectorRow key={s.codigo} sector={s} onToggle={handleToggle} />
              ))}
              {(!sectores || sectores.length === 0) && (
                <Typography fontSize={13} color="text.disabled" textAlign="center" py={4}>
                  No hay sectores cargados
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminSectoresEvento;

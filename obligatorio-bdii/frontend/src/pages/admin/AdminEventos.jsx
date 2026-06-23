import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Button, Paper, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem,
  Collapse, IconButton, Tabs, Tab, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { listarEventos, crearEvento, actualizarEvento } from '../../api/eventos';
import { listarEstadios } from '../../api/estadios';

const ESTADO_CONFIG = {
  proximo:  { label: 'Próximo',  bg: '#EAF3DE', color: '#27500A' },
  hoy:      { label: 'Hoy',      bg: '#E6F1FB', color: '#185FA5' },
  pasado:   { label: 'Pasado',   bg: '#F5F5F5', color: '#757575' },
};

function EstadoPill({ fecha_hora }) {
  const ahora = new Date();
  const fecha = new Date(fecha_hora);
  const diffDias = Math.floor((fecha - ahora) / (1000 * 60 * 60 * 24));
  let key;
  if (diffDias < 0) key = 'pasado';
  else if (diffDias === 0 && fecha.getDate() === ahora.getDate()) key = 'hoy';
  else key = 'proximo';
  const c = ESTADO_CONFIG[key];
  return (
    <Chip
      label={c.label} size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500 }}
    />
  );
}

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

const toLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const FORM_VACIO = {
  equipo_local: '', equipo_visitante: '', id_estadio: '',
  fecha_hora: '',
};

function FormEvento({ initial, onClose, onGuardar, estadios }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, id_estadio: initial.id_estadio ?? '', fecha_hora: toLocalDatetime(initial.fecha_hora) }
      : FORM_VACIO
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validar = () => {
    const e = {};
    if (!form.equipo_local.trim()) e.equipo_local = 'Requerido';
    if (!form.id_estadio) e.id_estadio = 'Requerido';
    if (!form.fecha_hora.trim()) e.fecha_hora = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = () => {
    if (!validar()) return;
    onGuardar({
      ...form,
      id_estadio: parseInt(form.id_estadio, 10),
      fecha_hora: new Date(form.fecha_hora).toISOString(),
    });
    onClose();
  };

  return (
    <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, mb: 2.5 }}>
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '0.5px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontWeight={500} fontSize={14}>
          {initial ? 'Editar evento' : 'Nuevo evento'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <TextField
          label="Equipo local" size="small"
          value={form.equipo_local} onChange={e => set('equipo_local', e.target.value)}
          error={!!errors.equipo_local} helperText={errors.equipo_local}
          placeholder="Ej: Argentina"
        />
        <TextField
          label="Equipo visitante" size="small"
          value={form.equipo_visitante} onChange={e => set('equipo_visitante', e.target.value)}
          placeholder="Ej: México (vacío si es Final)"
        />
        <TextField
          label="Estadio" size="small" select
          value={form.id_estadio} onChange={e => set('id_estadio', e.target.value)}
          error={!!errors.id_estadio} helperText={errors.id_estadio}
        >
          {estadios.map(s => <MenuItem key={s.id_estadio} value={s.id_estadio}>{s.nombre}</MenuItem>)}
        </TextField>
        <TextField
          label="Fecha y hora" size="small" type="datetime-local"
          value={form.fecha_hora} onChange={e => set('fecha_hora', e.target.value)}
          error={!!errors.fecha_hora} helperText={errors.fecha_hora}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Box sx={{
        px: 2, py: 1.5,
        borderTop: '0.5px solid', borderColor: 'divider',
        display: 'flex', justifyContent: 'flex-end', gap: 1,
      }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ fontSize: 13 }}>
          Cancelar
        </Button>
        <Button
          variant="contained" size="small"
          startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
          onClick={handleGuardar}
          sx={{ fontSize: 13 }}
        >
          Guardar evento
        </Button>
      </Box>
    </Paper>
  );
}

function AdminEventos() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [estadios, setEstadios] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tabFiltro, setTabFiltro] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const esPasado = (fecha_hora) => new Date(fecha_hora) < new Date();

  const estadioMap = useMemo(() =>
    Object.fromEntries(estadios.map(s => [s.id_estadio, s.nombre])),
  [estadios]);

  useEffect(() => {
    Promise.all([listarEventos(), listarEstadios()])
      .then(([evs, ests]) => {
        setEventos(evs);
        setEstadios(ests);
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = eventos.filter(e => {
    const ahora = new Date();
    const fecha = new Date(e.fecha_hora);
    const matchTab =
      tabFiltro === 0 ? true :
      tabFiltro === 1 ? fecha >= ahora :
      fecha < ahora;
    const nombreEstadio = estadioMap[e.id_estadio] || '';
    const matchQ = !busqueda.trim() ||
      `${e.equipo_local} ${e.equipo_visitante} ${nombreEstadio}`.toLowerCase().includes(busqueda.toLowerCase());
    return matchTab && matchQ;
  });

  const handleGuardar = async (form) => {
    try {
      if (editando) {
        const updated = await actualizarEvento(editando.id_evento, {
          fecha_hora: form.fecha_hora,
          equipo_local: form.equipo_local,
          equipo_visitante: form.equipo_visitante,
          id_estadio: form.id_estadio,
        });
        setEventos(prev => prev.map(e => e.id_evento === editando.id_evento ? updated : e));
      } else {
        const nuevo = await crearEvento(form);
        setEventos(prev => [nuevo, ...prev]);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al guardar evento');
    }
  };

  const handleEditar = (evento) => {
    setEditando(evento);
    setFormVisible(false);
  };

  const formatFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando eventos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Topbar */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid', borderColor: 'divider',
        px: 3, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontWeight={500} fontSize={15}>Eventos</Typography>
        <Button
          variant="contained" size="small"
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setFormVisible(v => !v); setEditando(null); }}
          sx={{ fontSize: 13 }}
        >
          Nuevo evento
        </Button>
      </Box>

      <Box sx={{ p: 3 }}>

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Total eventos', val: eventos.length, sub: 'Mundial 2026' },
            { label: 'Total estadios', val: estadios.length, sub: 'Disponibles' },
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

        {/* Formulario nuevo evento */}
        <Collapse in={formVisible}>
          <FormEvento
            estadios={estadios}
            onClose={() => setFormVisible(false)}
            onGuardar={handleGuardar}
          />
        </Collapse>

        {/* Formulario edición */}
        <Collapse in={!!editando}>
          {editando && (
            <FormEvento
              estadios={estadios}
              initial={editando}
              onClose={() => setEditando(null)}
              onGuardar={handleGuardar}
            />
          )}
        </Collapse>

        {/* Tabla */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography fontWeight={500} fontSize={13}>Todos los eventos</Typography>
            <TextField
              size="small"
              placeholder="Buscar evento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              sx={{ width: 200, '& .MuiInputBase-input': { fontSize: 13 } }}
            />
          </Box>

          <Tabs
            value={tabFiltro}
            onChange={(_, v) => setTabFiltro(v)}
            sx={{
              px: 2, borderBottom: '0.5px solid', borderColor: 'divider',
              '& .MuiTab-root': { fontSize: 12, textTransform: 'none', minHeight: 38, px: 1.5 },
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
            }}
          >
            <Tab label="Todos" />
            <Tab label="Próximos" />
            <Tab label="Finalizados" />
          </Tabs>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['Evento', 'Estadio', 'Fecha', 'Estado', ''].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map(e => (
                  <TableRow
                    key={e.id_evento}
                    sx={{ '&:hover': { bgcolor: 'background.default' }, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontSize: 13 }}>
                      {e.equipo_visitante ? `${e.equipo_local} vs. ${e.equipo_visitante}` : e.equipo_local}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {estadioMap[e.id_estadio] || `ID ${e.id_estadio}`}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{formatFecha(e.fecha_hora)}</TableCell>
                    <TableCell><EstadoPill fecha_hora={e.fecha_hora} /></TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        disabled={esPasado(e.fecha_hora)}
                        onClick={() => navigate(`/admin/eventos/${e.id_evento}/sectores`)}
                        sx={{ color: esPasado(e.fecha_hora) ? 'action.disabled' : 'text.secondary', '&:hover': { color: 'primary.main' }, mr: 0.5 }}
                      >
                        <TuneIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={esPasado(e.fecha_hora)}
                        onClick={() => handleEditar(e)}
                        sx={{ color: esPasado(e.fecha_hora) ? 'action.disabled' : 'text.secondary', '&:hover': { color: 'text.primary' } }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      No se encontraron eventos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default AdminEventos;
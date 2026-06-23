import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, MenuItem,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField,
  Collapse, IconButton, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { listarEstadios, listarSedes, crearEstadio } from '../../api/estadios';

const FORM_VACIO = { nombre: '', ciudad: '', id_sede: '' };

function FormEstadio({ onClose, onGuardar, sedes }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())  e.nombre  = 'Requerido';
    if (!form.ciudad.trim())  e.ciudad  = 'Requerido';
    if (!form.id_sede)        e.id_sede = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setSaving(true);
    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        ciudad: form.ciudad.trim(),
        id_sede: parseInt(form.id_sede, 10),
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, mb: 2.5 }}>
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '0.5px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontWeight={500} fontSize={14}>Nuevo estadio</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <TextField
          label="Nombre del estadio" size="small"
          value={form.nombre} onChange={e => set('nombre', e.target.value)}
          error={!!errors.nombre} helperText={errors.nombre}
          placeholder="Ej: Rose Bowl"
        />
        <TextField
          label="Ciudad" size="small"
          value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
          error={!!errors.ciudad} helperText={errors.ciudad}
          placeholder="Ej: Los Ángeles"
        />
        <TextField
          label="País (sede)" size="small" select
          value={form.id_sede} onChange={e => set('id_sede', e.target.value)}
          error={!!errors.id_sede} helperText={errors.id_sede}
        >
          {sedes.map(s => <MenuItem key={s.id_sede} value={s.id_sede}>{s.pais}</MenuItem>)}
        </TextField>
      </Box>

      <Box sx={{
        px: 2, py: 1.5,
        borderTop: '0.5px solid', borderColor: 'divider',
        display: 'flex', justifyContent: 'flex-end', gap: 1,
      }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ fontSize: 13 }} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained" size="small"
          startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
          onClick={handleGuardar}
          disabled={saving}
          sx={{ fontSize: 13 }}
        >
          {saving ? 'Guardando...' : 'Guardar estadio'}
        </Button>
      </Box>
    </Paper>
  );
}

function AdminEstadios() {
  const [estadios, setEstadios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarEstadios(), listarSedes()])
      .then(([ests, sds]) => {
        setEstadios(ests);
        setSedes(sds);
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const sedeMap = Object.fromEntries(sedes.map(s => [s.id_sede, s.pais]));

  const filtrados = estadios.filter(e => {
    const pais = sedeMap[e.id_sede] || '';
    return !busqueda.trim() ||
      `${e.nombre} ${e.ciudad} ${pais}`.toLowerCase().includes(busqueda.toLowerCase());
  });

  const handleGuardar = async (form) => {
    try {
      const nuevo = await crearEstadio(form);
      const pais = sedeMap[form.id_sede] || '';
      setEstadios(prev => [{ ...nuevo, pais }, ...prev]);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al crear estadio');
      throw err;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando estadios...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid', borderColor: 'divider',
        px: 3, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontWeight={500} fontSize={15}>Estadios</Typography>
        <Button
          variant="contained" size="small"
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setFormVisible(v => !v); }}
          sx={{ fontSize: 13 }}
        >
          Nuevo estadio
        </Button>
      </Box>

      <Box sx={{ p: 3 }}>

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Estadios registrados', val: estadios.length },
          ].map((s, i) => (
            <Paper key={i} elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
              <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
                {s.label}
              </Typography>
              <Typography fontWeight={500} fontSize={22}>{s.val}</Typography>
            </Paper>
          ))}
        </Box>

        <Collapse in={formVisible}>
          <FormEstadio
            sedes={sedes}
            onClose={() => { setFormVisible(false); setError(''); }}
            onGuardar={handleGuardar}
          />
        </Collapse>

        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography fontWeight={500} fontSize={13}>Estadios registrados</Typography>
            <TextField
              size="small"
              placeholder="Buscar estadio..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              sx={{ width: 200, '& .MuiInputBase-input': { fontSize: 13 } }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['Estadio', 'Ciudad', 'País'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                  {filtrados.map(e => (
                  <TableRow
                    key={e.id_estadio}
                    sx={{ '&:hover': { bgcolor: 'background.default' }, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{e.nombre}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{e.ciudad}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{sedeMap[e.id_sede] || e.pais || `ID ${e.id_sede}`}</TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      No se encontraron estadios
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

export default AdminEstadios;
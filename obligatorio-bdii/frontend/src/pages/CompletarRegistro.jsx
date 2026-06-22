import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button,
  MenuItem, Paper, Stack,
} from '@mui/material';
import { completarRegistro } from '../api/usuarios';
import { useAuth } from '../hooks/useAuth';

const PAISES = ['Uruguay', 'Argentina', 'Brasil', 'México', 'España', 'Francia', 'Otro'];
const TIPOS_DOC = ['Cédula de identidad', 'Pasaporte', 'DNI'];

export default function CompletarRegistro() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    pais_doc: '', tipo_doc: '', nro_doc: '',
    pais_dir: '', localidad: '', calle: '',
    nro_dir: '', cod_postal: '', telefonos: [],
  });
  const [telefono, setTelefono] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validar = () => {
    const e = {};
    ['pais_doc','tipo_doc','nro_doc','pais_dir','localidad','calle','nro_dir','cod_postal']
      .forEach(k => { if (!form[k].trim()) e[k] = 'Requerido'; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      const perfil = await completarRegistro({
        ...form,
        telefonos: telefono ? [telefono] : [],
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error al completar registro:', err);
      setErrors({ general: 'Hubo un error al guardar. Intentá de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: 'background.default',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 3, width: '100%', maxWidth: 560 }}>
        <Typography fontWeight={500} fontSize={18} mb={0.5}>Completá tu perfil</Typography>
        <Typography fontSize={13} color="text.secondary" mb={3}>
          Bienvenido{user?.name ? `, ${user.name}` : ''}. Necesitamos algunos datos antes de continuar.
        </Typography>

        <Typography fontSize={12} fontWeight={500} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
          Documento
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 1.5, mb: 2.5 }}>
          <TextField label="País" size="small" select value={form.pais_doc} onChange={e => set('pais_doc', e.target.value)} error={!!errors.pais_doc} helperText={errors.pais_doc}>
            {PAISES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField label="Tipo" size="small" select value={form.tipo_doc} onChange={e => set('tipo_doc', e.target.value)} error={!!errors.tipo_doc} helperText={errors.tipo_doc}>
            {TIPOS_DOC.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Número" size="small" value={form.nro_doc} onChange={e => set('nro_doc', e.target.value)} error={!!errors.nro_doc} helperText={errors.nro_doc} placeholder="Ej: 12345678" />
        </Box>

        <Typography fontSize={12} fontWeight={500} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
          Dirección
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
          <TextField label="País" size="small" select value={form.pais_dir} onChange={e => set('pais_dir', e.target.value)} error={!!errors.pais_dir} helperText={errors.pais_dir}>
            {PAISES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField label="Localidad" size="small" value={form.localidad} onChange={e => set('localidad', e.target.value)} error={!!errors.localidad} helperText={errors.localidad} placeholder="Ej: Montevideo" />
          <TextField label="Calle" size="small" value={form.calle} onChange={e => set('calle', e.target.value)} error={!!errors.calle} helperText={errors.calle} placeholder="Ej: 18 de Julio" />
          <TextField label="Número" size="small" value={form.nro_dir} onChange={e => set('nro_dir', e.target.value)} error={!!errors.nro_dir} helperText={errors.nro_dir} placeholder="Ej: 1234" />
          <TextField label="Código postal" size="small" value={form.cod_postal} onChange={e => set('cod_postal', e.target.value)} error={!!errors.cod_postal} helperText={errors.cod_postal} placeholder="Ej: 11000" />
          <TextField label="Teléfono (opcional)" size="small" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: +598 99 123456" />
        </Box>

        {errors.general && (
          <Typography fontSize={12} color="error.main" mb={1}>
            {errors.general}
          </Typography>
        )}

        <Button
          variant="contained" fullWidth size="large"
          onClick={handleGuardar} disabled={loading}
          sx={{ mt: 1, py: 1.25, fontSize: 14 }}
        >
          {loading ? 'Guardando...' : 'Continuar'}
        </Button>
      </Paper>
    </Box>
  );
}

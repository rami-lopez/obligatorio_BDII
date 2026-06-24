import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, TextField, InputAdornment, IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../hooks/useAuth';

export default function Registrar() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Ingresá tu email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email inválido';
    if (!password) return 'Ingresá una contraseña';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password);
      navigate('/completar-registro', { replace: true, state: { email: email.trim() } });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al crear la cuenta. Intentá de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            fontWeight={700}
            letterSpacing="-1px"
            sx={{ fontSize: { xs: 32, sm: 40 } }}
          >
            mundial
            <Box component="span" sx={{ color: '#C1440E' }}> 2026</Box>
          </Typography>
          <Typography
            fontSize={14}
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 300, mx: 'auto' }}
          >
            Creá tu cuenta para acceder al sistema de ticketing del Mundial 2026.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{
          border: '0.5px solid', borderColor: 'divider',
          borderRadius: 2, p: 3,
          textAlign: 'left',
        }}>
          <Typography fontWeight={500} fontSize={15} mb={0.5} textAlign="center">
            Crear cuenta
          </Typography>
          <Typography fontSize={13} color="text.secondary" mb={2.5} textAlign="center">
            Ingresá tu email y una contraseña segura
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              size="small"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={!!error && !!email}
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={!!error && !!password}
              sx={{ mb: 2 }}
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              error={!!error && !!confirmPassword}
              sx={{ mb: 1 }}
              autoComplete="new-password"
            />

            {error && (
              <Typography fontSize={12} color="error.main" sx={{ mt: 0.5, mb: 1 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.25, fontSize: 14, mt: 1.5 }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </Box>

          <Typography fontSize={13} color="text.secondary" textAlign="center" sx={{ mt: 2.5 }}>
            ¿Ya tenés cuenta?{' '}
            <Box
              component={RouterLink}
              to="/login"
              sx={{ color: 'secondary.main', fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Iniciar sesión
            </Box>
          </Typography>

          <Typography fontSize={11} color="text.disabled" mt={2.5} lineHeight={1.5} textAlign="center">
            Al continuar aceptás los términos y condiciones del sistema de ticketing del Mundial 2026
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

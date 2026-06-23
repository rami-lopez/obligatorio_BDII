import React from 'react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) return <Navigate to="/" replace />;

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
            Sistema de ticketing oficial del Mundial 2026.
            Gestioná tus entradas, estadios y eventos desde un solo lugar.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{
          border: '0.5px solid', borderColor: 'divider',
          borderRadius: 2, p: 3,
          textAlign: 'center',
        }}>
          <Typography fontWeight={500} fontSize={15} mb={0.5}>
            Bienvenido
          </Typography>
          <Typography fontSize={13} color="text.secondary" mb={2.5}>
            Accedé con tu cuenta para continuar
          </Typography>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => loginWithRedirect()}
            sx={{ py: 1.25, fontSize: 14, mb: 1.5 }}
          >
            Iniciar sesión
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
            sx={{ py: 1.25, fontSize: 14 }}
          >
            Crear cuenta
          </Button>

          <Typography fontSize={11} color="text.disabled" mt={2.5} lineHeight={1.5}>
            Al continuar aceptás los términos y condiciones del sistema de ticketing del Mundial 2026
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

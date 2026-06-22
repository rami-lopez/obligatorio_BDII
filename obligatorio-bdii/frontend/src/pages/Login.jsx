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
      <Paper elevation={0} sx={{
        border: '0.5px solid', borderColor: 'divider',
        borderRadius: 2, p: 4,
        width: '100%', maxWidth: 400,
        textAlign: 'center',
      }}>
        <Typography fontWeight={500} fontSize={22} letterSpacing="-0.3px" mb={0.5}>
          mundial <Box component="span" sx={{ color: '#C1440E' }}>2026</Box>
        </Typography>
        <Typography fontSize={13} color="text.secondary" mb={3}>
          Ticketing oficial del Mundial 2026
        </Typography>

        <Divider sx={{ mb: 3 }} />

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

        <Typography fontSize={11} color="text.disabled" mt={3} lineHeight={1.5}>
          Al continuar aceptás los términos y condiciones del sistema de ticketing del Mundial 2026
        </Typography>
      </Paper>
    </Box>
  );
}

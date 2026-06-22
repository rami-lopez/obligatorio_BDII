import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Chip, Avatar, Popover } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

function FuncionarioLayout() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const iniciales = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'F';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '0.5px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', px: { xs: 2, md: 3 }, justifyContent: 'space-between' }}>
          <Typography variant="body1" fontWeight={500} letterSpacing="-0.3px">
            mundial <Box component="span" sx={{ color: '#C1440E' }}>2026</Box>
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Typography fontSize={13} color="text.secondary">{user?.name || 'Funcionario'}</Typography>
            <Chip
              label="Funcionario"
              size="small"
              sx={{ bgcolor: '#FAEEDA', color: '#633806', fontSize: 11, height: 22, borderRadius: 1, fontWeight: 500 }}
            />
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#E6F1FB', color: '#185FA5', fontSize: 11, fontWeight: 500 }}>
              {iniciales}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: { mt: 1, width: 220, border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider' }}>
          <Typography fontSize={13} fontWeight={500} noWrap>{user?.name || 'Funcionario'}</Typography>
          <Typography fontSize={12} color="text.secondary" noWrap>{user?.email}</Typography>
        </Box>
        <Box sx={{ py: 0.5 }}>
          <Box
            onClick={() => { setAnchorEl(null); logout(); }}
            sx={{ px: 2, py: 1, fontSize: 13, cursor: 'pointer', color: 'error.main', '&:hover': { bgcolor: 'action.hover' } }}
          >
            Cerrar sesión
          </Box>
        </Box>
      </Popover>

      <Outlet />
    </Box>
  );
}

export default FuncionarioLayout;

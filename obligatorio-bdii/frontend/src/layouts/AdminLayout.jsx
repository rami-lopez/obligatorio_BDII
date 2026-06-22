import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Divider, Avatar, Popover,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StadiumIcon from '@mui/icons-material/Stadium';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  {
    section: 'Gestión',
    items: [
      { label: 'Eventos',       path: '/admin/eventos',       icon: <CalendarMonthIcon fontSize="small" /> },
      { label: 'Estadios',      path: '/admin/estadios',      icon: <StadiumIcon fontSize="small" /> },
      { label: 'Funcionarios',  path: '/admin/funcionarios',  icon: <PeopleIcon fontSize="small" /> },
    ],
  },
  {
    section: 'Reportes',
    items: [
      { label: 'Ventas',        path: '/admin/ventas',        icon: <BarChartIcon fontSize="small" /> },
      { label: 'Validaciones',  path: '/admin/validaciones',  icon: <QrCodeScannerIcon fontSize="small" /> },
    ],
  },
];

function SidebarItem({ item, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.25,
        px: 1.5, py: 0.875, mx: 0.75, borderRadius: 1.5,
        fontSize: 13, cursor: 'pointer',
        color: active ? 'primary.main' : 'text.secondary',
        fontWeight: active ? 500 : 400,
        bgcolor: active ? '#E6F1FB' : 'transparent',
        '&:hover': {
          bgcolor: active ? '#E6F1FB' : 'action.hover',
          color: active ? 'primary.main' : 'text.primary',
        },
        transition: 'all 0.15s',
        '& .MuiSvgIcon-root': { fontSize: 17, flexShrink: 0 },
      }}
    >
      {item.icon}
      {item.label}
    </Box>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const iniciales = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'A';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }}>

      {/* Sidebar */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderRight: '0.5px solid', borderColor: 'divider',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <Box sx={{ px: 2, py: 2, borderBottom: '0.5px solid', borderColor: 'divider' }}>
          <Typography
            fontWeight={500} fontSize={15} letterSpacing="-0.3px"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/eventos')}
          >
            mundial <Box component="span" sx={{ color: '#C1440E' }}>2026</Box>
          </Typography>
        </Box>

        {/* Nav */}
        <Box sx={{ flex: 1, py: 1.5, overflow: 'auto' }}>
          {NAV_ITEMS.map((group, gi) => (
            <Box key={gi} sx={{ mb: 1 }}>
              <Typography
                fontSize={10} fontWeight={500} color="text.disabled"
                textTransform="uppercase" letterSpacing={0.6}
                sx={{ px: 2.25, py: 0.75 }}
              >
                {group.section}
              </Typography>
              <Stack gap={0.25}>
                {group.items.map(item => (
                  <SidebarItem
                    key={item.path}
                    item={item}
                    active={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Usuario */}
        <Divider />
        <Box
          sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#E6F1FB', color: '#185FA5', fontSize: 11, fontWeight: 500 }}>
            {iniciales}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontSize={12} fontWeight={500} noWrap>{user?.name || 'Admin'}</Typography>
            <Typography fontSize={11} color="text.disabled">Administrador</Typography>
          </Box>
        </Box>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{
            elevation: 0,
            sx: { mt: 1, width: 220, border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider' }}>
            <Typography fontSize={13} fontWeight={500} noWrap>{user?.name || 'Admin'}</Typography>
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
      </Box>

      {/* Contenido */}
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflow: 'auto' }}>
        <Outlet />
      </Box>

    </Box>
  );
}

// Stack sin import — lo usamos inline
function Stack({ children, gap, ...props }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap, ...props.sx }}>
      {children}
    </Box>
  );
}

export default AdminLayout;
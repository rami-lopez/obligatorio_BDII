import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Typography, InputBase,
  IconButton, Avatar, Badge, Popover, List,
  ListItem, ListItemText, Divider, ListItemIcon,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../hooks/useAuth';
import { listarNotificaciones } from '../../api/notificaciones';

const ICONO_POR_TIPO = {
  transferencia_recibida:  <SwapHorizIcon fontSize="small" sx={{ color: 'secondary.main' }} />,
  transferencia_aceptada:  <CheckCircleIcon fontSize="small" sx={{ color: '#3B6D11' }} />,
  transferencia_rechazada: <CancelIcon fontSize="small" sx={{ color: '#791F1F' }} />,
};

function formatearTiempo(fecha_creacion) {
  if (!fecha_creacion) return '';
  const diff = Date.now() - new Date(fecha_creacion).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  return `Hace ${dias} d`;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { perfil, user, logout, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const intervalRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await listarNotificaciones();
      setNotifs(data);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifs();
    intervalRef.current = setInterval(fetchNotifs, 15000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifs]);

  const unread = notifs.filter(n => !n.leida).length;

  const iniciales = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  const handleBellClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleBellClose = () => setAnchorEl(null);

  const handleAvatarClick = (e) => setAvatarAnchor(e.currentTarget);
  const handleAvatarClose = () => setAvatarAnchor(null);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Mis entradas', path: '/mis-entradas', icon: <ConfirmationNumberIcon fontSize="small" /> },
    { label: 'Transferencias', path: '/transferencias', icon: <SwapHorizIcon fontSize="small" /> },
  ];

  return (
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
      <Toolbar sx={{ gap: 2, minHeight: '56px !important', px: { xs: 2, md: 3 } }}>

        {/* Logo */}
        <Typography
          variant="body1"
          fontWeight={500}
          letterSpacing="-0.3px"
          sx={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          mundial <Box component="span" sx={{ color: '#C1440E' }}>2026</Box>
        </Typography>

        {/* Nav links */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          {navLinks.map(link => (
            <Box
              key={link.path}
              onClick={() => navigate(link.path)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.75, borderRadius: 1, cursor: 'pointer',
                fontSize: 13,
                color: location.pathname === link.path ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === link.path ? 500 : 400,
                bgcolor: location.pathname === link.path ? '#E6F1FB' : 'transparent',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                transition: 'all 0.15s',
              }}
            >
              {link.icon}
              {link.label}
            </Box>
          ))}
        </Box>

        {/* Search */}
        <Box
          sx={{
            flex: 1, maxWidth: 360, mx: 'auto',
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: 'background.default',
            border: '0.5px solid', borderColor: 'divider',
            borderRadius: 2, px: 1.5, py: 0.75,
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
          <InputBase
            placeholder="Buscar partido, sede, equipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            sx={{ fontSize: 13, width: '100%', color: 'text.primary' }}
          />
        </Box>

        {/* Bell */}
        <IconButton size="small" onClick={handleBellClick} sx={{ color: 'text.secondary' }}>
          <Badge badgeContent={unread} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 14, height: 14 } }}>
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>

        {/* Notif popover */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleBellClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1, width: 320, border: '0.5px solid', borderColor: 'divider',
              borderRadius: 2, overflow: 'hidden',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider' }}>
            <Typography fontSize={13} fontWeight={500}>Notificaciones</Typography>
          </Box>
          {notifs.length === 0 ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
              Sin notificaciones
            </Box>
          ) : (
            <List disablePadding>
              {notifs.map((n, i) => (
                <React.Fragment key={n.id_notificacion}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer',
                      bgcolor: n.leida ? 'transparent' : '#F0F7FF',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => { handleBellClose(); navigate('/transferencias'); }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                      {ICONO_POR_TIPO[n.tipo] || <SwapHorizIcon fontSize="small" sx={{ color: 'secondary.main' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontSize={13}>{n.mensaje}</Typography>}
                      secondary={<Typography fontSize={11} color="text.disabled">{formatearTiempo(n.fecha_creacion)}</Typography>}
                    />
                  </ListItem>
                  {i < notifs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Popover>

        {/* Avatar */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            onClick={handleAvatarClick}
            sx={{
              width: 32, height: 32,
              bgcolor: '#E6F1FB', color: '#185FA5',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {iniciales}
          </Avatar>
        </Box>

        {/* User menu popover */}
        <Popover
          open={Boolean(avatarAnchor)}
          anchorEl={avatarAnchor}
          onClose={handleAvatarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1, width: 220,
              border: '0.5px solid', borderColor: 'divider',
              borderRadius: 2, overflow: 'hidden',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider' }}>
            <Typography fontSize={13} fontWeight={500} noWrap>{user?.name || 'Usuario'}</Typography>
            <Typography fontSize={12} color="text.secondary" noWrap>{user?.email}</Typography>
          </Box>
          <Box sx={{ py: 0.5 }}>
            <Box
              onClick={() => { handleAvatarClose(); logout(); }}
              sx={{
                px: 2, py: 1, fontSize: 13, cursor: 'pointer',
                color: 'error.main',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Cerrar sesión
            </Box>
          </Box>
        </Popover>

      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
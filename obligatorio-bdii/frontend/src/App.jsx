import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { CircularProgress, Box } from '@mui/material';

import ClienteLayout from './layouts/ClienteLayout';
import AdminLayout from './layouts/AdminLayout';
import FuncionarioLayout from './layouts/FuncionarioLayout';

import Catalogo from './pages/cliente/Catalogo';
import DetalleEvento from './pages/cliente/DetalleEvento';
import Checkout from './pages/cliente/Checkout';
import MisEntradas from './pages/cliente/MisEntradas';
import Transferencias from './pages/cliente/Transferencias';
import AdminEventos from './pages/admin/AdminEventos';
import AdminEstadios from './pages/admin/AdminEstadios';
import AdminSectoresEvento from './pages/admin/AdminSectoresEvento';
import AdminFuncionarios from './pages/admin/AdminFuncionarios';
import ValidacionQR from './pages/funcionario/ValidacionQR';
import CompletarRegistro from './pages/CompletarRegistro';
import Login from './pages/Login';

function LoadingScreen() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function RutaProtegida({ children, rolesPermitidos }) {
  const { isAuthenticated, isLoading, tokenListo, rol, loginWithRedirect } = useAuth();

  if (isLoading || (isAuthenticated && !tokenListo)) return <LoadingScreen />;

  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  if (rol === 'sin_registro') return <Navigate to="/completar-registro" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    if (rol === 'administrador') return <Navigate to="/admin/eventos" replace />;
    if (rol === 'funcionario')   return <Navigate to="/funcionario" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

function LandingRedirect() {
  const { isAuthenticated, isLoading, tokenListo, rol } = useAuth();

  if (isLoading || (isAuthenticated && !tokenListo)) return <LoadingScreen />;

  if (!isAuthenticated) return <Login />;

  if (rol === 'sin_registro') return <Navigate to="/completar-registro" replace />;

  if (rol === 'administrador') return <Navigate to="/admin/eventos" replace />;
  if (rol === 'funcionario')   return <Navigate to="/funcionario" replace />;

  return <Catalogo />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LandingRedirect />} />
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/completar-registro" element={<CompletarRegistro />} />

      <Route element={
        <RutaProtegida rolesPermitidos={['usuario_general', 'administrador', 'funcionario']}>
          <ClienteLayout />
        </RutaProtegida>
      }>
        <Route path="evento/:id" element={<DetalleEvento />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="mis-entradas" element={<MisEntradas />} />
        <Route path="transferencias" element={<Transferencias />} />
      </Route>

      <Route path="/admin" element={
        <RutaProtegida rolesPermitidos={['administrador']}>
          <AdminLayout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="/admin/eventos" replace />} />
        <Route path="eventos" element={<AdminEventos />} />
        <Route path="eventos/:id/sectores" element={<AdminSectoresEvento />} />
        <Route path="estadios" element={<AdminEstadios />} />
        <Route path="funcionarios" element={<AdminFuncionarios />} />
      </Route>

      <Route path="/funcionario" element={
        <RutaProtegida rolesPermitidos={['funcionario']}>
          <FuncionarioLayout />
        </RutaProtegida>
      }>
        <Route index element={<ValidacionQR />} />
      </Route>

      <Route path="*" element={<LandingRedirect />} />
    </Routes>
  );
}

export default App;

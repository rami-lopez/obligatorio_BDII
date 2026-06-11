import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Layouts
import ClienteLayout from './layouts/ClienteLayout';
import AdminLayout from './layouts/AdminLayout';
import FuncionarioLayout from './layouts/FuncionarioLayout';

// Vistas cliente
import Catalogo from './pages/cliente/Catalogo';
import DetalleEvento from './pages/cliente/DetalleEvento';
import Checkout from './pages/cliente/Checkout';
import MisEntradas from './pages/cliente/MisEntradas';
import Transferencias from './pages/cliente/Transferencias';

// Vistas admin
import AdminEventos from './pages/admin/AdminEventos';
import AdminEstadios from './pages/admin/AdminEstadios';

// Vista funcionario
import ValidacionQR from './pages/funcionario/ValidacionQR';

// Auth mock — reemplazar con contexto real cuando esté el backend
const ROL = 'cliente'; // 'cliente' | 'admin' | 'funcionario'

function App() {
	return (
		<Routes>
			{ROL === 'cliente' ? (
				<Route element={<ClienteLayout />}>
					<Route path="/" element={<Navigate to="/catalogo" replace />} />
					<Route path="/catalogo" element={<Catalogo />} />
					<Route path="/eventos/:id" element={<DetalleEvento />} />
					<Route path="/checkout" element={<Checkout />} />
					<Route path="/mis-entradas" element={<MisEntradas />} />
					<Route path="/transferencias" element={<Transferencias />} />
				</Route>
			) : null}

			{ROL === 'admin' ? (
				<Route element={<AdminLayout />}>
					<Route path="/" element={<Navigate to="/admin/eventos" replace />} />
					<Route path="/admin/eventos" element={<AdminEventos />} />
					<Route path="/admin/estadios" element={<AdminEstadios />} />
				</Route>
			) : null}

			{ROL === 'funcionario' ? (
				<Route element={<FuncionarioLayout />}>
					<Route path="/" element={<Navigate to="/funcionario/validacion-qr" replace />} />
					<Route path="/funcionario/validacion-qr" element={<ValidacionQR />} />
				</Route>
			) : null}

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default App;

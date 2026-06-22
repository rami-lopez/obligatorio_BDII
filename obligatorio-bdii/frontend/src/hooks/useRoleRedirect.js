import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const DESTINO_POR_ROL = {
  administrador:    '/admin/eventos',
  funcionario:      '/funcionario',
  usuario_general:  '/',
};

export function useRoleRedirect() {
  const { isAuthenticated, isLoading, rol, tokenListo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !tokenListo || !rol) return;
    if (rol === 'sin_registro') {
      navigate('/completar-registro', { replace: true });
      return;
    }
    const destino = DESTINO_POR_ROL[rol];
    if (destino) navigate(destino, { replace: true });
  }, [isAuthenticated, isLoading, tokenListo, rol, navigate]);
}

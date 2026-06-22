import React, { createContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthToken } from '../api/client';
import { getMe } from '../api/usuarios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const [perfil, setPerfil]       = useState(null);
  const [rol, setRol]             = useState(null);
  const [tokenListo, setTokenListo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        const token = await getAccessTokenSilently();
        setAuthToken(token);
        setTokenListo(true);

        const me = await getMe();
        setPerfil(me);
        setRol(me.role);
      } catch (err) {
        if (err?.response?.status === 404) {
          setRol('sin_registro');
        } else {
          console.error('Error al obtener perfil:', err);
        }
      }
    };

    init();
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const token = await getAccessTokenSilently({ ignoreCache: true });
        setAuthToken(token);
      } catch (e) {
        console.error('Error al refrescar token:', e);
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      tokenListo,
      user,
      perfil,
      rol,
      loginWithRedirect,
      logout: () => logout({ returnTo: window.location.origin }),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

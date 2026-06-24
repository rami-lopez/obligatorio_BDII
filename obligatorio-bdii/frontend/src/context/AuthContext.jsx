import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { setAuthToken } from '../api/client';
import { login as apiLogin, register as apiRegister, refreshToken as apiRefresh, logout as apiLogout, getMe } from '../api/auth';
import { getMe as getPerfil } from '../api/usuarios';

export const AuthContext = createContext(null);

const ACCESS_KEY = 'ticketing_access_token';
const REFRESH_KEY = 'ticketing_refresh_token';
const EXPIRES_KEY = 'ticketing_expires_at';
const ID_TOKEN_KEY = 'ticketing_id_token';

function loadFromStorage() {
  try {
    return {
      access_token: localStorage.getItem(ACCESS_KEY),
      refresh_token: localStorage.getItem(REFRESH_KEY),
      expires_at: localStorage.getItem(EXPIRES_KEY) ? Number(localStorage.getItem(EXPIRES_KEY)) : null,
      id_token: localStorage.getItem(ID_TOKEN_KEY),
    };
  } catch {
    return { access_token: null, refresh_token: null, expires_at: null, id_token: null };
  }
}

function saveToStorage(access_token, refresh_token, expires_in, id_token) {
  try {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    else localStorage.removeItem(ACCESS_KEY);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
    else localStorage.removeItem(REFRESH_KEY);
    if (id_token) localStorage.setItem(ID_TOKEN_KEY, id_token);
    else localStorage.removeItem(ID_TOKEN_KEY);
    if (expires_in) localStorage.setItem(EXPIRES_KEY, String(Date.now() + expires_in * 1000));
    else localStorage.removeItem(EXPIRES_KEY);
  } catch { /* ignore */ }
}

function clearStorage() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [rol, setRol] = useState(null);
  const [tokenListo, setTokenListo] = useState(false);

  const refreshIntervalRef = useRef(null);

  const obtainProfile = useCallback(async (access_token) => {
    setAuthToken(access_token);
    setTokenListo(true);
    try {
      const me = await getPerfil();
      setPerfil(me);
      setRol(me.role);
      return me;
    } catch (err) {
      if (err?.response?.status === 404) {
        setRol('sin_registro');
        return null;
      }
      throw err;
    }
  }, []);

  const setSession = useCallback(async (access_token, refresh_token, expires_in, id_token) => {
    saveToStorage(access_token, refresh_token, expires_in, id_token);
    setAuthToken(access_token);
    setTokenListo(true);
    setIsAuthenticated(true);

    if (id_token) {
      try {
        const payload = JSON.parse(atob(id_token.split('.')[1]));
        setUser({ name: payload.name || payload.nickname || payload.email, email: payload.email, picture: payload.picture, sub: payload.sub });
      } catch { /* ignore */ }
    }

    try {
      const me = await getPerfil();
      setPerfil(me);
      setRol(me.role);
    } catch (err) {
      if (err?.response?.status === 404) {
        setRol('sin_registro');
      }
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    await setSession(data.access_token, data.refresh_token, data.expires_in, data.id_token);
    return data;
  }, [setSession]);

  const register = useCallback(async (email, password) => {
    const data = await apiRegister(email, password);
    await setSession(data.access_token, data.refresh_token, data.expires_in, data.id_token);
    return data;
  }, [setSession]);

  const logout = useCallback(async () => {
    const stored = loadFromStorage();
    if (stored.refresh_token) {
      try { await apiLogout(stored.refresh_token); } catch { /* ignore */ }
    }
    clearStorage();
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setPerfil(null);
    setRol(null);
    setTokenListo(false);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

    const refreshProfile = useCallback(async () => {
      try {
        const me = await getPerfil();
        setPerfil(me);
        setRol(me.role);
        return me;
      } catch (err) {
        if (err?.response?.status === 404) {
          setRol('sin_registro');
        }
        return null;
      }
    }, []);

    const tryRefresh = useCallback(async () => {
    const stored = loadFromStorage();
    if (!stored.refresh_token) return false;
    try {
      const data = await apiRefresh(stored.refresh_token);
      saveToStorage(data.access_token, data.refresh_token || stored.refresh_token, data.expires_in, data.id_token);
      setAuthToken(data.access_token);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const stored = loadFromStorage();
      if (stored.access_token) {
        setAuthToken(stored.access_token);
        try {
          await obtainProfile(stored.access_token);
          setIsAuthenticated(true);
          if (stored.id_token) {
            try {
              const payload = JSON.parse(atob(stored.id_token.split('.')[1]));
              setUser({ name: payload.name || payload.nickname || payload.email, email: payload.email, picture: payload.picture, sub: payload.sub });
            } catch { /* ignore */ }
          }
        } catch {
          const refreshed = await tryRefresh();
          if (refreshed) {
            try {
              await obtainProfile(loadFromStorage().access_token);
              setIsAuthenticated(true);
            } catch {
              clearStorage();
              setAuthToken(null);
            }
          } else {
            clearStorage();
            setAuthToken(null);
          }
        }
      }
      setIsLoading(false);
    };
    init();
  }, [obtainProfile, tryRefresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      const stored = loadFromStorage();
      if (!stored.refresh_token) return;
      try {
        const data = await apiRefresh(stored.refresh_token);
        saveToStorage(data.access_token, data.refresh_token || stored.refresh_token, data.expires_in, data.id_token);
        setAuthToken(data.access_token);
      } catch { /* ignore */ }
    }, 50 * 60 * 1000);
    refreshIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      tokenListo,
      user,
      perfil,
      rol,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

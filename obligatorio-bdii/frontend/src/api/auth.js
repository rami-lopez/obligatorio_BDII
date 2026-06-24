import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then(r => r.data);

export const register = (email, password) =>
  client.post('/auth/register', { email, password }).then(r => r.data);

export const refreshToken = (refresh_token) =>
  client.post('/auth/refresh', { refresh_token }).then(r => r.data);

export const logout = (refresh_token) =>
  client.post('/auth/logout', { refresh_token }).then(r => r.data);

export const getMe = () =>
  client.get('/auth/me').then(r => r.data);

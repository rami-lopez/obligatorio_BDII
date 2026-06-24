import client from './client';

export const listarEntradas = () =>
  client.get('/entradas/').then(r => r.data);

export const getEntrada = (id) =>
  client.get(`/entradas/${id}`).then(r => r.data);

export const getQR = (id) =>
  client.get(`/entradas/${id}/qr`).then(r => r.data);

export const getHistorialEntrada = (id) =>
  client.get(`/entradas/${id}/historial`).then(r => r.data);

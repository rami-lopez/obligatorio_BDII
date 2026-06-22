import client from './client';

export const listarEventos = () =>
  client.get('/eventos/').then(r => r.data);

export const getEvento = (id) =>
  client.get(`/eventos/${id}`).then(r => r.data);

export const getSectoresEvento = (id) =>
  client.get(`/eventos/${id}/sectores`).then(r => r.data);

export const crearEvento = (data) =>
  client.post('/eventos/', data).then(r => r.data);

export const actualizarEvento = (id, data) =>
  client.patch(`/eventos/${id}`, data).then(r => r.data);

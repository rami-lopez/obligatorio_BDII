import client from './client';

export const listarEstadios = () =>
  client.get('/estadios/').then(r => r.data);

export const listarSedes = () =>
  client.get('/sedes/').then(r => r.data);

export const getEstadio = (id) =>
  client.get(`/estadios/${id}`).then(r => r.data);

export const getSectoresEstadio = (id) =>
  client.get(`/estadios/${id}/sectores`).then(r => r.data);

export const crearEstadio = (data) =>
  client.post('/estadios/', data).then(r => r.data);

export const crearSector = (idEstadio, data) =>
  client.post(`/estadios/${idEstadio}/sectores`, data).then(r => r.data);

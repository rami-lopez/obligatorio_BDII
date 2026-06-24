import client from './client';

export const getMisSectores = (idEvento) =>
  client.get(`/validacion/${idEvento}/mis-sectores`).then(r => r.data);

export const getDispositivos = () =>
  client.get('/validacion/dispositivos/me').then(r => r.data);

export const postValidacion = (data) =>
  client.post('/validacion/', data).then(r => r.data);
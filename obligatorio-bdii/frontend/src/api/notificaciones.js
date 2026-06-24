import client from './client';

export const listarNotificaciones = () =>
  client.get('/notificaciones/').then(r => r.data);

export const leerNotificacion = (id) =>
  client.patch(`/notificaciones/${id}/leer`).then(r => r.data);

export const leerTodasNotificaciones = () =>
  client.patch('/notificaciones/leer-todas').then(r => r.data);

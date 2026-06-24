import client from './client';

export const listarTransferencias = () =>
  client.get('/transferencias/').then(r => r.data);

export const crearTransferencia = (data) =>
  client.post('/transferencias/', data).then(r => r.data);

export const getPendientes = () =>
  client.get('/transferencias/pendientes').then(r => r.data);

export const aceptarTransferencia = (id) =>
  client.patch(`/transferencias/${id}/aceptar`).then(r => r.data);

export const rechazarTransferencia = (id) =>
  client.patch(`/transferencias/${id}/rechazar`).then(r => r.data);

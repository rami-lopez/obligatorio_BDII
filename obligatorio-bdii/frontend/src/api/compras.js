import client from './client';

export const comprar = (data) =>
  client.post('/compras/', data).then(r => r.data);

export const getVenta = (id) =>
  client.get(`/compras/${id}`).then(r => r.data);

export const confirmarPago = (id) =>
  client.post(`/compras/${id}/confirmar`).then(r => r.data);

export const anularPago = (id) =>
  client.post(`/compras/${id}/anular`).then(r => r.data);

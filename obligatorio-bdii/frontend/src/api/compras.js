import client from './client';

export const comprar = (data) =>
  client.post('/compras/', data).then(r => r.data);

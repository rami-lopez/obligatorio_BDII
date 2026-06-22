import client from './client';

export const getEventosMasVendidos = () =>
  client.get('/reportes/eventos-mas-vendidos').then(r => r.data);

export const getMayoresCompradores = () =>
  client.get('/reportes/mayores-compradores').then(r => r.data);

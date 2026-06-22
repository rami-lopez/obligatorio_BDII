import client from './client';

export const getMe = () =>
  client.get('/usuarios/me').then(r => r.data);

export const completarRegistro = (data) =>
  client.post('/usuarios/registro', data).then(r => r.data);

export const getUsuario = (mail) =>
  client.get(`/usuarios/${mail}`).then(r => r.data);

export const editarUsuario = (mail, data) =>
  client.put(`/usuarios/${mail}`, data).then(r => r.data);

export const ascenderFuncionario = (mail, nroLegajo) =>
  client.post(`/usuarios/${mail}/ascender-funcionario`, { nro_legajo: nroLegajo }).then(r => r.data);

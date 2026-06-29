import client from './client';

export const listarFuncionarios = () =>
  client.get('/admin/funcionarios').then(r => r.data);

export const buscarUsuarios = (q) =>
  client.get('/admin/usuarios/buscar', { params: { q } }).then(r => r.data);

export const getAsignaciones = (mail) =>
  client.get(`/admin/funcionarios/${encodeURIComponent(mail)}/asignaciones`).then(r => r.data);

export const asignarSector = (mail, payload) =>
  client.post(`/admin/funcionarios/${encodeURIComponent(mail)}/asignaciones`, payload).then(r => r.data);

export const desasignarSector = (mail, id_evento, id_estadio, codigo_sector) =>
  client.delete(`/admin/funcionarios/${encodeURIComponent(mail)}/asignaciones`, {
    params: { id_evento, id_estadio, codigo_sector }
  }).then(r => r.data);

export const listarDispositivosFuncionario = (mail) =>
  client.get(`/admin/funcionarios/${encodeURIComponent(mail)}/dispositivos`).then(r => r.data);

export const listarTodosDispositivos = () =>
  client.get('/admin/dispositivos').then(r => r.data);

export const crearDispositivo = (mail, payload) =>
  client.post(`/admin/funcionarios/${encodeURIComponent(mail)}/dispositivos`, payload).then(r => r.data);

export const asignarDispositivoExistente = (mail, payload) =>
  client.post(`/admin/funcionarios/${encodeURIComponent(mail)}/dispositivos/asignar-existente`, payload).then(r => r.data);

export const eliminarDispositivo = (mail, identificador) =>
  client.delete(`/admin/funcionarios/${encodeURIComponent(mail)}/dispositivos/${encodeURIComponent(identificador)}`).then(r => r.data);

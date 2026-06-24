import client from './client';

export const getMiEvento = async () => {
  const res = await client.get('/funcionarios/me/evento');
  return res.data;
};
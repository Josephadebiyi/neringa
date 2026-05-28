import axios from 'axios';
import config from './config';
import { secureStorage } from './storage';

const api = axios.create({ baseURL: config.apiUrl });

api.interceptors.request.use(async (req) => {
  const token = await secureStorage.getItem('accessToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default api;

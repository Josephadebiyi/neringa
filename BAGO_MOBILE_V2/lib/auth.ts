import axios from 'axios';
import config from './config';
import { secureStorage } from './storage';

const api = axios.create({ baseURL: config.apiUrl, withCredentials: false });

api.interceptors.request.use(async (req) => {
  const token = await secureStorage.getItem('accessToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/api/bago/signin', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    if (accessToken) await secureStorage.setItem('accessToken', accessToken);
    if (refreshToken) await secureStorage.setItem('refreshToken', refreshToken);
    return { user, accessToken };
  },

  async googleLogin(payload: { idToken?: string; accessToken?: string }) {
    const res = await api.post('/api/bago/google-auth', payload);
    const { accessToken, refreshToken, user } = res.data;
    if (accessToken) await secureStorage.setItem('accessToken', accessToken);
    if (refreshToken) await secureStorage.setItem('refreshToken', refreshToken);
    return { user, accessToken };
  },

  async getUser() {
    const res = await api.get('/api/bago/getuser');
    return res.data?.user || null;
  },

  async logout() {
    try { await api.get('/api/bago/logout'); } catch (_) {}
    await secureStorage.removeItem('accessToken');
    await secureStorage.removeItem('refreshToken');
  },
};

export default authService;

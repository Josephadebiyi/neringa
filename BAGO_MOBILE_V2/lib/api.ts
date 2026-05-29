import axios from 'axios';
import config from './config';
import { secureStorage } from './storage';

const api = axios.create({ baseURL: config.apiUrl });

api.interceptors.request.use(async (req) => {
  const token = await secureStorage.getItem('accessToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthEndpoint =
      original?.url?.includes('/signin') ||
      original?.url?.includes('/signup') ||
      original?.url?.includes('/refresh-token');

    if (error.response?.status !== 401 || original?._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }
    original._retried = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
        setTimeout(() => reject(error), 10_000);
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await secureStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('no_refresh_token');

      const res = await axios.post(`${config.apiUrl}/api/bago/refresh-token`, { refreshToken });
      const newAccess: string = res.data.token || res.data.accessToken;
      const newRefresh: string = res.data.refreshToken;

      await secureStorage.setItem('accessToken', newAccess);
      if (newRefresh) await secureStorage.setItem('refreshToken', newRefresh);

      refreshQueue.forEach((cb) => cb(newAccess));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      refreshQueue = [];
      await secureStorage.removeItem('accessToken');
      await secureStorage.removeItem('refreshToken');
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

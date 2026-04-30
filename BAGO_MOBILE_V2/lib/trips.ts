import axios from 'axios';
import config from './config';
import { secureStorage } from './storage';

const api = axios.create({ baseURL: config.apiUrl });

api.interceptors.request.use(async (req) => {
  const token = await secureStorage.getItem('accessToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const tripService = {
  async getMyTrips() {
    const res = await api.get('/api/bago/MyTrips');
    return res.data?.trips || res.data?.data || [];
  },

  async createTrip(data: Record<string, unknown>) {
    const res = await api.post('/api/bago/AddTrip', data);
    return res.data;
  },

  async updateTrip(id: string, data: Record<string, unknown>) {
    const res = await api.put(`/api/bago/Trip/${id}`, data);
    return res.data;
  },

  async deleteTrip(id: string) {
    const res = await api.delete(`/api/bago/Trip/${id}`);
    return res.data;
  },

  async searchTrips(params: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/bago/searchTrips?${query}`);
    return res.data?.trips || res.data?.data || [];
  },
};

export default tripService;

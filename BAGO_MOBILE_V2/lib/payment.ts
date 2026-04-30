import axios from 'axios';
import config from './config';
import { secureStorage } from './storage';

const api = axios.create({ baseURL: config.apiUrl });

api.interceptors.request.use(async (req) => {
  const token = await secureStorage.getItem('accessToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const paymentService = {
  async getWalletBalance() {
    const res = await api.get('/api/bago/getWallet');
    const w = res.data?.data;
    return { balance: w?.balance ?? w?.available_balance ?? 0, currency: w?.currency || 'USD' };
  },

  async withdraw(amount: number, method: string) {
    const res = await api.post('/api/bago/withdrawFunds', { amount, method });
    return res.data;
  },

  async initializePaystack(payload: Record<string, unknown>) {
    const res = await api.post('/api/bago/paystack/initialize', payload);
    return res.data;
  },
};

export default paymentService;

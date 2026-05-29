import api from './api';

export default {
  async getWalletBalance() {
    const res = await api.get('/api/bago/getWallet');
    const w = res.data?.data;
    return { balance: w?.balance ?? w?.available_balance ?? 0, currency: w?.currency || 'USD' };
  },

  async withdraw(amount: number, method: string) {
    const endpoint = method === 'bank' ? '/api/paystack/withdraw' : '/api/bago/withdrawFunds';
    const res = await api.post(endpoint, { amount, method });
    return res.data;
  },

  async initializePaystack(payload: Record<string, unknown>) {
    const res = await api.post('/api/bago/paystack/initialize', payload);
    return res.data;
  },

  async verifyPaystack(reference: string) {
    const res = await api.get(`/api/paystack/verify/${reference}`);
    return res.data;
  },

  async createPayPalOrder(payload: {
    packageId?: string;
    tripId?: string;
    shipmentId?: string;
    currency?: string;
    insurance?: boolean;
    insuranceCost?: number;
    paymentMethod?: string;
  }) {
    const res = await api.post('/api/payments/paypal/create-order', payload);
    return res.data;
  },

  async capturePayPalOrder(orderId: string) {
    const res = await api.post('/api/payments/paypal/capture-order', { orderId });
    return res.data;
  },

  // PayPal payout — OAuth connect: starts the PayPal login flow
  async startPayPalOAuth(): Promise<{ success: boolean; oauthUrl: string; redirectUri: string }> {
    const res = await api.get('/api/payouts/paypal/oauth/start');
    return res.data;
  },

  // PayPal payout — step 1: send OTP to the PayPal email (kept for fallback / admin use)
  async sendPayPalPayoutOtp(paypalEmail: string, payoutCurrency: string) {
    const res = await api.post('/api/payouts/paypal/send-otp', { paypalEmail, payoutCurrency });
    return res.data;
  },

  // PayPal payout — step 2: verify OTP and save
  async verifyPayPalPayoutOtp(otp: string) {
    const res = await api.post('/api/payouts/paypal/verify-otp', { otp });
    return res.data;
  },

  async savePayPalPayoutSettings(paypalEmail: string, payoutCurrency: string) {
    const res = await api.post('/api/payouts/paypal/settings', {
      paypalEmail,
      payoutCurrency,
      confirmed: true,
    });
    return res.data;
  },
};

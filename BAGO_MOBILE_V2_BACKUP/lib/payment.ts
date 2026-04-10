import api from './api';
import { API_ENDPOINTS, PAYMENT_METHODS } from './config';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'payment' | 'withdrawal' | 'refund';
  description: string;
  createdAt: string;
}

class PaymentService {
  /**
   * Create a payment intent for package delivery
   */
  async createPayment(data: {
    packageId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
  }): Promise<PaymentIntent> {
    const response = await api.post<PaymentIntent>(API_ENDPOINTS.CREATE_PAYMENT, {
      ...data,
      currency: data.currency || 'USD',
      paymentMethod: data.paymentMethod || PAYMENT_METHODS.STRIPE,
    });

    return response.data;
  }

  /**
   * Initialize Stripe Payment Sheet
   */
  async initializeStripePayment(data: {
    packageId: string;
    amount: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Get payment intent from backend
      const paymentIntent = await this.createPayment({
        ...data,
        paymentMethod: PAYMENT_METHODS.STRIPE,
      });

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Bago',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        defaultBillingDetails: {
          // You can pre-fill user data here
        },
        returnURL: 'bago://payment-complete',
      });

      if (initError) {
        return { success: false, error: initError.message };
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        return { success: false, error: presentError.message };
      }

      // Confirm payment on backend
      await this.confirmPayment(paymentIntent.paymentIntentId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Confirm payment completion
   */
  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    const response = await api.post(API_ENDPOINTS.CONFIRM_PAYMENT, {
      paymentIntentId,
    });

    return response.data;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const response = await api.get<{ transactions: Transaction[] }>(
      API_ENDPOINTS.PAYMENT_HISTORY,
      { params }
    );

    return response.data.transactions;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<{
    balance: number;
    currency: string;
    pendingBalance: number;
  }> {
    const response = await api.get(API_ENDPOINTS.WALLET_BALANCE);
    return response.data;
  }

  /**
   * Request withdrawal
   */
  async withdraw(data: {
    amount: number;
    method: 'bank_transfer' | 'paypal' | 'mobile_money';
    accountDetails: any;
  }): Promise<{
    success: boolean;
    withdrawalId: string;
    message: string;
  }> {
    const response = await api.post(API_ENDPOINTS.WITHDRAW, data);
    return response.data;
  }

  /**
   * Pay with wallet balance
   */
  async payWithWallet(data: {
    packageId: string;
    amount: number;
  }): Promise<{ success: boolean; transactionId: string }> {
    const response = await api.post(API_ENDPOINTS.CREATE_PAYMENT, {
      ...data,
      paymentMethod: PAYMENT_METHODS.WALLET,
    });

    return response.data;
  }

  /**
   * Calculate delivery price
   */
  async calculatePrice(data: {
    weight: number;
    fromCountry: string;
    toCountry: string;
    packageType?: string;
  }): Promise<{
    basePrice: number;
    insuranceFee: number;
    serviceFee: number;
    totalPrice: number;
    currency: string;
  }> {
    const response = await api.post('/api/packages/calculate-price', data);
    return response.data;
  }
}

export default new PaymentService();

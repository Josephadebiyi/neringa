import api from './api';
import { API_ENDPOINTS } from './config';

export interface KycSession {
  success: boolean;
  sessionId: string;
  sessionToken: string;
  sessionUrl: string;
  message: string;
}

export interface KycResult {
  success: boolean;
  message: string;
  kycStatus: string;
  fullName?: string;
  dateOfBirth?: string;
}

class KycService {
  /**
   * Create a new DIDIT KYC session
   */
  async createSession(): Promise<KycSession> {
    try {
      const response = await api.post('/kyc/create-session');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to start verification');
    }
  }

  /**
   * Fetch verification result for a session
   */
  async fetchResult(sessionId: string): Promise<KycResult> {
    try {
      const response = await api.get(`/kyc/fetch-result/${sessionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch verification status');
    }
  }

  /**
   * Get current user's KYC record
   */
  async getMyKyc(): Promise<any> {
    try {
      const response = await api.get('/getKyc');
      return response.data;
    } catch (error: any) {
      // If 404, user might not have started KYC yet
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || 'Failed to fetch KYC record');
    }
  }
}

export default new KycService();

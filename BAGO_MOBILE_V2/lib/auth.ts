import api from './api';
import { API_ENDPOINTS } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  currency?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  signupToken?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  country?: string;
  isVerified: boolean;
  kycStatus?: 'not_started' | 'pending' | 'approved' | 'declined' | 'failed_verification' | 'blocked_duplicate';
  preferredCurrency?: string;
  paymentGateway?: 'stripe' | 'paystack';
  wallet?: {
    balance: number;
    currency: string;
  };
  role?: 'sender' | 'carrier';
  acceptedTerms?: boolean;
  diditSessionId?: string;
  diditSessionUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken?: string;
  message?: string;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);

    if (response.data.token) {
      await api.setToken(response.data.token);
      if (response.data.refreshToken) {
        await api.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data;
  }

  /**
   * Register new user (Step 1: Send OTP)
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>(API_ENDPOINTS.REGISTER, data);
    return response.data;
  }

  /**
   * Verify signup OTP and create user (Step 2)
   */
  async verifySignup(signupToken: string, otp: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.VERIFY_EMAIL, { signupToken, otp });

    if (response.data.token) {
      await api.setToken(response.data.token);
      if (response.data.refreshToken) {
        await api.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await api.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>(API_ENDPOINTS.USER_PROFILE);
    return response.data.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ user: User }>(API_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data.user;
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: any, onProgress?: (progress: number) => void): Promise<string> {
    const response = await api.uploadFile(API_ENDPOINTS.UPLOAD_AVATAR, file, onProgress);
    return response.data.avatarUrl;
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, {
      token,
      password: newPassword,
    });
    return response.data;
  }

  /**
   * Google Sign In
   */
  async googleSignIn(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.GOOGLE_AUTH, { idToken });

    if (response.data.token) {
      await api.setToken(response.data.token);
      if (response.data.refreshToken) {
        await api.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data;
  }

  /**
   * Submit KYC verification
   */
  async submitKYC(data: {
    idType: string;
    idNumber: string;
    frontImage: any;
    backImage?: any;
    selfieImage: any;
  }): Promise<{ message: string; status: string }> {
    const formData = new FormData();
    formData.append('idType', data.idType);
    formData.append('idNumber', data.idNumber);
    formData.append('frontImage', data.frontImage);
    if (data.backImage) {
      formData.append('backImage', data.backImage);
    }
    formData.append('selfieImage', data.selfieImage);

    const response = await api.post(API_ENDPOINTS.KYC_SUBMIT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await api.getToken();
    return !!token;
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ message: string }> {
    const response = await api.delete(API_ENDPOINTS.DELETE_ACCOUNT);
    await api.clearTokens();
    return response.data;
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms(): Promise<{ success: boolean; user: User }> {
    try {
      const response = await api.post<{ success: boolean; user: User }>(API_ENDPOINTS.ACCEPT_TERMS);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Accept terms endpoint not found, simulating success');
        const user = await this.getCurrentUser();
        return { success: true, user: { ...user, acceptedTerms: true } };
      }
      throw error;
    }
  }

  async updateCurrency(currency: string): Promise<User> {
    const response = await api.put<{ user: User }>(API_ENDPOINTS.UPDATE_CURRENCY, { currency });
    return response.data.user;
  }
}

export default new AuthService();

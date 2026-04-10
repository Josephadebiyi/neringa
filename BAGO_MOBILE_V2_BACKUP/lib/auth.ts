import api from './api';
import { API_ENDPOINTS } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  wallet?: {
    balance: number;
    currency: string;
  };
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
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);

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
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post(API_ENDPOINTS.VERIFY_EMAIL, { token });
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
}

export default new AuthService();

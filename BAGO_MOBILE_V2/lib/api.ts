import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { secureStorage } from './storage';
import config from './config';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (refreshToken) {
              // Try to refresh the token
              const response = await axios.post(`${config.apiUrl}/api/auth/refresh`, {
                refreshToken,
              });

              const { token } = response.data;
              await this.setToken(token);

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.clearTokens();
            // Navigate to login screen
            // You can use a navigation service here
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  async getToken(): Promise<string | null> {
    return await secureStorage.getItem(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    await secureStorage.setItem(TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  async clearTokens(): Promise<void> {
    await secureStorage.removeItem(TOKEN_KEY);
    await secureStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // File upload
  async uploadFile(url: string, file: any, onProgress?: (progress: number) => void): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

// Export singleton instance
export default new ApiService();

// Export the class for testing or multiple instances
export { ApiService };

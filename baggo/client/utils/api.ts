import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendomain } from './backendDomain';

// Create a configured Axios instance
const api = axios.create({
  baseURL: backendomain.backendomain,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Storage key for JWT token
const TOKEN_KEY = 'auth_token';

// Helper to get token from storage
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Helper to save token to storage
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

// Helper to remove token from storage
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Request interceptor - attach Bearer token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if token expired
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        // Clear stored token
        await removeToken();
        await AsyncStorage.removeItem('user');
        
        // The app will need to handle this - typically by redirecting to login
        // This is done through the AuthContext
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

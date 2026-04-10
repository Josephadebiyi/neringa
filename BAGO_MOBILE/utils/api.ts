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

// Request interceptor - attaches fresh token to EVERY request (GET, POST, PUT, DELETE, PATCH)
api.interceptors.request.use(
  async (config) => {
    // IMPORTANT: Read token fresh on each request, not cached
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

// Response interceptor - handle errors WITHOUT auto-logout
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // CRITICAL: Do NOT auto-logout on any error, including 401
    // Only explicit user logout should clear auth state
    // This prevents session loss after successful mutations (POST/PUT/DELETE)

    // Log errors for debugging but don't interfere with auth state
    if (error.response) {
      console.warn(`Mobile API Error ${error.response.status}:`, error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService, { User } from '../lib/auth';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  verifyRegistration: (signupToken: string, otp: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  currentRole: 'sender' | 'carrier';
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<'sender' | 'carrier'>('sender');

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await api.getToken();

      if (token) {
        // Get current user profile
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        if (currentUser.role) {
          setCurrentRole(currentUser.role);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // For development: if backend fails but we have a simulated session
      // we might want to stay authenticated. But for now, we follow the real flow.
      await api.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = () => {
    setCurrentRole(prev => (prev === 'sender' ? 'carrier' : 'sender'));
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      // Note: User is not fully authenticated until OTP is verified.
      // But we can store the signupToken or handle it in the screen.
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyRegistration = async (signupToken: string, otp: string) => {
    try {
      const response = await authService.verifySignup(signupToken, otp);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    verifyRegistration,
    logout,
    refreshUser,
    updateUser,
    updateCurrency: async (currency: string) => {
      const updatedUser = await authService.updateCurrency(currency);
      setUser(updatedUser);
    },
    deleteAccount: async () => {
      await authService.deleteAccount();
      setUser(null);
      setIsAuthenticated(false);
    },
    acceptTerms: async () => {
      const response = await authService.acceptTerms();
      setUser(response.user);
    },
    currentRole,
    toggleRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

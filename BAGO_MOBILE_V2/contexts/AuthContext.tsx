import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../lib/auth';
import { secureStorage } from '../lib/storage';

interface User {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  image?: string;
  kycStatus?: string;
  preferredCurrency?: string;
  balance?: number;
  isBanned?: boolean;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (payload: { idToken?: string; accessToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  googleLogin: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = await secureStorage.getItem('accessToken');
      if (!token) { setIsLoading(false); return; }
      const userData = await authService.getUser();
      setUser(userData);
    } catch (_) {
      await secureStorage.removeItem('accessToken');
      await secureStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user: userData } = await authService.login(email, password);
    setUser(userData);
  };

  const googleLogin = async (payload: { idToken?: string; accessToken?: string }) => {
    const { user: userData } = await authService.googleLogin(payload);
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      googleLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

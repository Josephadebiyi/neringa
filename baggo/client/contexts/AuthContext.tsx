import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { saveToken, removeToken, getToken } from '@/utils/api';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  country?: string;
  kycStatus?: string;
  isKycCompleted?: boolean;
  paymentGateway?: string;
  preferredCurrency?: string;
  emailVerified?: boolean;
};

type Session = {
  user: User;
  token: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string, dateOfBirth?: string, country?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        getToken(),
      ]);
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ user: userData, token: storedToken });
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/baggo/signin', {
        email,
        password,
      });

      const data = response.data;
      
      // Handle both old and new response formats for backward compatibility
      // Old format: { message: 'success', user: {...} }
      // New format: { success: true, token: '...', user: {...} }
      const isSuccess = data.success === true || (data.user && data.message?.toLowerCase() !== 'invalid credentials');
      
      if (isSuccess && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: data.user.phone,
          dateOfBirth: data.user.dateOfBirth,
          country: data.user.country,
          kycStatus: data.user.kycStatus,
          isKycCompleted: data.user.isKycCompleted,
          paymentGateway: data.user.paymentGateway,
          preferredCurrency: data.user.preferredCurrency,
          emailVerified: data.user.emailVerified,
        };
        
        // Save token if provided (new format) or generate a session marker (old format)
        const token = data.token || `session_${Date.now()}`;
        await saveToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Update context state - THIS IS THE KEY FIX
        setUser(userData);
        setSession({ user: userData, token });
        
        console.log('AuthContext: User authenticated and state updated');
        return { error: null };
      }
      
      return { error: { message: data.message || 'Sign in failed' } };
    } catch (error: any) {
      console.log('AuthContext signIn error:', error);
      return { error: { message: error.response?.data?.message || 'Sign in failed' } };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    dateOfBirth?: string,
    country?: string
  ) => {
    try {
      const response = await api.post('/api/baggo/signup', {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword: password,
        dateOfBirth,
        country,
      });

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.message || 'Sign up failed' } };
    }
  };

  const signOut = async () => {
    try {
      // Call logout endpoint
      await api.get('/api/baggo/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all stored data
    await removeToken();
    await AsyncStorage.removeItem('user');
    
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/baggo/Profile');
      if (response.data?.data?.findUser) {
        const userData = response.data.data.findUser;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const isAuthenticated = !!session?.token && !!user;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      isAuthenticated,
      signIn, 
      signUp, 
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

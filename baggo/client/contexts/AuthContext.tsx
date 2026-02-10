import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Session = {
  user: User;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
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
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ user: userData });
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${backendomain.backendomain}/api/baggo/signin`, {
        email,
        password,
      });

      if (response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          email: response.data.user.email,
          phone: response.data.user.phone,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setSession({ user: userData });
        return { error: null };
      }
      
      return { error: { message: response.data.message || 'Sign in failed' } };
    } catch (error: any) {
      return { error: { message: error.response?.data?.message || 'Sign in failed' } };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      const response = await axios.post(`${backendomain.backendomain}/api/baggo/signup`, {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword: password,
      });

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.message || 'Sign up failed' } };
    }
  };

  const signOut = async () => {
    try {
      await axios.post(`${backendomain.backendomain}/api/baggo/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    }
    await AsyncStorage.removeItem('user');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

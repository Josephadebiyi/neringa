import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // If no token exists at all, skip the request
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      // Add an AbortController for a 10-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/CheckAdmin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const adminData = data.admin || data.data; // Flexible for different response shapes

        if (adminData) {
          setUser({
            id: adminData._id,
            username: adminData.userName || adminData.email || 'Admin',
            email: adminData.email || '',
            firstName: adminData.firstName || '',
            lastName: adminData.lastName || '',
            role: 'admin',
          });
        } else {
          // Invalid admin data, clear token
          localStorage.removeItem('adminToken');
          setUser(null);
        }
      } else {
        // If 401 Unauthorized or any error, wipe local record
        localStorage.removeItem('adminToken');
        setUser(null);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Auth verification timed out');
      } else {
        console.error('Auth verification failed:', error);
      }
      // Clear token on any error
      localStorage.removeItem('adminToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/AdminLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userName: username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Terminal login access denied');
    }

    const data = await response.json();

    // Crucial: Store the token for both Header and Local Persistence
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
    }

    const adminData = data.admin || data.data;
    if (adminData) {
      setUser({
        id: adminData._id,
        username: adminData.userName || adminData.email || 'Admin',
        email: adminData.email || '',
        firstName: adminData.firstName || '',
        lastName: adminData.lastName || '',
        role: 'admin',
      });
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/Adminlogout`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Terminal session termination error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      setUser(null);
      window.location.href = '/'; // Clean state reset
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

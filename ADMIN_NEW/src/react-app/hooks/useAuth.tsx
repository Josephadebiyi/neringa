import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { adminLogin, checkAdminAuth, adminLogout } from '../services/api';

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
      const data = await checkAdminAuth();
      const adminData = data.admin || data.data;

      if (adminData) {
        setUser({
          id: adminData.id || adminData._id,
          username: adminData.username || adminData.userName || adminData.email || 'Admin',
          email: adminData.email || '',
          firstName: adminData.firstName || adminData.first_name || adminData.fullName || adminData.full_name || '',
          lastName: adminData.lastName || adminData.last_name || '',
          role: 'admin',
        });
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Auth verification failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await adminLogin({ userName: username, password: password });

    if (data.token) {
      const adminData = data.admin || data.data;
      if (adminData) {
        setUser({
          id: adminData.id || adminData._id,
          username: adminData.username || adminData.userName || adminData.email || 'Admin',
          email: adminData.email || '',
          firstName: adminData.firstName || '',
          lastName: adminData.lastName || '',
          role: 'admin',
        });
      }
    } else {
      throw new Error(data.message || 'Terminal login access denied');
    }
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch (error) {
      console.error('Terminal session termination error:', error);
    } finally {
      setUser(null);
      window.location.href = window.location.pathname; // Clean state reset
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

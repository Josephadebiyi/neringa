import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    kycStatus?: string;
    average_rating?: number;
    total_trips?: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    signup: (userData: any) => Promise<void>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored auth data on mount
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (credentials: any) => {
        try {
            const response = await api.post('/signin', credentials);
            const { data, token: authToken } = response.data;

            setUser(data);
            setToken(authToken);

            localStorage.setItem('auth_token', authToken);
            localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (userData: any) => {
        try {
            const response = await api.post('/signup', userData);
            const { data, token: authToken } = response.data;

            setUser(data);
            setToken(authToken);

            localStorage.setItem('auth_token', authToken);
            localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // server-side logout call is optional but good practice
        api.get('/logout').catch(() => { });
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            signup,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

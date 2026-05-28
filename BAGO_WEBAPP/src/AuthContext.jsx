
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api, { clearAuthSession, setSessionExpiredHandler } from './api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const authVersionRef = useRef(0);

    useEffect(() => {
        checkAuthStatus();
        setSessionExpiredHandler(() => {
            authVersionRef.current += 1;
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        });
    }, []);

    const checkAuthStatus = async () => {
        const authVersion = authVersionRef.current;
        try {
            const response = await api.get('/api/bago/getuser');
            if (response.data.success) {
                if (authVersion !== authVersionRef.current) return;
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }

        if (authVersion !== authVersionRef.current) return;
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
    };

    const login = (userData) => {
        authVersionRef.current += 1;
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
    };

    // Silently refreshes user data without touching auth state on failure
    const refreshUser = async () => {
        try {
            const response = await api.get('/api/bago/getuser');
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch {
            // Ignore — keep existing user state
        }
    };

    const logout = async () => {
        try {
            await api.post('/api/bago/logout');
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            authVersionRef.current += 1;
            clearAuthSession();
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, checkAuthStatus, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

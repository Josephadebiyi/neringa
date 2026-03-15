import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { getToken, removeToken } from './api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // Don't load user from localStorage initially - always verify with backend
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = getToken();
        if (!token) {
            // Clear any stale data
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/api/bago/getuser');
            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                // Invalid response, clear auth
                removeToken();
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            // Clear all auth data on error
            removeToken();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        removeToken();
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

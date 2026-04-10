
import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { removeToken } from './api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await api.get('/api/bago/getuser');
            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }

        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
    };

    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await api.post('/api/bago/logout');
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            removeToken();
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

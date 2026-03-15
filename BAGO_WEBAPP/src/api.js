import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://neringa.onrender.com",
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getToken = () => localStorage.getItem('auth_token');
export const saveToken = (token) => localStorage.setItem('auth_token', token);
export const removeToken = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
};

// Request interceptor - attaches fresh token to EVERY request
api.interceptors.request.use(
    (config) => {
        // IMPORTANT: Read token fresh on each request, not cached
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors WITHOUT auto-logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // CRITICAL: Do NOT auto-logout on any error, including 401
        // Only explicit user logout should clear auth state
        // This prevents session loss after successful mutations
        return Promise.reject(error);
    }
);

export default api;

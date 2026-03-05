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

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const errorCode = error.response?.data?.code;
            if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
                removeToken();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

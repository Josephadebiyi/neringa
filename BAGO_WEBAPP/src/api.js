
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://neringa.onrender.com",
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getToken = () => null;
export const saveToken = () => {};
export const removeToken = () => {
    localStorage.removeItem('user');
};

// Cookies handle auth, so no bearer token is stored in localStorage.
api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default api;

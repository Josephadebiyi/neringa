
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://neringa.onrender.com",
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const ACCESS_TOKEN_KEY = 'bago_access_token';
const REFRESH_TOKEN_KEY = 'bago_refresh_token';

export const getToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const saveToken = (token, refreshToken) => {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
export const removeToken = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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

let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = getRefreshToken();

        if (error.response?.status !== 401 || originalRequest?._retry || !refreshToken) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        try {
            refreshPromise ||= axios.post(
                `${api.defaults.baseURL}/api/bago/refresh-token`,
                { refreshToken },
                { withCredentials: true },
            ).finally(() => {
                refreshPromise = null;
            });

            const response = await refreshPromise;
            saveToken(response.data?.token, response.data?.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${response.data?.token}`;
            return api(originalRequest);
        } catch (refreshError) {
            removeToken();
            return Promise.reject(refreshError);
        }
    }
);

export default api;

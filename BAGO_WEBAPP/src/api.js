import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://neringa.onrender.com",
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Clear any tokens that were previously stored in localStorage during migration
export const clearLegacyLocalStorage = () => {
    localStorage.removeItem('bago_access_token');
    localStorage.removeItem('bago_refresh_token');
    localStorage.removeItem('user');
};

let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        try {
            // Refresh token is sent automatically via HttpOnly cookie
            refreshPromise ||= axios.post(
                `${api.defaults.baseURL}/api/bago/refresh-token`,
                {},
                { withCredentials: true },
            ).finally(() => {
                refreshPromise = null;
            });

            await refreshPromise;
            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);

export default api;

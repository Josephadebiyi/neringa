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

// Called when both the access token AND refresh token are gone/expired.
// Components can set this to handle clean logout (e.g. clear React state).
let _sessionExpiredHandler = null;
export const setSessionExpiredHandler = (fn) => { _sessionExpiredHandler = fn; };

function handleSessionExpired() {
    if (_sessionExpiredHandler) _sessionExpiredHandler();
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session_expired';
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        // Don't try to refresh the refresh-token endpoint itself
        if (originalRequest?.url?.includes('/refresh-token')) {
            handleSessionExpired();
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
            // Both tokens are expired/missing — session is dead
            handleSessionExpired();
            return Promise.reject(refreshError);
        }
    }
);

export default api;

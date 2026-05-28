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

export const getStoredTokens = () => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
});

export const setAuthSession = ({ token, accessToken, refreshToken } = {}) => {
    const nextAccessToken = token || accessToken;
    if (nextAccessToken) localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('bago_access_token');
    localStorage.removeItem('bago_refresh_token');
    localStorage.removeItem('user');
};

let refreshPromise = null;

// Called when both the access token AND refresh token are gone/expired.
// Components can set this to handle clean logout (e.g. clear React state).
let _sessionExpiredHandler = null;
export const setSessionExpiredHandler = (fn) => { _sessionExpiredHandler = fn; };

const AUTH_REFRESH_EXEMPT_PATHS = [
    '/api/bago/signin',
    '/api/bago/google-auth',
    '/api/bago/signup',
    '/api/bago/verify-otp',
    '/api/bago/forgot-password',
    '/api/bago/reset-password',
    '/api/bago/getuser',
];

function requestPath(url = '') {
    try {
        return new URL(url, api.defaults.baseURL).pathname;
    } catch {
        return url;
    }
}

function shouldSkipRefresh(originalRequest) {
    const path = requestPath(originalRequest?.url);
    return AUTH_REFRESH_EXEMPT_PATHS.some((exemptPath) => path === exemptPath);
}

function handleSessionExpired() {
    clearAuthSession();
    if (_sessionExpiredHandler) _sessionExpiredHandler();
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session_expired';
    }
}

api.interceptors.request.use((config) => {
    const { accessToken } = getStoredTokens();
    if (accessToken && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        // Auth/bootstrap requests should surface their own 401 instead of
        // being hidden behind a refresh attempt.
        if (shouldSkipRefresh(originalRequest)) {
            return Promise.reject(error);
        }

        // Don't try to refresh the refresh-token endpoint itself
        if (requestPath(originalRequest?.url).includes('/refresh-token')) {
            handleSessionExpired();
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        try {
            const { refreshToken } = getStoredTokens();
            refreshPromise ||= axios.post(
                `${api.defaults.baseURL}/api/bago/refresh-token`,
                refreshToken ? { refreshToken } : {},
                { withCredentials: true },
            ).finally(() => {
                refreshPromise = null;
            });

            const refreshResponse = await refreshPromise;
            setAuthSession(refreshResponse.data);
            return api(originalRequest);
        } catch (refreshError) {
            // Both tokens are expired/missing — session is dead
            handleSessionExpired();
            return Promise.reject(refreshError);
        }
    }
);

export default api;

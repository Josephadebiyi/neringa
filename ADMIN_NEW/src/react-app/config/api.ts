// API configuration for admin panel
// Prioritize localhost during development, then environment variable, then production fallback.
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const rawApiRoot =
  import.meta.env.VITE_API_URL ||
  (isDevelopment
    ? 'http://localhost:3000/api'
    : 'https://neringa.onrender.com/api');

export const API_ROOT = rawApiRoot.trim().replace(/\/+$/, '');
export const API_BASE_URL = `${API_ROOT}/Adminbaggo`;
export const MAIN_API_URL = `${API_ROOT}/bago`;

// API configuration for admin panel
// Prioritize localhost during development, then environment variable, then production fallback
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const apiRoot = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:3000/api' : 'https://neringa.onrender.com/api');

export const API_BASE_URL = `${apiRoot}/Adminbaggo`;
export const MAIN_API_URL = `${apiRoot}/bago`;

// Centralized API service for admin panel
const API_BASE = 'https://bago-server.onrender.com/api';
const ADMIN_API = `${API_BASE}/Adminbaggo`;
const MAIN_API = `${API_BASE}/baggo`;

// Helper function for API calls
async function apiCall(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// Dashboard
export async function getDashboardStats() {
  return apiCall(`${ADMIN_API}/dashboard`);
}

// Users
export async function getAllUsers() {
  return apiCall(`${ADMIN_API}/GetAllUsers`);
}

export async function banUser(userId: string) {
  return apiCall(`${ADMIN_API}/banUser/${userId}`, { method: 'PUT' });
}

// KYC
export async function getAllKyc() {
  return apiCall(`${ADMIN_API}/getAllkyc`);
}

export async function verifyKyc(userId: string, status: string) {
  return apiCall(`${ADMIN_API}/Verifykyc`, {
    method: 'PUT',
    body: JSON.stringify({ userId, status }),
  });
}

// Tracking
export async function getTracking() {
  return apiCall(`${ADMIN_API}/tracking`);
}

// Analytics
export async function getAnalytics() {
  return apiCall(`${ADMIN_API}/analystic`);
}

// Settings
export async function getSettings() {
  return apiCall(`${ADMIN_API}/getCurrentSetting`);
}

export async function toggleAutoVerification() {
  return apiCall(`${ADMIN_API}/toggleAutoVerification`, { method: 'PUT' });
}

// Price per KG
export async function getPrices() {
  return apiCall(`${API_BASE}/prices`);
}

export async function updatePrice(id: string, price: number) {
  return apiCall(`${API_BASE}/prices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ price }),
  });
}

export async function createPrice(data: { route: string; price: number }) {
  return apiCall(`${API_BASE}/prices`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Export base URLs for custom calls
export { API_BASE, ADMIN_API, MAIN_API };

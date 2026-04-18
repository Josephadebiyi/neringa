import { API_BASE_URL as ADMIN_API, API_ROOT, MAIN_API_URL as MAIN_API } from '../config/api';

// Centralized API service for admin panel
const API_BASE = API_ROOT;
const ADMIN_TOKEN_KEY = 'bago_admin_token';

function getAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getAdminToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

// Helper function for API calls
async function apiCall(url: string, options: RequestInit = {}) {
  const headers = getAdminAuthHeaders(options.headers as Record<string, string>);

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url.trim(), {
      ...options,
      credentials: 'omit',
      headers,
    });
  } catch (networkError) {
    // Network error (backend unreachable, DNS failure, CORS blocked)
    throw new Error('Unable to reach the server. Please check if the backend is running and try again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    if (response.status === 401) {
      clearAdminToken();
    }
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}


// Auth
export async function adminLogin(credentials: any) {
  let response: Response;
  try {
    response = await fetch(`${ADMIN_API}/AdminLogin`, {
      method: 'POST',
      credentials: 'omit',
      headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  const data = await response.json().catch(() => {
    throw new Error(`Server error (HTTP ${response.status}). Please try again.`);
  });
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Invalid credentials');
  }
  if (data.token) {
    setAdminToken(data.token);
  }
  return data;
}

export async function checkAdminAuth() {
  return apiCall(`${ADMIN_API}/CheckAdmin`);
}

export async function adminLogout() {
  try {
    return await apiCall(`${ADMIN_API}/Adminlogout`);
  } finally {
    clearAdminToken();
  }
}

// Dashboard
export async function getDashboardStats(page = 1, limit = 20) {
  return apiCall(`${ADMIN_API}/dashboard?page=${page}&limit=${limit}`);
}

// Users
export async function getAllUsers() {
  return apiCall(`${ADMIN_API}/GetAllUsers`);
}

export async function getUsers(page = 1, limit = 20, banned = false) {
  return apiCall(`${ADMIN_API}/GetAllUsers?page=${page}&limit=${limit}&banned=${banned}`);
}

export async function banUser(userId: string, banned: boolean) {
  return apiCall(`${ADMIN_API}/banUser/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ banned }),
  });
}

export async function deleteUser(userId: string) {
  return apiCall(`${ADMIN_API}/deleteUser/${userId}`, {
    method: 'DELETE',
  });
}

export async function updateUser(userId: string, data: any) {
  return apiCall(`${ADMIN_API}/updateUser/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
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

export async function updateSettings(data: any) {
  return apiCall(`${ADMIN_API}/update-settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function requestAdminCredentialChange(data: any) {
  return apiCall(`${ADMIN_API}/credentials/request-change`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyAdminCredentialChange(data: any) {
  return apiCall(`${ADMIN_API}/credentials/verify-change`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleAutoVerification() {
  return apiCall(`${ADMIN_API}/toggleAutoVerification`, { method: 'PUT' });
}

// Price per KG
export async function getPrices() {
  return apiCall(`${API_BASE}/prices/get`);
}

export async function updatePrice(id: string, price: number) {
  return apiCall(`${API_BASE}/prices/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ price }),
  });
}

export async function createPrice(data: { route: string; price: number }) {
  return apiCall(`${API_BASE}/prices/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Withdrawal Payouts
export async function getWithdrawals() {
  return apiCall(`${ADMIN_API}/withdrawals`);
}

export async function updateWithdrawalStatus(transactionId: string, status: string, failureReason?: string) {
  return apiCall(`${ADMIN_API}/withdrawals/${transactionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, failureReason }),
  });
}

// Trips
export async function getTrips(page = 1, limit = 20) {
  return apiCall(`${ADMIN_API}/admin-trips?page=${page}&limit=${limit}`);
}

export async function updateTripStatus(tripId: string, status: string, reason?: string) {
  return apiCall(`${ADMIN_API}/admin-trips/${tripId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function deleteTrip(tripId: string) {
  return apiCall(`${ADMIN_API}/admin-trips/${tripId}`, {
    method: 'DELETE',
  });
}

// Staff
export async function getStaff() {
  return apiCall(`${ADMIN_API}/staff`);
}

export async function createStaff(data: any) {
  return apiCall(`${ADMIN_API}/staff`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStaff(id: string, data: any) {
  return apiCall(`${ADMIN_API}/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStaff(id: string) {
  return apiCall(`${ADMIN_API}/staff/${id}`, {
    method: 'DELETE',
  });
}

// Support
export async function getTickets() {
  return apiCall(`${ADMIN_API}/tickets`);
}

export async function getTicketById(id: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}`);
}

export async function updateTicketStatus(id: string, status: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function replyToTicket(id: string, message: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// Promo Codes
export async function getPromoCodes() {
  return apiCall(`${ADMIN_API}/promo-codes`);
}

export async function createPromoCode(data: any) {
  return apiCall(`${ADMIN_API}/promo-codes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePromoCode(id: string) {
  return apiCall(`${ADMIN_API}/promo-codes/${id}`, {
    method: 'DELETE',
  });
}

export async function togglePromoCode(id: string) {
  return apiCall(`${ADMIN_API}/promo-codes/${id}/toggle`, {
    method: 'PUT',
  });
}

// Locations
export async function getLocations() {
  return apiCall(`${ADMIN_API}/locations`);
}

export async function createLocation(data: any) {
  return apiCall(`${ADMIN_API}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLocation(id: string, data: any) {
  return apiCall(`${ADMIN_API}/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string) {
  return apiCall(`${ADMIN_API}/locations/${id}`, {
    method: 'DELETE',
  });
}

// Routes
export async function getRoutes() {
  return apiCall(`${ADMIN_API}/routes`);
}

export async function createRoute(data: any) {
  return apiCall(`${ADMIN_API}/routes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoute(id: string, data: any) {
  return apiCall(`${ADMIN_API}/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoute(id: string) {
  return apiCall(`${ADMIN_API}/routes/${id}`, {
    method: 'DELETE',
  });
}

// Push Notifications
export async function sendPushNotification(data: any) {
  return apiCall(`${ADMIN_API}/send-notification`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPushHistory() {
  return apiCall(`${ADMIN_API}/push-notifications/history`);
}

// Disputes
export async function getDisputes() {
  return apiCall(`${MAIN_API}/disputes`);
}

export async function updateDisputeStatus(id: string, data: any) {
  return apiCall(`${MAIN_API}/disputes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Refunds
export async function getRefunds() {
  return apiCall(`${MAIN_API}/get-refund`);
}

export async function processRefund(id: string, action: 'approve' | 'reject') {
  return apiCall(`${MAIN_API}/${action}/${id}`, {
    method: 'PUT',
  });
}

export async function sendPromoEmail(data: any) {
  return apiCall(`${ADMIN_API}/send-promo`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Insurance Settings
export async function getInsuranceSettings() {
  return apiCall(`${ADMIN_API}/insurance/settings`);
}

export async function updateInsuranceSettings(data: any) {
  return apiCall(`${ADMIN_API}/insurance/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Export base URLs for custom calls
export { API_BASE, ADMIN_API, MAIN_API };

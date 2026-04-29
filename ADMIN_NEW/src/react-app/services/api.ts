import { API_BASE_URL as ADMIN_API, API_ROOT, MAIN_API_URL as MAIN_API } from '../config/api';

const API_BASE = API_ROOT;

// Auth relies on HttpOnly cookies set by the backend — no token in localStorage.
export function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return { ...extraHeaders };
}

async function apiCall(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url.trim(), {
      ...options,
      credentials: 'include', // send HttpOnly adminToken cookie automatically
      headers,
    });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Server error (HTTP ${response.status})` }));
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
      credentials: 'include', // backend sets HttpOnly adminToken cookie in response
      headers: { 'Content-Type': 'application/json' },
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
  return data;
}

export async function checkAdminAuth() {
  return apiCall(`${ADMIN_API}/CheckAdmin`);
}

export async function adminLogout() {
  return apiCall(`${ADMIN_API}/Adminlogout`);
  // HttpOnly cookie is cleared by the backend on logout
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
  return apiCall(`${ADMIN_API}/deleteUser/${userId}`, { method: 'DELETE' });
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

export async function syncKycFromDidit(userId: string) {
  return apiCall(`${ADMIN_API}/Verifykyc`, {
    method: 'PUT',
    body: JSON.stringify({ userId, status: 'sync' }),
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
  return apiCall(`${ADMIN_API}/admin-trips/${tripId}`, { method: 'DELETE' });
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
  return apiCall(`${ADMIN_API}/staff/${id}`, { method: 'DELETE' });
}

// Support
export async function getTickets() {
  return apiCall(`${ADMIN_API}/tickets`);
}

export async function getTicketById(id: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}`);
}

export async function updateTicketStatus(id: string, status?: string, assignedTo?: string | null) {
  return apiCall(`${ADMIN_API}/tickets/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(status !== undefined ? { status } : {}),
      // always include assigned_to when caller passes it so "" clears the assignee
      ...(assignedTo !== undefined ? { assigned_to: assignedTo || null } : {}),
    }),
  });
}

export async function replyToTicket(id: string, message: string, senderName?: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ content: message, sender: 'ADMIN', senderName }),
  });
}

export async function addSupportInternalNote(id: string, content: string) {
  return apiCall(`${ADMIN_API}/tickets/${id}/internal-note`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getSupportSavedReplies() {
  return apiCall(`${ADMIN_API}/support/saved-replies`);
}

export async function createSupportSavedReply(data: { title: string; body: string }) {
  return apiCall(`${ADMIN_API}/support/saved-replies`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSupportPresence(presence: 'OFFLINE' | 'AWAY' | 'AVAILABLE') {
  return apiCall(`${ADMIN_API}/support/presence`, {
    method: 'PUT',
    body: JSON.stringify({ presence }),
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
  return apiCall(`${ADMIN_API}/promo-codes/${id}`, { method: 'DELETE' });
}

export async function togglePromoCode(id: string) {
  return apiCall(`${ADMIN_API}/promo-codes/${id}/toggle`, { method: 'PUT' });
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
  return apiCall(`${ADMIN_API}/locations/${id}`, { method: 'DELETE' });
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
  return apiCall(`${ADMIN_API}/routes/${id}`, { method: 'DELETE' });
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
  return apiCall(`${MAIN_API}/${action}/${id}`, { method: 'PUT' });
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

// Promotional Banners
export async function getBanners() {
  return apiCall(`${ADMIN_API}/banners`);
}

export async function createBanner(formData: FormData) {
  const response = await fetch(`${ADMIN_API}/banners`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Server error (${response.status})` }));
    throw new Error(err.error || err.message || 'Upload failed');
  }
  return response.json();
}

export async function toggleBanner(id: string) {
  return apiCall(`${ADMIN_API}/banners/${id}/toggle`, { method: 'PUT' });
}

export async function deleteBanner(id: string) {
  return apiCall(`${ADMIN_API}/banners/${id}`, { method: 'DELETE' });
}

// Admin Profile
export async function getAdminProfile() {
  return apiCall(`${ADMIN_API}/profile`);
}

export async function updateAdminProfile(formData: FormData) {
  const response = await fetch(`${ADMIN_API}/profile`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Server error (${response.status})` }));
    throw new Error(err.error || err.message || 'Update failed');
  }
  return response.json();
}

export { API_BASE, ADMIN_API, MAIN_API };

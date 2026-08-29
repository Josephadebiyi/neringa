import { API_BASE_URL as ADMIN_API, API_ROOT, MAIN_API_URL as MAIN_API } from '../config/api';

const API_BASE = API_ROOT;
const ADMIN_TOKEN_KEY = 'bago_admin_token';

function getStoredAdminToken() {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeAdminToken(token?: string) {
  if (!token) return;
  try {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // HttpOnly cookie auth still works when storage is unavailable.
  }
}

function clearStoredAdminToken() {
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // No-op.
  }
}

// Admin auth prefers the HttpOnly cookie and falls back to the login token for browsers that block cross-site cookies.
export function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAdminToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
      headers: getAdminAuthHeaders(headers),
    });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Server error (HTTP ${response.status})` }));
    if (response.status === 401) {
      clearStoredAdminToken();
      window.location.hash = '#/';
      return;
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
  storeAdminToken(data.token);
  return data;
}

export async function checkAdminAuth() {
  return apiCall(`${ADMIN_API}/CheckAdmin`);
}

export async function adminLogout() {
  try {
    return await apiCall(`${ADMIN_API}/Adminlogout`);
  } finally {
    clearStoredAdminToken();
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

export async function getBusinesses() {
  return apiCall(`${ADMIN_API}/GetAllUsers?accountType=company&limit=100`);
}

export async function reviewBusinessDocument(userId: string, action: 'approved' | 'rejected', reason?: string) {
  return apiCall(`${ADMIN_API}/businesses/${userId}/review-document`, {
    method: 'PUT',
    body: JSON.stringify({ action, reason }),
  });
}

export interface CreateBusinessPayload {
  companyName: string;
  tradingName: string;
  businessRegistrationNumber: string;
  businessAddress?: string;
  businessTaxId?: string;
  representativeRole?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  country?: string;
  operationalCurrency?: string;
}

export async function createBusiness(payload: CreateBusinessPayload) {
  return apiCall(`${ADMIN_API}/businesses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminUploadBusinessDocument(userId: string, file: File) {
  const formData = new FormData();
  formData.append('document', file);
  const response = await fetch(`${ADMIN_API}/businesses/${userId}/document`, {
    method: 'POST',
    credentials: 'include',
    headers: getAdminAuthHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Server error (${response.status})` }));
    throw new Error(err.message || 'Upload failed');
  }
  return response.json();
}

export async function adminGenerateKycLink(userId: string) {
  return apiCall(`${ADMIN_API}/businesses/${userId}/kyc-link`, { method: 'POST' });
}

export async function approveBusinessAccount(userId: string) {
  return apiCall(`${ADMIN_API}/businesses/${userId}/approve`, { method: 'POST' });
}

export async function getUsers(page = 1, limit = 20, banned = false, search = '') {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  return apiCall(`${ADMIN_API}/GetAllUsers?page=${page}&limit=${limit}&banned=${banned}${searchParam}`);
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

export async function getUserDetail(userId: string) {
  return apiCall(`${ADMIN_API}/GetUserDetail/${userId}`);
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

export async function syncPremblyKycStatuses() {
  return apiCall(`${ADMIN_API}/kyc/sync-prembly`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function syncPremblyKycUser(userId: string, referenceId?: string) {
  return apiCall(`${ADMIN_API}/kyc/users/${userId}/sync-prembly`, {
    method: 'POST',
    body: JSON.stringify(referenceId ? { referenceId } : {}),
  });
}

export async function syncPremblyKycByReference(userId: string, referenceId: string) {
  return apiCall(`${ADMIN_API}/kyc/users/${userId}/sync-prembly-reference`, {
    method: 'POST',
    body: JSON.stringify({ referenceId }),
  });
}

// Tracking
export async function getTracking() {
  return apiCall(`${ADMIN_API}/tracking`);
}

export async function getOrders(page = 1, limit = 30, status?: string, search?: string) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') qs.set('status', status);
  if (search) qs.set('search', search);
  return apiCall(`${ADMIN_API}/orders?${qs}`);
}

export async function updateOrderStatus(id: string, status: string, location?: string, notes?: string) {
  return apiCall(`${ADMIN_API}/tracking/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, location, notes }),
  });
}

export async function updateExternalTracking(id: string, carrier: string | null, carrierCustomName?: string, trackingNumber?: string | null) {
  return apiCall(`${ADMIN_API}/tracking/${id}/external-tracking`, {
    method: 'PUT',
    body: JSON.stringify({ carrier, carrierCustomName, trackingNumber }),
  });
}

export async function downloadOrderRecord(id: string) {
  const response = await fetch(`${ADMIN_API}/orders/${id}/pdf`, {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'PDF download failed' }));
    throw new Error(error.message || 'PDF download failed');
  }
  return response.blob();
}

export async function getOrderConversation(id: string) {
  return apiCall(`${ADMIN_API}/orders/${id}/conversation`);
}

export async function cancelOrder(id: string, options: { issueRefund: boolean; reason?: string }) {
  return apiCall(`${ADMIN_API}/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
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

export async function approveWithdrawal(transactionId: string) {
  return apiCall(`${ADMIN_API}/withdrawals/${transactionId}/approve`, {
    method: 'POST',
  });
}

export async function syncFlutterwaveWithdrawal(transactionId: string) {
  return apiCall(`${ADMIN_API}/withdrawals/${transactionId}/sync-flutterwave`, {
    method: 'POST',
  });
}

// Trips
export async function getTrips(page = 1, limit = 20) {
  return apiCall(`${ADMIN_API}/admin-trips?page=${page}&limit=${limit}`);
}

export async function searchBusinesses(search: string) {
  return apiCall(`${ADMIN_API}/GetAllUsers?accountType=company&limit=20&search=${encodeURIComponent(search)}`);
}

export interface CreateTripForBusinessPayload {
  businessUserId: string;
  fromLocation: string; fromCountry?: string; toLocation: string; toCountry?: string;
  collectionCity?: string; collectionCountry?: string;
  departureDate?: string; departureDates?: string[]; arrivalDate?: string;
  // Currency is intentionally NOT settable here — the backend always prices the
  // trip in the business's own wallet currency (profiles.preferred_currency),
  // never a client-supplied value, so payout/earnings math stays consistent.
  availableKg: number; travelMeans: string; pricePerKg: number;
  landmark?: string;
}

export async function createTripForBusiness(payload: CreateTripForBusinessPayload) {
  return apiCall(`${ADMIN_API}/admin-trips`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// These act on a "batch" — every trip posted together as one multi-date
// submission (or a single trip, which is just a batch of one). The list
// endpoint returns one grouped entry per batch, so `tripId` here is really
// that batch's id — the backend resolves it to every trip sharing it.
export async function updateTripStatus(tripId: string, status: string, reason?: string) {
  return apiCall(`${ADMIN_API}/admin-trips/batch/${tripId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function deleteTrip(tripId: string) {
  return apiCall(`${ADMIN_API}/admin-trips/batch/${tripId}`, { method: 'DELETE' });
}

export async function updateTripPrice(tripId: string, pricePerKg: number, currency?: string) {
  return apiCall(`${ADMIN_API}/admin-trips/batch/${tripId}/price`, {
    method: 'PUT',
    body: JSON.stringify({ pricePerKg, currency }),
  });
}

// Acts on exactly one date within a batch (e.g. decline/remove a single date
// from a multi-date posting without touching the rest of the batch).
export async function updateSingleTripStatus(tripId: string, status: string, reason?: string) {
  return apiCall(`${ADMIN_API}/admin-trips/${tripId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function deleteSingleTrip(tripId: string) {
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
  return apiCall(`${ADMIN_API}/disputes`);
}

export async function updateDisputeStatus(id: string, data: any) {
  return apiCall(`${ADMIN_API}/disputes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Refunds
export async function getRefunds() {
  return apiCall(`${ADMIN_API}/refunds`);
}

export async function processRefund(id: string, action: 'approve' | 'reject') {
  return apiCall(`${ADMIN_API}/refunds/${id}/${action}`, { method: 'PUT' });
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

export async function getInsuredShipments(status?: string) {
  const qs = status && status !== 'all' ? `?status=${status}` : '';
  return apiCall(`${ADMIN_API}/insurance/shipments${qs}`);
}

// Reconstructs the exact payload MyCover.ai would receive for one order — for
// manually filing a policy if the automated purchase call failed.
export async function getInsurancePayload(requestId: string) {
  return apiCall(`${ADMIN_API}/insurance/payload/${requestId}`);
}

// Bulk CSV of MyCover payloads (defaults to failed/pending orders) as a
// backup you can work through manually if the API integration is down.
export async function downloadInsurancePayloadsCsv(status: string = 'failed') {
  const response = await fetch(`${ADMIN_API}/insurance/payloads/export?status=${encodeURIComponent(status)}`, {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Server error (HTTP ${response.status})` }));
    throw new Error(error.message || 'Failed to export insurance payloads');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mycover_export_${status}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
    headers: getAdminAuthHeaders(),
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
    headers: getAdminAuthHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Server error (${response.status})` }));
    throw new Error(err.error || err.message || 'Update failed');
  }
  return response.json();
}

// Item Categories
export async function getItemCategories() {
  return apiCall(`${ADMIN_API}/item-categories`);
}

export async function createItemCategory(data: {
  name: string;
  slug: string;
  description?: string;
  risk_level: 'allowed' | 'medium' | 'prohibited';
  is_active?: boolean;
}) {
  return apiCall(`${ADMIN_API}/item-categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateItemCategory(id: string, data: Partial<{
  name: string;
  description: string;
  risk_level: 'allowed' | 'medium' | 'prohibited';
  is_active: boolean;
}>) {
  return apiCall(`${ADMIN_API}/item-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteItemCategory(id: string) {
  return apiCall(`${ADMIN_API}/item-categories/${id}`, { method: 'DELETE' });
}

export async function recalculateUserBalance(userId: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/recalculate-balance`, { method: 'POST' });
}

export async function adminSetWalletCurrency(userId: string, newCurrency: string, settleBalance = false, adminNote?: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/earning-currency`, {
    method: 'POST',
    body: JSON.stringify({ newCurrency, settleBalance, adminNote }),
  });
}

export async function adminCorrectWallet(userId: string, balance: number, currency: string, reason?: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/correct-wallet`, {
    method: 'POST',
    body: JSON.stringify({ balance, currency, reason }),
  });
}

// Flagged / Banned Users
export async function getFlaggedUsers(page = 1, limit = 50, source?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (source) params.set('source', source);
  return apiCall(`${ADMIN_API}/flagged-users?${params}`);
}

export async function getFlaggedChats(page = 1, limit = 50) {
  return apiCall(`${ADMIN_API}/flagged-chats?page=${page}&limit=${limit}`);
}

export async function getFlaggedConversation(conversationId: string) {
  return apiCall(`${ADMIN_API}/flagged-chats/${conversationId}`);
}

export async function unlockFlaggedConversation(conversationId: string, note: string) {
  return apiCall(`${ADMIN_API}/flagged-chats/${conversationId}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function flagUserById(userId: string, reason: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function unflagUserById(userId: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/unflag`, { method: 'POST' });
}

export async function banUserWithDevice(userId: string, reason: string) {
  return apiCall(`${ADMIN_API}/users/${userId}/ban-with-device`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export { API_BASE, ADMIN_API, MAIN_API };

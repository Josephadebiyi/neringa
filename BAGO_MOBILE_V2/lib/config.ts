// All values read from EXPO_PUBLIC_* environment variables.
// Set these in .env locally and in EAS dashboard for cloud builds.
// EXPO_PUBLIC_ prefix is required for values bundled into the app.
const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://neringa.onrender.com',
  stripeKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  paystackKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || '',
};

export default config;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/bago/signin',
  REGISTER: '/api/bago/signup',
  LOGOUT: '/api/bago/logout',
  REFRESH_TOKEN: '/api/bago/refresh-token',
  FORGOT_PASSWORD: '/api/bago/forgot-password',
  RESET_PASSWORD: '/api/bago/reset-password',
  VERIFY_EMAIL: '/api/bago/verify-signup-otp',
  GOOGLE_AUTH: '/api/bago/google-auth',

  // User
  USER_PROFILE: '/api/bago/getuser',
  UPDATE_PROFILE: '/api/bago/edit',
  UPLOAD_AVATAR: '/api/bago/user/avatar',
  KYC_SUBMIT: '/api/bago/KycVerifications',
  DELETE_ACCOUNT: '/api/bago/user/delete',
  ACCEPT_TERMS: '/api/bago/user/accept-terms',
  UPDATE_CURRENCY: '/api/bago/edit-currency',
  REQUEST_EMAIL_CHANGE: '/api/bago/user/request-email-change',
  VERIFY_EMAIL_CHANGE: '/api/bago/user/verify-email-change',

  // Packages
  PACKAGES: '/api/bago/recentOrder',
  PACKAGE_CREATE: '/api/bago/createPackage',
  PACKAGE_UPDATE: '/api/bago/updatePackage',
  PACKAGE_DELETE: '/api/bago/package',
  PACKAGE_DETAIL: '/api/bago/request/:requestId/details',
  MY_PACKAGES: '/api/bago/recentOrder',

  // Trips
  TRIPS: '/api/bago/Trip',
  CREATE_TRIP: '/api/bago/AddAtrip',
  MY_TRIPS: '/api/bago/MyTrips',
  SEARCH_TRIPS: '/api/bago/getTravelers',
  SEARCH_TRAVELERS: '/api/bago/getTravelers',

  // Requests
  PACKAGE_REQUESTS: '/api/bago/requests',
  SEND_PACKAGE_REQUEST: '/api/bago/RequestPackage',
  CREATE_REQUEST: '/api/bago/RequestPackage',
  ACCEPT_REQUEST: '/api/bago/updateRequestStatus',
  REJECT_REQUEST: '/api/bago/reject-request',
  MY_REQUESTS: '/api/bago/getRequests',
  MY_PACKAGE_REQUESTS: '/api/bago/recentOrder',

  // Payments
  CREATE_PAYMENT: '/api/payments/create',
  CONFIRM_PAYMENT: '/api/payments/confirm',
  PAYMENT_HISTORY: '/api/payments/history',
  WALLET_BALANCE: '/api/wallet/balance',
  WITHDRAW: '/api/wallet/withdraw',

  // Tracking
  TRACK_PACKAGE: '/api/tracking',
  UPDATE_LOCATION: '/api/tracking/update-location',
  TRACKING_HISTORY: '/api/tracking/history/:id',
  MY_TRACKED_PACKAGES: '/api/tracking/my-packages',
  MY_DELIVERIES: '/api/tracking/my-deliveries',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: '/api/notifications/mark-read',
  MARK_ALL_READ: '/api/notifications/mark-all-read',
  DELETE_NOTIFICATION: '/api/notifications/delete',
  NOTIFICATION_SETTINGS: '/api/notifications/settings',

  // Chat/Messages
  CONVERSATIONS: '/api/messages/conversations',
  CREATE_CONVERSATION: '/api/messages/conversations',
  MESSAGES: '/api/messages/:conversationId',
  SEND_MESSAGE: '/api/messages/send',
  MARK_MESSAGE_READ: '/api/messages/mark-read',
  UNREAD_MESSAGES: '/api/messages/unread',

  // Support
  CONTACT_SUPPORT: '/api/support/contact',
  FAQ: '/api/support/faq',
  TERMS: '/api/support/terms',
  PRIVACY: '/api/support/privacy',

  // Admin (if needed)
  ADMIN_STATS: '/api/admin/stats',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_TRANSACTIONS: '/api/admin/transactions',
};

// Payment Methods
export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYSTACK: 'paystack',
  WALLET: 'wallet',
};

// Package Status
export const PACKAGE_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Trip Status
export const TRIP_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

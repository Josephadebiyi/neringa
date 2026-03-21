import Constants from 'expo-constants';

// Get environment variables
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3000',
    stripeKey: 'pk_test_your_key_here',
    paystackKey: 'pk_test_your_key_here',
    googleWebClientId: 'your_google_client_id.apps.googleusercontent.com',
    expoProjectId: '',
  },
  staging: {
    apiUrl: 'https://staging-api.bago.com',
    stripeKey: 'pk_test_your_key_here',
    paystackKey: 'pk_test_your_key_here',
    googleWebClientId: 'your_google_client_id.apps.googleusercontent.com',
    expoProjectId: '',
  },
  prod: {
    apiUrl: 'https://api.bago.com',
    stripeKey: 'pk_live_your_key_here',
    paystackKey: 'pk_live_your_key_here',
    googleWebClientId: 'your_google_client_id.apps.googleusercontent.com',
    expoProjectId: '',
  },
};

const getEnvVars = () => {
  // You can change this to read from process.env or Constants.expoConfig
  const environment = __DEV__ ? 'dev' : 'prod';
  return ENV[environment];
};

export default getEnvVars();

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  GOOGLE_AUTH: '/api/auth/google',

  // User
  USER_PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/update',
  UPLOAD_AVATAR: '/api/user/upload-avatar',
  KYC_SUBMIT: '/api/user/kyc',

  // Packages
  PACKAGES: '/api/packages',
  PACKAGE_CREATE: '/api/packages/create',
  PACKAGE_UPDATE: '/api/packages/update',
  PACKAGE_DELETE: '/api/packages/delete',
  PACKAGE_DETAIL: '/api/packages/:id',
  MY_PACKAGES: '/api/packages/my-packages',
  SEARCH_TRAVELERS: '/api/packages/search-travelers',

  // Trips
  TRIPS: '/api/trips',
  TRIP_CREATE: '/api/trips/create',
  TRIP_UPDATE: '/api/trips/update',
  TRIP_DELETE: '/api/trips/delete',
  TRIP_DETAIL: '/api/trips/:id',
  MY_TRIPS: '/api/trips/my-trips',

  // Requests
  PACKAGE_REQUESTS: '/api/requests',
  CREATE_REQUEST: '/api/requests/create',
  ACCEPT_REQUEST: '/api/requests/accept',
  REJECT_REQUEST: '/api/requests/reject',
  MY_REQUESTS: '/api/requests/my-requests',

  // Payments
  CREATE_PAYMENT: '/api/payments/create',
  CONFIRM_PAYMENT: '/api/payments/confirm',
  PAYMENT_HISTORY: '/api/payments/history',
  WALLET_BALANCE: '/api/wallet/balance',
  WITHDRAW: '/api/wallet/withdraw',

  // Tracking
  TRACK_PACKAGE: '/api/tracking/:trackingNumber',
  UPDATE_LOCATION: '/api/tracking/update-location',
  TRACKING_HISTORY: '/api/tracking/history/:id',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: '/api/notifications/mark-read',
  MARK_ALL_READ: '/api/notifications/mark-all-read',
  DELETE_NOTIFICATION: '/api/notifications/delete',
  NOTIFICATION_SETTINGS: '/api/notifications/settings',

  // Chat/Messages
  CONVERSATIONS: '/api/messages/conversations',
  MESSAGES: '/api/messages/:conversationId',
  SEND_MESSAGE: '/api/messages/send',
  MARK_MESSAGE_READ: '/api/messages/mark-read',

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

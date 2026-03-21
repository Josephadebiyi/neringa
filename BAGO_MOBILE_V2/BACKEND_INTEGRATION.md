# Bago Mobile V2 - Backend Integration Guide

This document explains the complete backend integration setup for the Bago mobile application.

## Architecture Overview

The app uses a service-oriented architecture with the following layers:

1. **API Layer** (`lib/api.ts`) - Core HTTP client with authentication
2. **Service Layer** - Domain-specific services (auth, payments, packages, trips, messages, tracking)
3. **Context Layer** (`contexts/`) - Global state management
4. **UI Layer** (`app/`, `components/`) - React components

## Environment Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `API_URL` - Your backend API URL
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key for payments
- `PAYSTACK_PUBLIC_KEY` - Paystack key for African markets
- `EXPO_PROJECT_ID` - For push notifications
- `SUPABASE_URL` & `SUPABASE_ANON_KEY` - If using Supabase

### 2. Environment Configuration

The app supports multiple environments (development, staging, production):

```typescript
// lib/config.ts
const config = {
  apiUrl: process.env.API_URL,
  stripeKey: process.env.STRIPE_PUBLISHABLE_KEY,
  paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
  // ... other config
};
```

## Services Documentation

### Authentication Service (`lib/auth.ts`)

Handles user authentication and profile management.

**Features:**
- Email/password login and registration
- Google Sign In
- JWT token management with auto-refresh
- KYC verification
- Profile updates with avatar upload

**Usage:**
```typescript
import authService from '../lib/auth';

// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Register
const { user, token } = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Get current user
const user = await authService.getCurrentUser();

// Update profile
const updatedUser = await authService.updateProfile({
  name: 'New Name',
  phone: '+1234567890'
});

// Submit KYC
const result = await authService.submitKYC({
  documentType: 'passport',
  documentNumber: 'AB123456',
  documentPhoto: 'file://...',
  selfiePhoto: 'file://...'
});
```

### Auth Context (`contexts/AuthContext.tsx`)

Global authentication state management.

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Dashboard user={user} />;
}
```

### Payment Service (`lib/payment.ts`)

Stripe payment integration with wallet management.

**Features:**
- Create payment intents
- Process Stripe payments
- Wallet balance management
- Withdrawal requests
- Transaction history

**Usage:**
```typescript
import paymentService from '../lib/payment';

// Initialize Stripe payment
const result = await paymentService.initializeStripePayment({
  amount: 50.00,
  currency: 'USD',
  packageId: 'pkg_123',
  description: 'Package delivery payment'
});

if (result.success) {
  console.log('Payment successful!');
}

// Get wallet balance
const wallet = await paymentService.getWalletBalance();
console.log(`Balance: ${wallet.balance} ${wallet.currency}`);

// Request withdrawal
const withdrawal = await paymentService.withdraw({
  amount: 100.00,
  method: 'bank_transfer',
  bankDetails: { accountNumber: '123456789', bankCode: 'ABC' }
});

// Get transaction history
const transactions = await paymentService.getTransactionHistory({
  type: 'all',
  page: 1,
  limit: 20
});
```

### Package Service (`lib/packages.ts`)

Package creation, search, and management.

**Features:**
- Create packages with image upload
- Search available travelers
- Track packages
- Manage package requests
- CRUD operations

**Usage:**
```typescript
import packageService from '../lib/packages';

// Create package
const newPackage = await packageService.createPackage({
  title: 'Electronics Package',
  description: 'Laptop and accessories',
  weight: 5.5,
  category: 'electronics',
  fromCountry: 'USA',
  fromCity: 'New York',
  toCountry: 'Nigeria',
  toCity: 'Lagos',
  value: 1500,
  images: [{ uri: 'file://...', type: 'image/jpeg', name: 'laptop.jpg' }]
});

// Search travelers
const travelers = await packageService.searchTravelers({
  fromCountry: 'USA',
  toCountry: 'Nigeria',
  departureDate: '2024-03-01',
  minAvailableWeight: 5
});

// Track package
const tracking = await packageService.trackPackage('TRK123456789');
console.log(`Status: ${tracking.package.status}`);

// Send package request
await packageService.sendPackageRequest('pkg_123', 'trip_456', {
  offeredPrice: 50,
  message: 'Please deliver my package'
});
```

### Trip Service (`lib/trips.ts`)

For travelers to manage their trips and package requests.

**Features:**
- Create and manage trips
- Search for trips
- Accept/reject package requests
- Update trip status

**Usage:**
```typescript
import tripService from '../lib/trips';

// Create trip
const trip = await tripService.createTrip({
  fromCountry: 'USA',
  fromCity: 'New York',
  toCountry: 'Nigeria',
  toCity: 'Lagos',
  departureDate: '2024-03-15',
  arrivalDate: '2024-03-16',
  availableWeight: 20,
  pricePerKg: 10
});

// Get my trips
const myTrips = await tripService.getMyTrips('active');

// Get package requests for a trip
const requests = await tripService.getTripRequests('trip_123');

// Accept package request
await tripService.acceptPackageRequest('req_123', {
  message: 'I will deliver your package'
});

// Complete trip
await tripService.completeTrip('trip_123');
```

### Message Service (`lib/messages.ts`)

In-app messaging between users.

**Features:**
- Real-time conversations
- Text, image, and file messages
- Read receipts
- Unread count tracking

**Usage:**
```typescript
import messageService from '../lib/messages';

// Get all conversations
const conversations = await messageService.getConversations();

// Get or create conversation with a user
const conversation = await messageService.getOrCreateConversation(
  'user_456',
  { packageId: 'pkg_123' }
);

// Get messages
const { messages, hasMore } = await messageService.getMessages(
  'conv_123',
  1,
  50
);

// Send text message
await messageService.sendMessage({
  conversationId: 'conv_123',
  content: 'Hello, is my package ready?',
  type: 'text'
});

// Send message with file
await messageService.sendMessageWithFile(
  { conversationId: 'conv_123' },
  { uri: 'file://...', type: 'image/jpeg', name: 'photo.jpg' },
  (progress) => console.log(`Upload: ${progress}%`)
);

// Mark as read
await messageService.markAsRead('conv_123');

// Get unread count
const { count } = await messageService.getUnreadCount();
```

### Tracking Service (`lib/tracking.ts`)

Real-time package tracking and location updates.

**Features:**
- Track packages by tracking number
- Update package location (for travelers)
- Mark packages as picked up/delivered
- Report issues
- Delivery proof

**Usage:**
```typescript
import trackingService from '../lib/tracking';

// Track package
const tracking = await trackingService.trackPackage('TRK123456789');
console.log(`Current status: ${tracking.currentStatus}`);
console.log(`Locations: ${tracking.locations.length}`);

// Update location (traveler)
await trackingService.updatePackageLocation('pkg_123', {
  latitude: 40.7128,
  longitude: -74.0060,
  city: 'New York',
  country: 'USA',
  status: 'in_transit',
  description: 'Package cleared customs'
});

// Mark as picked up
await trackingService.markAsPickedUp('pkg_123', {
  latitude: 40.7128,
  longitude: -74.0060,
  address: '123 Main St',
  city: 'New York',
  country: 'USA'
});

// Mark as delivered
await trackingService.markAsDelivered('pkg_123', {
  latitude: 6.5244,
  longitude: 3.3792,
  address: '456 Lagos St',
  city: 'Lagos',
  country: 'Nigeria',
  recipientName: 'John Doe',
  notes: 'Delivered successfully'
});

// Subscribe to real-time updates
const unsubscribe = trackingService.subscribeToPackageUpdates(
  'pkg_123',
  (location) => {
    console.log('New location:', location);
  }
);

// Later: cleanup
unsubscribe();

// Get delivery proof
const proof = await trackingService.getDeliveryProof('pkg_123');
console.log('Delivered at:', proof.deliveredAt);
```

## API Endpoints

All endpoints are defined in `lib/config.ts`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh` - Refresh token

### Packages
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `GET /api/packages/track/:trackingNumber` - Track package

### Trips
- `GET /api/trips` - List trips
- `POST /api/trips` - Create trip
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip
- `POST /api/trips/:id/cancel` - Cancel trip
- `POST /api/trips/:id/complete` - Complete trip

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/wallet` - Get wallet balance
- `POST /api/payments/withdraw` - Withdraw funds
- `GET /api/payments/transactions` - Transaction history

### Messages
- `GET /api/messages/conversations` - List conversations
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversations/:id/messages` - Get messages
- `POST /api/messages/conversations/:id/read` - Mark as read

## Authentication Flow

1. **Login/Register** - User provides credentials
2. **Token Storage** - JWT tokens stored in SecureStore
3. **Auto-Injection** - API service automatically adds token to requests
4. **Auto-Refresh** - On 401 error, refresh token is used to get new access token
5. **Logout** - Tokens cleared from storage

```typescript
// This happens automatically via interceptors
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto-refresh token
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      // ... refresh logic
    }
    return Promise.reject(error);
  }
);
```

## Error Handling

All services use consistent error handling:

```typescript
try {
  const result = await packageService.createPackage(data);
  // Handle success
} catch (error: any) {
  // Error message is always standardized
  console.error(error.message); // "Failed to create package"

  // Original error available if needed
  if (error.response?.data?.message) {
    console.error(error.response.data.message);
  }
}
```

## Push Notifications

Notifications are configured in `lib/notifications.ts` and integrated in `app/_layout.tsx`:

```typescript
// Register for notifications
const token = await registerForPushNotificationsAsync();

// Send package notification
await sendPackageNotification('status_update', 'My Package', 'in_transit');

// Listen to notifications
addNotificationReceivedListener((notification) => {
  console.log('Received:', notification);
});
```

## Testing Backend Integration

1. **Set up your backend API** with the expected endpoints
2. **Configure `.env`** with your API URL
3. **Test authentication**:
   ```typescript
   const { user } = await authService.login({ email, password });
   console.log('Logged in:', user.name);
   ```
4. **Test other services** similarly
5. **Monitor network requests** in React Native Debugger

## Backend Requirements

Your backend should implement:

1. **JWT Authentication** with access and refresh tokens
2. **RESTful API** matching the endpoints in `lib/config.ts`
3. **File Upload** support for images (packages, avatars, documents)
4. **Stripe Integration** for payment processing
5. **Database** for users, packages, trips, messages, etc.
6. **Push Notifications** via Expo Push Notification service
7. **WebSocket/SSE** (optional) for real-time updates

## Next Steps

1. Implement the backend API endpoints
2. Set up database schema
3. Configure Stripe webhooks
4. Set up push notification server
5. Test integration end-to-end
6. Add error monitoring (Sentry)
7. Add analytics (Segment, Mixpanel)

## Connecting to Admin and Web App

The mobile app shares the same backend API with the admin and web app:

- **Same authentication** - JWT tokens work across all platforms
- **Same data model** - All apps use the same database
- **Same endpoints** - Mobile, web, and admin use the same API
- **Real-time sync** - Changes in one platform reflect in others

Just ensure your admin panel and web app use the same `API_URL` and implement the same authentication flow.

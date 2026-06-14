class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://neringa.onrender.com',
  );

  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const String supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const String paystackPublicKey =
      String.fromEnvironment('PAYSTACK_KEY', defaultValue: '');

  // Google OAuth
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com',
  );
  static const String googleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue:
        '207312508850-iebcq2acbvgv1emdv7lkfo2o53dk3qkd.apps.googleusercontent.com',
  );

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  static const String login = '/api/bago/signin';
  static const String register = '/api/bago/signup';
  static const String checkEmail = '/api/bago/signup/check-email';
  static const String verifyOtp = '/api/bago/verify-signup-otp';
  static const String verifyPasswordResetOtp = '/api/bago/verify-otp';
  static const String resendOtp = '/api/bago/resend-otp';
  static const String forgotPassword = '/api/bago/forgot-password';
  static const String resetPassword = '/api/bago/reset-password';
  static const String refreshToken = '/api/bago/refresh-token';
  static const String logout = '/api/bago/logout'; // GET on backend
  static const String googleAuth = '/api/bago/google-auth';
  static const String appleAuth = '/api/bago/apple-auth';
  static const String acceptTerms = '/api/bago/user/accept-terms';
  static const String deleteAccount = '/api/bago/user/delete';

  // ---------------------------------------------------------------------------
  // User / profile
  // ---------------------------------------------------------------------------
  static const String profile = '/api/bago/getuser';
  static const String updateProfile = '/api/bago/edit';
  static const String uploadAvatar = '/api/bago/user/image';
  static const String changeCurrency = '/api/bago/edit-currency';
  static const String activateEarning = '/api/bago/activate-earning';
  static const String detectCurrency = '/api/detect-currency';
  static const String changePassword = '/api/bago/reset-password';
  static const String requestEmailChange =
      '/api/bago/user/request-email-change';
  static const String verifyEmailChange = '/api/bago/user/verify-email-change';
  static const String requestPhoneChange =
      '/api/bago/user/request-phone-change';
  static const String verifyPhoneChange = '/api/bago/user/verify-phone-change';
  static const String sendPhoneVerificationOtp = '/api/bago/phone/send-otp';
  static const String verifyPhoneVerificationOtp = '/api/bago/phone/verify';

  // ---------------------------------------------------------------------------
  // KYC
  // ---------------------------------------------------------------------------
  static const String userReviews = '/api/bago/user/reviews';
  static const String kycSubmit = '/api/bago/KycVerifications';
  static const String kycProvider = '/api/bago/kyc/provider';
  static const String kycDojahStart = '/api/bago/kyc/dojah/start';
  static const String kycDojahSyncResult = '/api/bago/kyc/dojah/sync-result';
  static const String kycStatus = '/api/bago/kyc/status';
  static const String kycManualSubmit = '/api/bago/kyc/manual-submit';
  static const String kycManualStatus = '/api/bago/kyc/manual-status';

  // ---------------------------------------------------------------------------
  // Trips
  // ---------------------------------------------------------------------------
  // Backend: GET/PUT/DELETE /Trip/:id  — caller appends /<id>
  static const String trips = '/api/bago/Trip';
  static const String createTrip = '/api/bago/AddAtrip';
  static const String myTrips = '/api/bago/MyTrips';
  static const String searchTrips = '/api/bago/getTravelers';

  // ---------------------------------------------------------------------------
  // Packages / Shipments
  // ---------------------------------------------------------------------------
  static const String packages = '/api/bago/recentOrder';
  static const String createPackage = '/api/bago/createPackage';
  static const String myPackages = '/api/bago/recentOrder';
  // Backend: PUT /updatePackage/:id  — caller appends /<id>
  static const String updatePackage = '/api/bago/updatePackage';
  // Backend: DELETE /package/:id  — caller appends /<id>
  static const String deletePackage = '/api/bago/package';
  // Backend: GET /request/:requestId/details  — caller appends /<id>/details
  static const String packageDetails = '/api/bago/request';

  // ---------------------------------------------------------------------------
  // Requests
  // ---------------------------------------------------------------------------
  static const String incomingRequests = '/api/bago/incoming-requests';
  static const String packageRequests = incomingRequests;
  static const String sendPackageRequest = '/api/bago/RequestPackage';
  // Backend: PUT /updateRequestStatus/:requestId  — caller appends /<id>
  static const String acceptRequest = '/api/bago/updateRequestStatus';
  // Backend: GET /getRequests/:tripId  — used without tripId returns all for user
  static const String myRequests = '/api/bago/getRequests';
  // Backend: POST /request/:requestId/raise-dispute — caller prepends /request/<id>
  static const String rejectRequest = '/api/bago/reject-request';
  // Backend: PUT /request/:requestId/traveler-proof — caller appends /<id>/traveler-proof
  static const String travelerProof = '/api/bago/request';
  // Backend: PUT /request/:requestId/confirm-received — caller appends /<id>/confirm-received
  static const String confirmReceived = '/api/bago/request';
  // Backend: POST /request/:requestId/confirm-handover — traveler submits 4-digit PIN
  static const String confirmHandover = '/api/bago/request';

  // ---------------------------------------------------------------------------
  // Wallet / payments
  // ---------------------------------------------------------------------------
  static const String walletBalance = '/api/bago/getWallet';
  // Backend: POST /withdrawFunds
  static const String withdrawFunds = '/api/bago/withdrawFunds';
  static const String paymentMethods = '/api/payments/cards';
  // Braintree checkout (legacy)
  static const String braintreeClientToken =
      '/api/payments/braintree/client-token';
  static const String braintreeCheckout = '/api/payments/braintree/checkout';
  static const String braintreeVault = '/api/payments/braintree/vault';
  // Stripe checkout (cards, Apple Pay, eligible wallets)
  static const String stripeConfig = '/api/config/stripe';
  static const String stripePaymentMethods = '/api/payments/methods';
  static const String stripeCreateIntent = '/api/payments/create-intent';
  static const String stripeBizumCheckout = '/api/payments/bizum-checkout';
  // PayPal active checkout flow
  static const String paypalConfig = '/api/config/paypal';
  static const String paypalCreateOrder = '/api/payments/paypal/create-order';
  static const String paypalAuthorize = '/api/payments/paypal/authorize';
  // Paystack payment flow
  static const String paystackInitialize = '/api/bago/paystack/initialize';
  static const String paystackVerify = '/api/bago/paystack/verify';

  // ---------------------------------------------------------------------------
  // Payouts
  // ---------------------------------------------------------------------------
  static const String paystackBanks = '/api/bago/paystack/banks';
  static const String paystackResolve = '/api/bago/paystack/resolve';
  static const String paystackAddBank = '/api/bago/paystack/add-bank';
  static const String paystackVerifyBankOtp =
      '/api/bago/paystack/verify-bank-otp';
  static const String stripePayoutStatus = '/api/payouts/status';
  static const String stripeConnectOnboard = '/api/payouts/connect/onboard';
  static const String stripeConnectAccountSession =
      '/api/payouts/connect/account-session';
  static const String stripeConnectDashboardLink =
      '/api/payouts/connect/dashboard-link';
  static const String stripeWithdraw = '/api/payouts/withdraw';
  static const String paypalPayoutConnect = '/api/payouts/paypal/connect';

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------
  static const String conversations = '/api/bago/conversations';
  static const String createConversation = '/api/bago/conversations/resolve';
  static const String markMessagesRead = '/api/bago/conversations/mark-read';
  static const String unreadCount = '/api/bago/conversations/unread';
  // Backend: GET /conversations/:id/messages  — caller appends /<id>/messages
  static const String conversationMessages = '/api/bago/conversations';
  // Backend: POST /conversations/:id/send    — caller appends /<id>/send
  static const String sendMessage = '/api/bago/conversations';

  // ---------------------------------------------------------------------------
  // App settings
  // ---------------------------------------------------------------------------
  static const String appSettings = '/api/bago/get-settings';

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  static const String registerPushToken = '/api/bago/push-token';
  static const String removePushToken = '/api/bago/push-token';
  static const String communicationPrefs = '/api/bago/communication-prefs';
  static const String getNotifications = '/api/bago/getNotifications';
  static const String markNotificationRead = '/api/bago/markNotificationAsRead';
  static const String markAllNotificationsRead =
      '/api/bago/markAllNotificationsAsRead';

  // ---------------------------------------------------------------------------
  // Tracking (public endpoint on backend)
  // ---------------------------------------------------------------------------
  static const String trackPackage = '/api/bago/public/track';

  // ---------------------------------------------------------------------------
  // Support / CRM
  // ---------------------------------------------------------------------------
  static const String supportTickets = '/api/bago/support/tickets';
  static const String banners = '/api/bago/banners';

  // ---------------------------------------------------------------------------
  // Sender onboarding
  // ---------------------------------------------------------------------------
  static const String shipmentTermsAccept = '/api/bago/shipment-terms/accept';
  static const String shipmentTermsStatus = '/api/bago/shipment-terms/status';
  static const String phoneSendOtp = '/api/bago/phone/send-otp';
  static const String phoneVerifyOtp = '/api/bago/phone/verify';
  static const String itemCategories = '/api/bago/item-categories';
}

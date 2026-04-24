import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/multi_step_login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/auth/screens/signin_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/help/screens/help_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/kyc/screens/kyc_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/onboarding/screens/withdrawal_setup_screen.dart';
import '../../features/legal/screens/banned_screen.dart';
import '../../features/legal/screens/privacy_screen.dart';
import '../../features/legal/screens/terms_screen.dart';
import '../../features/messages/screens/conversation_screen.dart';
import '../../features/messages/screens/messages_screen.dart';
import '../../features/payment/screens/order_success_screen.dart';
import '../../features/payment/screens/payment_failed_screen.dart';
import '../../features/payment/screens/payment_screen.dart';
import '../../features/profile/screens/add_bank_screen.dart';
import '../../features/profile/screens/change_email_screen.dart';
import '../../features/profile/screens/change_phone_screen.dart';
import '../../features/profile/screens/change_password_screen.dart';
import '../../features/profile/screens/communication_prefs_screen.dart';
import '../../features/profile/screens/currency_settings_screen.dart';
import '../../features/profile/screens/edit_bio_screen.dart';
import '../../features/profile/screens/edit_details_screen.dart';
import '../../features/profile/screens/payment_methods_screen.dart';
import '../../features/profile/screens/payments_refunds_screen.dart';
import '../../features/profile/screens/payout_methods_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/ratings_screen.dart';
import '../../features/profile/screens/saved_routes_screen.dart';
import '../../features/profile/screens/support_screen.dart';
import '../../features/profile/screens/withdraw_screen.dart';
import '../../features/services_pages/screens/buy_items_screen.dart';
import '../../features/services_pages/screens/gift_items_screen.dart';
import '../../features/services_pages/screens/group_shipping_screen.dart';
import '../../features/settings/screens/language_settings_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/shell/shell_screen.dart';
import '../../features/shipments/screens/create_shipment_screen.dart';
import '../../features/shipments/screens/request_shipment_screen.dart';
import '../../features/shipments/models/request_model.dart';
import '../../features/shipments/screens/shipment_details_screen.dart';
import '../../features/shipments/screens/shipment_request_screen.dart';
import '../../features/shipments/screens/requests_screen.dart';
import '../../features/shipments/screens/shipments_screen.dart';
import '../../features/home/screens/search_results_screen.dart';
import '../../features/shipments/screens/tracking_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/trips/models/trip_model.dart';
import '../../features/trips/screens/post_trip_screen.dart';
import '../../features/trips/screens/trip_details_screen.dart';
import '../../features/trips/screens/trips_screen.dart';

// ---------------------------------------------------------------------------
// Router notifier – bridges Riverpod auth state → GoRouter refresh
// ---------------------------------------------------------------------------
class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) : _authState = _ref.read(authProvider) {
    _ref.listen<AuthState>(authProvider, (prev, next) {
      final navigationChanged = prev?.isLoggedIn != next.isLoggedIn ||
          prev?.isInitialising != next.isInitialising;
      _authState = next;
      if (navigationChanged) notifyListeners();
    });
  }

  final Ref _ref;
  AuthState _authState;

  AuthState get authState => _authState;
}

final _routerNotifierProvider = ChangeNotifierProvider(
  (ref) => _RouterNotifier(ref),
);

// ---------------------------------------------------------------------------
// Router provider
// ---------------------------------------------------------------------------
final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(_routerNotifierProvider);

  return GoRouter(
    refreshListenable: notifier,
    initialLocation: '/',
    redirect: (context, state) {
      final auth = notifier.authState;
      final isLoggedIn = auth.user != null;
      final isInitialising = auth.isInitialising;
      final loc = state.matchedLocation;

      final isAuthRoute = loc.startsWith('/auth');
      final isOnboarding = loc == '/onboarding';
      // Routes accessible without login (guest mode)
      final isGuestAllowed = loc == '/home' ||
          loc.startsWith('/trips-list') ||
          loc.startsWith('/trip-details') ||
          loc.startsWith('/legal') ||
          loc.startsWith('/help');
      if (loc == '/') return null;
      if (isInitialising) return null;

      if (!isLoggedIn && !isAuthRoute && !isOnboarding && !isGuestAllowed) return '/home';
      // Allow signup/signin even when logged in (e.g. from onboarding)
      if (isLoggedIn && isAuthRoute && loc != '/auth/signup' && loc != '/auth/signin') return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (_, state) => NoTransitionPage(
          child: SplashScreen(
            forceReplay: state.uri.queryParameters['replay'] == '1',
            nextRoute: state.uri.queryParameters['next'],
          ),
        ),
      ),
      GoRoute(
        path: '/role-switch',
        pageBuilder: (_, state) => NoTransitionPage(
          child: SplashScreen(
            forceReplay: true,
            nextRoute: state.uri.queryParameters['next'] ?? '/home',
            replayDurationMs: int.tryParse(
                  state.uri.queryParameters['duration'] ?? '',
                ) ??
                3000,
          ),
        ),
      ),

      // ── Onboarding (first launch only) ───────────────────────────────────
      GoRoute(
        path: '/onboarding',
        pageBuilder: (_, __) => const NoTransitionPage(child: OnboardingScreen()),
      ),

      // ── Auth ──────────────────────────────────────────────────────────────
      GoRoute(
        path: '/auth/signin',
        pageBuilder: (_, __) => const NoTransitionPage(child: SignInScreen()),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const MultiStepLoginScreen(),
      ),
      GoRoute(
        path: '/auth/signup',
        builder: (_, __) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          final token = state.uri.queryParameters['token'];
          return OtpScreen(email: email, signupToken: token);
        },
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return ForgotPasswordScreen(initialEmail: email);
        },
      ),
      GoRoute(
        path: '/auth/reset-password',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          final token = state.uri.queryParameters['token'] ?? '';
          return ResetPasswordScreen(email: email, token: token);
        },
      ),

      // ── Main shell (bottom tabs) ───────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (_, __) => const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/shipments',
            builder: (_, __) => const ShipmentsScreen(),
          ),
          GoRoute(
            path: '/requests',
            builder: (_, __) => const RequestsScreen(),
          ),
          GoRoute(
            path: '/trips',
            builder: (_, __) => const TripsScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (_, __) => const MessagesScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return ConversationScreen(conversationId: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/profile/currency',
            builder: (_, __) => const CurrencySettingsScreen(),
          ),
        ],
      ),

      // ── Shipments ─────────────────────────────────────────────────────────
      GoRoute(
        path: '/create-shipment',
        builder: (_, __) => const CreateShipmentScreen(),
      ),
      GoRoute(
        path: '/shipment-details/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ShipmentDetailsScreen(shipmentId: id);
        },
      ),
      GoRoute(
        path: '/request-shipment/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final trip = state.extra is TripModel ? state.extra as TripModel : null;
          return RequestShipmentScreen(tripId: id, initialTrip: trip);
        },
      ),
      GoRoute(
        path: '/shipment-request/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final request = state.extra is RequestModel ? state.extra as RequestModel : null;
          return ShipmentRequestScreen(requestId: id, preloadedRequest: request);
        },
      ),
      // ── Trips ─────────────────────────────────────────────────────────────
      GoRoute(
        path: '/post-trip',
        builder: (_, __) => const PostTripScreen(),
      ),
      GoRoute(
        path: '/edit-trip/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final trip = state.extra is TripModel ? state.extra as TripModel : null;
          return PostTripScreen(tripId: id, initialTrip: trip);
        },
      ),
      GoRoute(
        path: '/trip-details/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final trip = state.extra is TripModel ? state.extra as TripModel : null;
          return TripDetailsScreen(tripId: id, preloadedTrip: trip);
        },
      ),
      GoRoute(
        path: '/trips-list',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return SearchResultsScreen(
            fromCity: extra['from'] as String?,
            toCity: extra['to'] as String?,
            date: extra['date'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/tracking',
        builder: (_, __) => const TrackingScreen(),
      ),

      // ── Payment ───────────────────────────────────────────────────────────
      GoRoute(
        path: '/payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PaymentScreen(extra: extra);
        },
      ),
      GoRoute(
        path: '/order-success',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return OrderSuccessScreen(extra: extra);
        },
      ),
      GoRoute(
        path: '/payment-failed',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PaymentFailedScreen(extra: extra);
        },
      ),

      // ── KYC ───────────────────────────────────────────────────────────────
      GoRoute(
        path: '/kyc',
        builder: (context, state) {
          final from = state.uri.queryParameters['from'];
          return KycScreen(fromOnboarding: from == 'onboarding');
        },
      ),

      // ── Withdrawal setup (post-KYC onboarding) ───────────────────────────
      GoRoute(
        path: '/setup-withdrawal',
        builder: (_, __) => const WithdrawalSetupScreen(),
      ),

      // ── Settings ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/settings',
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/settings/language',
        builder: (_, __) => const LanguageSettingsScreen(),
      ),

      // ── Services ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/services/buy-items',
        builder: (_, __) => const BuyItemsScreen(),
      ),
      GoRoute(
        path: '/services/gift-items',
        builder: (_, __) => const GiftItemsScreen(),
      ),
      GoRoute(
        path: '/services/group-shipping',
        builder: (_, __) => const GroupShippingScreen(),
      ),

      // ── Help ──────────────────────────────────────────────────────────────
      GoRoute(
        path: '/help/:topic',
        builder: (context, state) {
          final topic = state.pathParameters['topic']!;
          return HelpScreen(topic: topic);
        },
      ),

      // ── Profile sub-pages ─────────────────────────────────────────────────
      GoRoute(
        path: '/profile/edit-details',
        builder: (_, __) => const EditDetailsScreen(),
      ),
      GoRoute(
        path: '/profile/edit-bio',
        builder: (_, __) => const EditBioScreen(),
      ),
      GoRoute(
        path: '/profile/change-email',
        builder: (_, __) => const ChangeEmailScreen(),
      ),
      GoRoute(
        path: '/profile/change-phone',
        builder: (_, __) => const ChangePhoneScreen(),
      ),
      GoRoute(
        path: '/profile/change-password',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return ChangePasswordScreen(initialEmail: email);
        },
      ),
      GoRoute(
        path: '/profile/payment-methods',
        builder: (_, __) => const PaymentMethodsScreen(),
      ),
      GoRoute(
        path: '/profile/payout-methods',
        builder: (_, __) => const PayoutMethodsScreen(),
      ),
      GoRoute(
        path: '/profile/add-bank',
        builder: (_, __) => const AddBankScreen(),
      ),
      GoRoute(
        path: '/profile/ratings',
        builder: (_, __) => const RatingsScreen(),
      ),
      GoRoute(
        path: '/profile/saved-routes',
        builder: (_, __) => const SavedRoutesScreen(),
      ),
      GoRoute(
        path: '/profile/support',
        builder: (_, __) => const SupportScreen(),
      ),
      GoRoute(
        path: '/profile/withdraw',
        builder: (_, __) => const WithdrawScreen(),
      ),
      GoRoute(
        path: '/profile/payments-refunds',
        builder: (_, __) => const PaymentsRefundsScreen(),
      ),
      GoRoute(
        path: '/profile/communication-prefs',
        builder: (_, __) => const CommunicationPrefsScreen(),
      ),

      // ── Legal ─────────────────────────────────────────────────────────────
      GoRoute(
        path: '/legal/privacy',
        builder: (_, __) => const PrivacyScreen(),
      ),
      GoRoute(
        path: '/legal/terms',
        builder: (_, __) => const TermsScreen(),
      ),
      GoRoute(
        path: '/banned',
        builder: (context, state) {
          final reason = state.uri.queryParameters['reason'];
          return BannedScreen(reason: reason);
        },
      ),
    ],
  );
});

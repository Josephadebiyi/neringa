import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'dart:async';

import '../../core/theme/app_colors.dart';
import '../auth/providers/auth_provider.dart';
import '../onboarding/screens/onboarding_screen.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({
    super.key,
    this.forceReplay = false,
    this.nextRoute,
    this.autoNavigate = true,
    this.replayDurationMs = 1600,
  });

  final bool forceReplay;
  final String? nextRoute;
  final bool autoNavigate;
  final int replayDurationMs;

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeIn;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoGlow;
  late final Animation<double> _streakTravel;
  ProviderSubscription<AuthState>? _authSubscription;
  Timer? _failsafeTimer;
  bool _hasNavigated = false;
  late final bool _isReplaySplash;

  // Single point of navigation — idempotent, safe to call multiple times.
  // router is passed in so this works even after the widget is unmounted.
  void _go(GoRouter router, String target) {
    if (_hasNavigated) return;
    debugPrint('🚀 Splash navigating to: $target');
    _hasNavigated = true;
    _failsafeTimer?.cancel();
    _authSubscription?.close();
    _authSubscription = null;
    FlutterNativeSplash.remove();
    router.go(target);
  }

  void _handleAuthState(AuthState authState) {
    debugPrint('🔑 _handleAuthState: isInitialising=${authState.isInitialising} isLoggedIn=${authState.isLoggedIn} _hasNavigated=$_hasNavigated');
    if (_hasNavigated || authState.isInitialising) return;

    // Capture router NOW (before async gap) — GoRouter lives beyond this widget.
    final router = GoRouter.of(context);

    Future<void>(() async {
      if (_hasNavigated || _isReplaySplash) return;
      final target = await _resolveInitialRoute(authState);
      debugPrint('🗺 Resolved route: $target');
      if (_hasNavigated) return;
      _go(router, target);
    });
  }

  Future<String> _resolveInitialRoute(AuthState authState) async {
    if (widget.nextRoute != null || authState.isLoggedIn) {
      return widget.nextRoute ?? '/home';
    }
    final seen = await hasSeenOnboarding()
        .timeout(const Duration(seconds: 2), onTimeout: () => false);
    return seen ? '/home' : '/onboarding';
  }

  @override
  void initState() {
    super.initState();
    _isReplaySplash = widget.forceReplay || widget.nextRoute != null;

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1450),
    );
    _fadeIn = Tween<double>(begin: 0.82, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _logoScale = Tween<double>(begin: 0.94, end: 1.03).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );
    _logoGlow = Tween<double>(begin: 16, end: 34).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _streakTravel = Tween<double>(begin: -40, end: 40).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );

    if (_isReplaySplash) {
      _controller.repeat(reverse: true);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        FlutterNativeSplash.remove();
      });
      Future.delayed(Duration(milliseconds: widget.replayDurationMs), () {
        if (mounted && widget.autoNavigate) {
          context.go(widget.nextRoute ?? '/home');
        }
      });
    } else {
      _authSubscription = ref.listenManual<AuthState>(
        authProvider,
        (_, next) => _handleAuthState(next),
      );
      // Hard deadline: after 8s navigate regardless of auth state.
      _failsafeTimer = Timer(const Duration(seconds: 8), () async {
        if (_hasNavigated || !mounted) return;
        final router = GoRouter.of(context);
        _go(router, '/home');
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _handleAuthState(ref.read(authProvider));
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _authSubscription?.close();
    _authSubscription = null;
    _failsafeTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isReplaySplash) {
      return Scaffold(
        backgroundColor: AppColors.primary,
        body: Stack(
          children: [
            Center(
              child: Image.asset(
                'assets/images/bago-logo-white.png',
                height: 62,
                fit: BoxFit.contain,
              ),
            ),
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: GestureDetector(
                    onTap: () {
                      final router = GoRouter.of(context);
                      _go(router, '/home');
                    },
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.20),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(Icons.close_rounded,
                          color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Opacity(
              opacity: _fadeIn.value,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 164,
                    height: 164,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          Colors.white.withValues(alpha: 0.20),
                          Colors.white.withValues(alpha: 0.02),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  Transform.translate(
                    offset: Offset(_streakTravel.value, 0),
                    child: Container(
                      width: 144,
                      height: 4,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.white.withValues(alpha: 0.0),
                            Colors.white.withValues(alpha: 0.85),
                            Colors.white.withValues(alpha: 0.0),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  Transform.scale(
                    scale: _logoScale.value,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: Colors.white.withValues(alpha: 0.30),
                            blurRadius: _logoGlow.value,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/images/bago-logo-white.png',
                        height: 62,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

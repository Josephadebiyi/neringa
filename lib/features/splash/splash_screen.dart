import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';

import '../../core/theme/app_colors.dart';
import '../auth/providers/auth_provider.dart';

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
  Timer? _failsafeTimer;
  late final bool _isReplaySplash;
  bool _navigationScheduled = false;

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
      Future.delayed(Duration(milliseconds: widget.replayDurationMs), () {
        if (mounted && widget.autoNavigate) {
          context.go(widget.nextRoute ?? '/home');
        }
      });
    } else {
      // Navigation is driven by the router redirect (app_router.dart) which
      // fires automatically when auth resolves. This 3-second failsafe is a
      // last-resort in case the redirect doesn't fire for any reason.
      _failsafeTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) context.go('/home');
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _failsafeTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (!_isReplaySplash && !auth.isInitialising) {
      _scheduleHomeNavigation();
    }

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
                    onTap: () => context.go('/home'),
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

  void _scheduleHomeNavigation() {
    if (_navigationScheduled) return;
    _navigationScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.go('/home');
    });
  }
}

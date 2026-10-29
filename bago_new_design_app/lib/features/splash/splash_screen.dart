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
  // Airbnb-style: the logo on the brand colour, one quiet fade-and-settle,
  // then straight into the app. No looping effects.
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 450),
  );
  late final Animation<double> _fade =
      CurvedAnimation(parent: _controller, curve: Curves.easeOut);
  late final Animation<double> _scale = Tween<double>(begin: 0.94, end: 1)
      .animate(
          CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

  /// How long the splash stays up on a cold start, at minimum.
  static const _minVisibleMs = 900;

  Timer? _failsafeTimer;
  late final bool _isReplaySplash;
  bool _navigationScheduled = false;
  final _entranceClock = Stopwatch()..start();

  @override
  void initState() {
    super.initState();
    _isReplaySplash = widget.forceReplay || widget.nextRoute != null;
    _controller.forward();

    if (_isReplaySplash) {
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
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) _controller.value = 1;
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

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: Image.asset(
              'assets/images/bago-logo-white.png',
              height: 56,
              fit: BoxFit.contain,
            ),
          ),
        ),
      ),
    );
  }

  void _scheduleHomeNavigation() {
    if (_navigationScheduled) return;
    _navigationScheduled = true;
    final remaining = _minVisibleMs - _entranceClock.elapsedMilliseconds;
    Future.delayed(Duration(milliseconds: remaining.clamp(0, _minVisibleMs)),
        () {
      if (mounted) context.go('/home');
    });
  }
}

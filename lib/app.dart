import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/models/user_model.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/widgets/app_unlock_gate.dart';
import 'l10n/app_localizations.dart';
import 'shared/providers/app_lock_provider.dart';
import 'shared/providers/locale_provider.dart';
import 'shared/services/push_notification_service.dart';

class BagoApp extends ConsumerWidget {
  const BagoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
      locale: locale,
      supportedLocales: supportedAppLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) => _SecurityGateHost(
        child: _NotificationPromptHost(
          child: child ?? const SizedBox.shrink(),
        ),
      ),
    );
  }
}

class _SecurityGateHost extends ConsumerStatefulWidget {
  const _SecurityGateHost({required this.child});

  final Widget child;

  @override
  ConsumerState<_SecurityGateHost> createState() => _SecurityGateHostState();
}

class _SecurityGateHostState extends ConsumerState<_SecurityGateHost>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final auth = ref.read(authProvider);
    final appLock = ref.read(appLockProvider);

    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      appLock.noteBackgrounded();
      return;
    }

    if (state == AppLifecycleState.resumed) {
      appLock.noteResumed(isLoggedIn: auth.isLoggedIn);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final appLock = ref.watch(appLockProvider);

    ref.listen<AuthState>(authProvider, (previous, next) {
      appLock.handleAuthenticatedSession(isLoggedIn: next.isLoggedIn);
    });

    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (auth.isLoggedIn && appLock.locked) const AppUnlockGate(),
      ],
    );
  }
}

class _NotificationPromptHost extends ConsumerStatefulWidget {
  const _NotificationPromptHost({required this.child});

  final Widget child;

  @override
  ConsumerState<_NotificationPromptHost> createState() =>
      _NotificationPromptHostState();
}

class _NotificationPromptHostState
    extends ConsumerState<_NotificationPromptHost> {
  String? _lastPromptedUserId;
  bool _notificationPromptOpen = false;

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      final previousUserId = previous?.user?.id;
      final nextUser = next.user;

      if (nextUser == null) {
        _lastPromptedUserId = null;
        return;
      }

      if (previousUserId != nextUser.id) {
        _scheduleNotificationPrompt(nextUser);
      }
    });

    return widget.child;
  }

  void _scheduleNotificationPrompt(UserModel user) {
    if (_notificationPromptOpen || _lastPromptedUserId == user.id) return;
    _lastPromptedUserId = user.id;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;

      final shouldPrompt = await PushNotificationService.instance
          .shouldShowLoginNotificationPrompt();
      if (!mounted || !shouldPrompt) return;

      _notificationPromptOpen = true;
      final allow = await showDialog<bool>(
            context: context,
            barrierDismissible: false,
            builder: (dialogContext) => AlertDialog(
              title: const Text('Allow notifications?'),
              content: const Text(
                'Get instant updates about messages, shipment activity, and delivery progress.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Not now'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Allow'),
                ),
              ],
            ),
          ) ??
          false;
      _notificationPromptOpen = false;

      if (!mounted || !allow) return;

      await PushNotificationService.instance.prepareForSignedInUser();

      final status = await PushNotificationService.instance
          .notificationAuthorizationStatus();
      if (!mounted) return;

      final granted = status == ApnsAuthStatus.authorized;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            granted
                ? 'Notifications enabled for this account.'
                : 'Notifications were not enabled. You can change this later in Settings.',
          ),
        ),
      );
    });
  }
}

import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/model_enums.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/auth_required_modal.dart';
import '../auth/providers/auth_provider.dart';
import '../messages/providers/message_provider.dart';
import '../shipments/models/request_model.dart';
import '../shipments/providers/shipment_provider.dart';

class ShellScreen extends ConsumerStatefulWidget {
  const ShellScreen({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  static const _pollInterval = Duration(seconds: 120);

  Timer? _pollTimer;
  Timer? _messagePollTimer;
  bool _bootstrapScheduled = false;
  bool _messageBootstrapScheduled = false;
  bool _requestPopupVisible = false;
  Set<String> _knownPendingRequestIds = {};

  // Publish tab has an empty path — it's an action, not a destination.
  static const _publishPath = '';

  List<_TabItem> _tabs() => [
    const _TabItem(icon: Icons.search_rounded, label: 'Search', path: '/home'),
    const _TabItem(icon: Icons.add_circle_rounded, label: 'Publish', path: _publishPath),
    const _TabItem(icon: Icons.local_shipping_rounded, label: 'Activity', path: '/activity'),
    const _TabItem(icon: Icons.chat_bubble_outline_rounded, label: 'Inbox', path: '/messages'),
    const _TabItem(icon: Icons.person_outline_rounded, label: 'Profile', path: '/profile'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _ensurePolling();
      _ensureMessagePolling();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messagePollTimer?.cancel();
    super.dispose();
  }

  int _currentIndex(BuildContext context, List<_TabItem> tabs) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].path.isEmpty) continue; // Publish is an action, not a destination
      if (loc.startsWith(tabs[i].path)) return i;
    }
    return 0;
  }

  void _ensurePolling() {
    if (_pollTimer != null || _bootstrapScheduled) return;

    _bootstrapScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      _bootstrapScheduled = false;
      if (!mounted) return;
      await _primeIncomingRequests(initialSnapshot: true);
      if (!mounted || _pollTimer != null) return;
      _pollTimer = Timer.periodic(_pollInterval, (_) => _primeIncomingRequests());
    });
  }

  void _ensureMessagePolling() {
    if (_messagePollTimer != null || _messageBootstrapScheduled) return;

    _messageBootstrapScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      _messageBootstrapScheduled = false;
      if (!mounted) return;
      await _primeUnreadMessages();
      if (!mounted || _messagePollTimer != null) return;
      _messagePollTimer = Timer.periodic(_pollInterval, (_) => _primeUnreadMessages());
    });
  }

  Future<void> _primeUnreadMessages() async {
    if (!mounted) return;
    final isLoggedIn = ref.read(authProvider).isLoggedIn;
    if (!isLoggedIn) return;
    try {
      await ref.read(messageProvider.notifier).loadUnreadCount();
    } catch (_) {
      // keep silent; the messages page handles its own visible errors
    }
  }

  Future<void> _primeIncomingRequests({bool initialSnapshot = false}) async {
    if (!mounted) return;

    try {
      final incoming = await ref.read(shipmentProvider.notifier).refreshIncomingRequests();
      final pending = incoming
          .where((r) => r.status == RequestStatus.pending && r.id.isNotEmpty)
          .toList();
      final ids = pending.map((r) => r.id).toSet();

      if (_knownPendingRequestIds.isEmpty || initialSnapshot) {
        _knownPendingRequestIds = ids;
        return;
      }

      final newRequests = pending.where((r) => !_knownPendingRequestIds.contains(r.id)).toList();
      _knownPendingRequestIds = ids;

      if (newRequests.isNotEmpty) {
        await _showIncomingRequestPopup(newRequests.first);
      }
    } catch (_) {
      // Keep polling silently; the list page still handles visible errors.
    }
  }

  Future<void> _showIncomingRequestPopup(RequestModel request) async {
    if (!mounted || _requestPopupVisible) return;
    _requestPopupVisible = true;
    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) {
          bool accepting = false;
          bool rejecting = false;

          Future<void> accept() async {
            if (accepting || rejecting) return;
            accepting = true;
            try {
              await ref.read(shipmentProvider.notifier).acceptRequest(request.id);
              if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request accepted')),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(e.toString())),
                );
              }
            } finally {
              accepting = false;
            }
          }

          Future<void> reject() async {
            if (accepting || rejecting) return;
            rejecting = true;
            try {
              await ref.read(shipmentProvider.notifier).rejectRequest(request.id);
              if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request declined')),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(e.toString())),
                );
              }
            } finally {
              rejecting = false;
            }
          }

          final previewImage = (request.image ?? '').trim().isNotEmpty
              ? request.image!.trim()
              : (request.packageImages.isNotEmpty ? request.packageImages.first : '');

          return SafeArea(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withValues(alpha: 0.12),
                    blurRadius: 28,
                    offset: const Offset(0, 14),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 46,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.notifications_active_rounded, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'New shipment request',
                                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                request.senderName ?? 'A sender wants to ship with you',
                                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (previewImage.isNotEmpty) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: AspectRatio(
                          aspectRatio: 1.45,
                          child: CachedNetworkImage(
                            imageUrl: previewImage,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Container(
                              color: AppColors.gray100,
                              child: const Icon(Icons.inventory_2_outlined, color: AppColors.gray300, size: 40),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _QuickDetail(label: 'Route', value: [
                      if ((request.fromLocation ?? '').isNotEmpty) request.fromLocation!,
                      if ((request.toLocation ?? '').isNotEmpty) request.toLocation!,
                    ].join(' → ')),
                    _QuickDetail(label: 'Package', value: request.packageTitle ?? 'Shipment request'),
                    _QuickDetail(
                      label: 'Price',
                      value: '${request.currency} ${request.agreedPrice.toStringAsFixed(2)}',
                    ),
                    if ((request.message ?? '').trim().isNotEmpty)
                      _QuickDetail(label: 'Message', value: request.message!.trim()),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: AppButton(
                            label: 'View details',
                            variant: AppButtonVariant.outline,
                            onPressed: () {
                              Navigator.of(sheetContext).pop();
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                if (context.mounted) {
                                  context.push(
                                    '/shipment-request/${request.id}',
                                    extra: request,
                                  );
                                }
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: AppButton(
                            label: 'Reject',
                            variant: AppButtonVariant.outline,
                            onPressed: rejecting ? null : reject,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppButton(
                            label: 'Accept',
                            isLoading: accepting,
                            onPressed: accepting ? null : accept,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    } finally {
      _requestPopupVisible = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = ref.watch(
      messageProvider.select((state) => state.unreadCount),
    );
    final incomingRequests = ref.watch(
      shipmentProvider.select((state) => state.incomingRequests),
    );
    final tabs = _tabs();
    final currentIndex = _currentIndex(context, tabs);
    final pendingCount = incomingRequests
        .where((r) => r.status == RequestStatus.pending)
        .length;

    _ensurePolling();
    _ensureMessagePolling();

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          border: const Border(
            top: BorderSide(color: AppColors.border, width: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: BottomNavigationBar(
            currentIndex: currentIndex,
            elevation: 0,
            backgroundColor: Colors.transparent,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: AppColors.black,
            unselectedItemColor: AppColors.gray400,
            selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            onTap: (i) {
                final tab = tabs[i];
                final isLoggedIn = ref.read(authProvider).isLoggedIn;
                // Publish tab — action, not destination
                if (tab.path.isEmpty) {
                  if (!isLoggedIn) {
                    showAuthRequiredModal(context);
                    return;
                  }
                  context.push('/post-trip');
                  return;
                }
                if (!isLoggedIn && tab.path != '/home') {
                  showAuthRequiredModal(context);
                  return;
                }
                context.go(tab.path);
              },
            items: tabs.map((tab) {
                final isInboxTab = tab.path == '/messages';
                final isActivityTab = tab.path == '/activity';
                final isPublishTab = tab.path.isEmpty;
                return BottomNavigationBarItem(
                  icon: isPublishTab
                      ? const Icon(Icons.add_circle_rounded)
                      : _NavTabIcon(
                          icon: tab.icon,
                          showBadge: (isActivityTab && pendingCount > 0) ||
                              (isInboxTab && unreadCount > 0),
                          badgeCount: isInboxTab ? unreadCount : (isActivityTab ? pendingCount : 0),
                        ),
                  label: tab.label,
                );
              }).toList(),
          ),
        ),
      ),
    );
  }
}

class _NavTabIcon extends StatelessWidget {
  const _NavTabIcon({
    required this.icon,
    required this.showBadge,
    this.badgeCount = 0,
  });

  final IconData icon;
  final bool showBadge;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (showBadge)
          Positioned(
            top: -4,
            right: -8,
            child: Container(
              padding: badgeCount > 0
                  ? const EdgeInsets.symmetric(horizontal: 5, vertical: 1)
                  : EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.white, width: 1.5),
              ),
              child: badgeCount > 0
                  ? Center(
                      child: Text(
                        badgeCount > 99 ? '99+' : '$badgeCount',
                        style: const TextStyle(
                          color: AppColors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ),
      ],
    );
  }
}

class _QuickDetail extends StatelessWidget {
  const _QuickDetail({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 78,
            child: Text(
              label,
              style: AppTextStyles.labelXs.copyWith(
                color: AppColors.gray500,
                letterSpacing: 0.8,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMd.copyWith(
                color: AppColors.black,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.icon,
    required this.label,
    required this.path,
  });
  final IconData icon;
  final String label;
  final String path;
}

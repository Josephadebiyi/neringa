import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/trip_model.dart';
import '../services/trip_service.dart';

/// Lets a business account create and manage its named per-kg shipping
/// services (e.g. "Express", "Standard"). These are shown to senders on the
/// same search results screen as individual travelers' trips, and priced
/// through the exact same checkout-preview pipeline — see
/// BusinessServiceController.js on the backend for why that matters.
class BusinessServicesScreen extends ConsumerStatefulWidget {
  const BusinessServicesScreen({super.key});

  @override
  ConsumerState<BusinessServicesScreen> createState() =>
      _BusinessServicesScreenState();
}

class _BusinessServicesScreenState
    extends ConsumerState<BusinessServicesScreen> {
  List<TripModel>? _services;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final services = await TripService.instance.getMyBusinessServices();
      if (!mounted) return;
      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _openEditor({TripModel? existing}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ServiceEditorSheet(existing: existing),
    );
    if (saved == true) _load();
  }

  Future<void> _confirmDelete(TripModel service) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Remove service'),
            content: Text(
                'Remove "${service.serviceName}"? Senders will no longer see it in search.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child:
                    const Text('Remove', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    try {
      await TripService.instance.deleteBusinessService(service.id);
      if (!mounted) return;
      AppSnackBar.show(context, message: 'Service removed');
      _load();
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCompany = ref.watch(authProvider).user?.isCompany == true;

    return BagoSubPageScaffold(
      title: 'Business services',
      trailing: IconButton(
        icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
        onPressed: isCompany ? () => _openEditor() : null,
      ),
      child: !isCompany
          ? const _InfoState(
              icon: Icons.storefront_outlined,
              message: 'Business services are available to business accounts.',
            )
          : _isLoading
              ? const Padding(
                  padding: EdgeInsets.only(top: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              : _error != null
                  ? _InfoState(icon: Icons.error_outline_rounded, message: _error!)
                  : (_services?.isEmpty ?? true)
                      ? _InfoState(
                          icon: Icons.storefront_outlined,
                          message:
                              'No services yet. Add a named rate like "Express" or "Standard" — senders will see it priced the same way as any trip, everywhere in the app.',
                          action: AppButton(
                            label: 'Add a service',
                            onPressed: () => _openEditor(),
                          ),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (final service in _services!)
                              _ServiceCard(
                                service: service,
                                onEdit: () => _openEditor(existing: service),
                                onDelete: () => _confirmDelete(service),
                              ),
                          ],
                        ),
    );
  }
}

class _InfoState extends StatelessWidget {
  const _InfoState({required this.icon, required this.message, this.action});
  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 40),
      child: Column(
        children: [
          Icon(icon, size: 40, color: AppColors.gray400),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
          ),
          if (action != null) ...[
            const SizedBox(height: 20),
            action!,
          ],
        ],
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({
    required this.service,
    required this.onEdit,
    required this.onDelete,
  });
  final TripModel service;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isPending = service.status.toLowerCase() == 'pending_admin_review';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.storefront_rounded, color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(service.serviceName ?? 'Service',
                    style: AppTextStyles.labelMd
                        .copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(
                  '${service.currency} ${service.pricePerKg.toStringAsFixed(2)}/kg'
                  '${isPending ? ' · Pending admin approval' : ''}',
                  style: AppTextStyles.bodySm.copyWith(
                    color: isPending ? AppColors.warning : AppColors.gray500,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppColors.gray500),
            onPressed: onEdit,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: AppColors.gray500),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _ServiceEditorSheet extends ConsumerStatefulWidget {
  const _ServiceEditorSheet({this.existing});
  final TripModel? existing;

  @override
  ConsumerState<_ServiceEditorSheet> createState() =>
      _ServiceEditorSheetState();
}

class _ServiceEditorSheetState extends ConsumerState<_ServiceEditorSheet> {
  late final _nameCtrl =
      TextEditingController(text: widget.existing?.serviceName ?? '');
  late final _priceCtrl = TextEditingController(
      text: widget.existing != null
          ? widget.existing!.pricePerKg.toStringAsFixed(2)
          : '');
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    final price = double.tryParse(_priceCtrl.text.trim());
    if (name.isEmpty) {
      setState(() => _error = 'Enter a service name, e.g. "Express".');
      return;
    }
    if (price == null || price <= 0) {
      setState(() => _error = 'Enter a valid price per kg.');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      final currency =
          ref.read(authProvider).user?.preferredCurrency ?? 'USD';
      if (widget.existing != null) {
        await TripService.instance.updateBusinessService(
          id: widget.existing!.id,
          name: name,
          pricePerKg: price,
        );
      } else {
        await TripService.instance.createBusinessService(
          name: name,
          pricePerKg: price,
          currency: currency,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.existing != null ? 'Edit service' : 'Add a service',
              style: AppTextStyles.h3,
            ),
            const SizedBox(height: 16),
            AppTextField(
              controller: _nameCtrl,
              label: 'Service name',
              hint: 'e.g. Express, Standard',
            ),
            const SizedBox(height: 14),
            AppTextField(
              controller: _priceCtrl,
              label: 'Price per kg',
              hint: '0.00',
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            AppButton(
              label: widget.existing != null ? 'Save changes' : 'Add service',
              isLoading: _isSaving,
              onPressed: _isSaving ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}

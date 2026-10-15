import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../shared/services/storage_service.dart';
import '../../../shared/utils/country_currency_helper.dart';

class ShipmentCheckoutService {
  ShipmentCheckoutService._();
  static final ShipmentCheckoutService instance = ShipmentCheckoutService._();

  static const _draftKey = 'shipment_checkout_draft';
  static const Duration draftLifetime = Duration(minutes: 20);
  static const int draftLifetimeMinutes = 20;

  final StorageService _storage = StorageService.instance;
  final ValueNotifier<int> draftVersion = ValueNotifier<int>(0);
  Timer? _expiryTimer;

  Future<void> saveDraft(Map<String, dynamic> draft) async {
    await _storage.write(_draftKey, jsonEncode(draft));
    _scheduleExpiry(draft);
    draftVersion.value++;
  }

  Future<Map<String, dynamic>?> loadDraft() async {
    final raw = await _storage.read(_draftKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        if (isExpired(decoded)) {
          await clearDraft();
          return null;
        }
        _scheduleExpiry(decoded);
        return decoded;
      }
    } catch (_) {}
    return null;
  }

  Future<void> clearDraft() async {
    _expiryTimer?.cancel();
    _expiryTimer = null;
    await _storage.delete(_draftKey);
    draftVersion.value++;
  }

  void _scheduleExpiry(Map<String, dynamic> draft) {
    _expiryTimer?.cancel();
    final expiresAt = DateTime.tryParse(draft['expiresAt']?.toString() ?? '');
    if (expiresAt == null) return;
    final remaining = expiresAt.difference(DateTime.now());
    if (remaining <= Duration.zero) {
      unawaited(clearDraft());
      return;
    }
    _expiryTimer = Timer(remaining, () => unawaited(clearDraft()));
  }

  bool isExpired(Map<String, dynamic> draft) {
    final raw = draft['expiresAt']?.toString();
    if (raw == null || raw.isEmpty) return false;
    final expiresAt = DateTime.tryParse(raw);
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt);
  }

  String providerForCurrency(String currency) {
    return CurrencyConversionHelper.providerForCurrency(currency);
  }
}

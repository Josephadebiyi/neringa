import '../../features/auth/models/user_model.dart';
import 'device_currency_helper.dart';

class UserCurrencyHelper {
  UserCurrencyHelper._();

  /// Returns the user's preferred currency in uppercase.
  /// Priority: preferredCurrency → currency → device region → 'USD' fallback.
  /// Never returns an empty string — safe to pass directly to APIs.
  static String resolve(UserModel? user) {
    final preferred = user?.preferredCurrency.trim() ?? '';
    if (preferred.isNotEmpty) return preferred.toUpperCase();

    final currency = user?.currency.trim() ?? '';
    if (currency.isNotEmpty) return currency.toUpperCase();

    return DeviceCurrencyHelper.resolve();
  }
}

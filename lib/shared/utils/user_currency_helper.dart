import '../../features/auth/models/user_model.dart';
import 'device_currency_helper.dart';

class UserCurrencyHelper {
  UserCurrencyHelper._();

  /// Returns the user's earning currency in uppercase.
  /// Priority: earningCurrency → preferredCurrency → currency → device region → 'USD' fallback.
  /// Never returns an empty string — safe to pass directly to APIs.
  static String resolve(UserModel? user) {
    final earning = user?.earningCurrency?.trim() ?? '';
    if (earning.isNotEmpty) return earning.toUpperCase();

    final preferred = user?.preferredCurrency.trim() ?? '';
    if (preferred.isNotEmpty) return preferred.toUpperCase();

    final currency = user?.currency.trim() ?? '';
    if (currency.isNotEmpty) return currency.toUpperCase();

    return DeviceCurrencyHelper.resolve();
  }
}

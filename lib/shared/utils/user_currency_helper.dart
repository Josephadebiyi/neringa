import '../../features/auth/models/user_model.dart';
import 'device_currency_helper.dart';
import 'country_currency_helper.dart';

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

  /// Converts wallet balance from wallet's base currency to viewer's preferred currency.
  /// Returns the converted amount, or original amount if conversion not possible.
  static double convertWalletBalance({
    required double balance,
    required String walletCurrency,
    required String viewerCurrency,
  }) {
    final from = walletCurrency.trim().toUpperCase();
    final to = viewerCurrency.trim().toUpperCase();
    if (from.isEmpty || to.isEmpty || from == to) return balance;
    return CurrencyConversionHelper.convert(
      amount: balance,
      fromCurrency: from,
      toCurrency: to,
    );
  }
}

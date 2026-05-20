import '../../features/trips/models/trip_model.dart';
import '../../shared/services/app_settings_service.dart';
import 'country_currency_helper.dart';

class TripPriceDisplay {
  const TripPriceDisplay({
    required this.primary,
    this.secondary,
    required this.usesViewerCurrency,
  });

  final String primary;
  final String? secondary;
  final bool usesViewerCurrency;
}

TripPriceDisplay formatTripPriceForViewer(
  TripModel trip,
  String viewerCurrency, {
  int decimals = 2,
  bool includeBaseSecondary = true,
}) {
  final surcharge = AppSettingsService.instance.cachedOrFallback.surchargeMultiplier;
  final senderPricePerKg = trip.pricePerKg * surcharge;

  final baseCurrency = trip.currency.trim().toUpperCase();
  final preferredCurrency = viewerCurrency.trim().toUpperCase();
  final resolvedBaseCurrency = baseCurrency.isNotEmpty ? baseCurrency : 'USD';

  if (resolvedBaseCurrency.isEmpty) {
    return TripPriceDisplay(
      primary: senderPricePerKg.toStringAsFixed(decimals),
      usesViewerCurrency: false,
    );
  }

  final baseLabel =
      '$resolvedBaseCurrency ${senderPricePerKg.toStringAsFixed(decimals)}/kg';

  if (preferredCurrency.isEmpty ||
      preferredCurrency == resolvedBaseCurrency ||
      !CurrencyConversionHelper.canConvert(
        fromCurrency: resolvedBaseCurrency,
        toCurrency: preferredCurrency,
      )) {
    return TripPriceDisplay(
      primary: baseLabel,
      usesViewerCurrency: false,
    );
  }

  final converted = CurrencyConversionHelper.convert(
    amount: senderPricePerKg,
    fromCurrency: resolvedBaseCurrency,
    toCurrency: preferredCurrency,
  );

  // Preserve precision for small converted amounts
  final effectiveDecimals = converted < 10 ? 2 : decimals;

  return TripPriceDisplay(
    primary: '$preferredCurrency ${converted.toStringAsFixed(effectiveDecimals)}/kg',
    secondary: includeBaseSecondary ? '$baseLabel base' : null,
    usesViewerCurrency: true,
  );
}

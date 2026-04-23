import '../../features/trips/models/trip_model.dart';
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
  final baseCurrency = trip.currency.trim().toUpperCase();
  final preferredCurrency = viewerCurrency.trim().toUpperCase();
  final resolvedBaseCurrency = baseCurrency.isNotEmpty ? baseCurrency : preferredCurrency;

  if (resolvedBaseCurrency.isEmpty) {
    return TripPriceDisplay(
      primary: trip.pricePerKg.toStringAsFixed(decimals),
      usesViewerCurrency: false,
    );
  }

  final baseLabel =
      '$resolvedBaseCurrency ${trip.pricePerKg.toStringAsFixed(decimals)}/kg';

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
    amount: trip.pricePerKg,
    fromCurrency: resolvedBaseCurrency,
    toCurrency: preferredCurrency,
  );

  // Preserve precision for small converted amounts — e.g. 1000 NGN ≈ 0.59 EUR
  // must not round to "1 EUR" when decimals=0.
  final effectiveDecimals = converted < 10 ? 2 : decimals;

  return TripPriceDisplay(
    primary: '$preferredCurrency ${converted.toStringAsFixed(effectiveDecimals)}/kg',
    secondary: includeBaseSecondary ? '$baseLabel base' : null,
    usesViewerCurrency: true,
  );
}

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

  return TripPriceDisplay(
    primary: '$preferredCurrency ${converted.toStringAsFixed(decimals)}/kg',
    secondary: includeBaseSecondary ? '$baseLabel base' : null,
    usesViewerCurrency: true,
  );
}

import 'dart:async';

import 'package:bago_app/features/payment/screens/payment_screen.dart';
import 'package:bago_app/l10n/app_localizations.dart';
import 'package:bago_app/shared/services/api_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});
  GoogleFonts.config.allowRuntimeFetching = false;

  Future<void> checkout(WidgetTester tester, String currency) async {
    await tester.pumpWidget(MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: PaymentScreen(extra: {
        'currency': currency,
        'totalAmount': 100,
        'shippingAmount': 100,
      }),
    ));
    await tester.pump();
  }

  testWidgets(
      'international checkout waits and never falls back when Stripe is disabled',
      (tester) async {
    final requested = Completer<RequestInterceptorHandler>();
    late RequestOptions configOptions;
    ApiService.instance.dio.interceptors.clear();
    ApiService.instance.dio.interceptors
        .add(InterceptorsWrapper(onRequest: (options, handler) {
      if (options.path.endsWith('/config/stripe')) {
        configOptions = options;
        requested.complete(handler);
      } else {
        handler.resolve(Response(requestOptions: options, data: {}));
      }
    }));
    await checkout(tester, 'EUR');
    for (var i = 0; i < 10 && !requested.isCompleted; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(requested.isCompleted, isTrue);
    final handler = await requested.future;
    expect(find.byType(ElevatedButton), findsNothing);
    handler.resolve(
        Response(requestOptions: configOptions, data: {'enabled': false}));
    await tester.pumpAndSettle();
    expect(
        find.text(
            'International card payments are temporarily unavailable. Please try again later.'),
        findsOneWidget);
    expect(find.byType(ElevatedButton), findsNothing);
  });

  testWidgets('local checkout remains available without Stripe configuration',
      (tester) async {
    ApiService.instance.dio.interceptors.clear();
    ApiService.instance.dio.interceptors
        .add(InterceptorsWrapper(onRequest: (options, handler) {
      expect(options.path.endsWith('/config/stripe'), isFalse);
      handler.resolve(Response(requestOptions: options, data: {}));
    }));
    await checkout(tester, 'NGN');
    await tester.pumpAndSettle();
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}

import 'package:bago_app/shared/widgets/country_flag.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('country artwork renders from bundled assets without network', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: CountryFlag(code: ' NG '))));
    await tester.pumpAndSettle();
    expect(find.byType(Image), findsOneWidget);
    expect(find.byType(ClipOval), findsOneWidget);
    expect(tester.takeException(), isNull);
    expect(CountryFlag.codeForLocation('Lagos, Nigeria'), 'ng');
    for (final code in CountryFlag.supportedCodes) {
      final bytes = await rootBundle.load('assets/images/flags/$code.png');
      expect(bytes.lengthInBytes, greaterThan(0), reason: code);
    }
  });
}

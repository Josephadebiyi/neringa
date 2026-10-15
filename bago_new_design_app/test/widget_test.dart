// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bago_app/app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});

  testWidgets('app boots', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: BagoApp(),
      ),
    );
    await tester.pump();
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.byType(BagoApp), findsOneWidget);
  });
}

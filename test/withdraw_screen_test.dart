import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bago_app/features/auth/models/user_model.dart';
import 'package:bago_app/features/auth/providers/auth_provider.dart';
import 'package:bago_app/features/profile/screens/withdraw_screen.dart';

// Fake notifier — overrides build() so no service/storage calls happen in tests
class _FakeAuthNotifier extends AuthNotifier {
  _FakeAuthNotifier(this._fakeUser);
  final UserModel? _fakeUser;

  @override
  AuthState build() =>
      AuthState(user: _fakeUser, isLoading: false, isInitialising: false);
}

UserModel _user({
  String preferredCurrency = 'NGN',
  bool bankAccountLinked = false,
}) =>
    UserModel(
      id: 'u1',
      email: 'test@bago.com',
      fullName: 'Test User',
      kycStatus: 'approved',
      preferredCurrency: preferredCurrency,
      bankAccountLinked: bankAccountLinked,
    );

Widget _wrap(UserModel? user) => ProviderScope(
      overrides: [
        authProvider.overrideWith(() => _FakeAuthNotifier(user)),
      ],
      child: const MaterialApp(home: WithdrawScreen()),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});

  group('WithdrawScreen — UI gates', () {
    testWidgets('shows warning when no bank account linked', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: false)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('No payout method linked'), findsOneWidget);
    });

    testWidgets('withdraw button disabled when no payout method', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: false)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      final btn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Request Withdrawal'),
      );
      expect(btn.onPressed, isNull);
    });

    testWidgets('shows balance card on load', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: true)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('Available Balance'), findsOneWidget);
    });

    testWidgets('shows minimum withdrawal info', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: true)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('Minimum withdrawal'), findsOneWidget);
    });

    testWidgets('shows correct 20% commission label', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: true)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('20%'), findsOneWidget);
    });

    testWidgets('shows "Withdraw all" tap target when bank is linked', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: true)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('Withdraw all'), findsOneWidget);
    });

    testWidgets('shows escrow section on balance card', (tester) async {
      await tester.pumpWidget(_wrap(_user(bankAccountLinked: true)));
      await tester.pump();
      await tester.pump(const Duration(seconds: 4));

      expect(find.textContaining('escrow'), findsOneWidget);
    });
  });
}

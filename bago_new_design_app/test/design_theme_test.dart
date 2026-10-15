import 'package:bago_app/core/theme/app_palette.dart';
import 'package:bago_app/core/theme/app_theme.dart';
import 'package:bago_app/features/home/widgets/home_hero_header.dart';
import 'package:bago_app/shared/widgets/country_flag.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  setUp(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('search cities are stacked and swap remains actionable',
      (tester) async {
    var swaps = 0;
    await tester.pumpWidget(MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
            body: HomeHeroHeader(
                firstName: 'Ada',
                avatarUrl: null,
                unreadCount: 0,
                from: 'Lagos',
                to: 'London',
                date: '',
                onFromTap: () {},
                onToTap: () {},
                onDateTap: () {},
                onSwap: () => swaps++,
                onSearch: () {}))));
    expect(tester.getCenter(find.text('Lagos')).dy,
        lessThan(tester.getCenter(find.text('London')).dy));
    await tester.tap(find.byTooltip('Swap cities'));
    expect(swaps, 1);
    expect(find.text('Find a Route'), findsOneWidget);
    expect(tester.getCenter(find.text('Find a Route')).dy,
        greaterThan(tester.getCenter(find.text('Any date')).dy));
    expect(tester.takeException(), isNull);
  });

  testWidgets('phone dark appearance preserves the main app colors',
      (tester) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.light;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
    Color? surface;
    await tester.pumpWidget(MaterialApp(
        theme: AppTheme.light,
        themeMode: ThemeMode.light,
        home: Builder(builder: (context) {
          surface = AppPalette.of(context).pageBackground;
          return const SizedBox();
        })));
    final lightSurface = surface;
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    await tester.pumpAndSettle();
    expect(surface, lightSurface);
    expect(surface!.computeLuminance(), greaterThan(.8));
  });

  test('flag emoji resolves to a country image code', () {
    expect(CountryFlag.codeFromEmoji('🇳🇬'), 'ng');
    expect(CountryFlag.codeFromEmoji('🌍'), '');
  });
}

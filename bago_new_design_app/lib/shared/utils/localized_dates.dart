import 'package:intl/intl.dart';

/// Month names in the app language (Intl.defaultLocale is kept in sync with
/// the app locale in app.dart). Use these for anything shown on screen.
String monthShort(int month) => DateFormat.MMM().format(DateTime(2000, month));

String monthLong(int month) => DateFormat.MMMM().format(DateTime(2000, month));

const _englishShortMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/// English short month, for date strings that are stored or sent and later
/// parsed (e.g. "Dec 15, 2025"). Never show these directly — wrap the
/// display with [localizeEnglishDate].
String englishShortMonth(int month) => _englishShortMonths[month - 1];

/// Renders an English "MMM d, y" value (see [englishShortMonth]) in the app
/// language. Anything it can't parse is returned unchanged.
String localizeEnglishDate(String value) {
  if (value.trim().isEmpty) return value;
  try {
    final parsed = DateFormat('MMM d, y', 'en_US').parseLoose(value.trim());
    return DateFormat.yMMMd().format(parsed);
  } catch (_) {
    return value;
  }
}

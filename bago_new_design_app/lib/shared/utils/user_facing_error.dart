import 'package:dio/dio.dart';

import '../services/api_service.dart';

/// Message shown when an error isn't safe or meaningful to show a user.
const String kGenericErrorMessage = 'Something went wrong. Please try again.';

// Error text that comes from a payment/KYC provider, the server, the network
// layer or a Dart exception — never show it to users. Mirrors the backend's
// utils/clientSafeMessage.js so an older backend can't leak through either.
final List<RegExp> _technicalPatterns = [
  RegExp(
    r'flutterwave|\bflw\b|stripe|paystack|prembly|dojah|mycover|resend|cloudinary|supabase|firebase|twilio|onrender|\brender\b|axios',
    caseSensitive: false,
  ),
  RegExp(
    r'white-?list|ip address|api[ -]?key|secret key|public key|encryption key|authorization key|bearer|merchant|access control|not configured|\bsandbox\b|test mode|live mode|webhook',
    caseSensitive: false,
  ),
  RegExp(r'\bIP\b'),
  RegExp(r'\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b'),
  RegExp(
    r'ECONN(REFUSED|RESET|ABORTED)|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|getaddrinfo|fetch failed|request failed with status code|status code \d{3}|bad gateway|gateway timeout|service unavailable|internal server error|SocketException|HandshakeException|Connection (refused|reset|closed)|Failed host lookup|OS Error|errno',
    caseSensitive: false,
  ),
  RegExp(
    r'DioException|DioError|Instance of|cannot read propert|is not a function|undefined|\bnull\b|NoSuchMethodError|RangeError|FormatException|TypeError|type .+ is not a subtype|Null check operator|LateInitializationError|PlatformException|MissingPluginException|StateError|Unexpected (token|character)|\[object Object\]|stack trace',
    caseSensitive: false,
  ),
  RegExp(
    r'\brelation "|\bcolumn "|violates .* constraint|duplicate key|syntax error at|invalid input syntax|null value in column|\bsql\b|uuid|\bjwt\b|invalid signature',
    caseSensitive: false,
  ),
  RegExp(r'\n\s+at\s|#\d+\s+\S+\s+\(|\.dart:\d+|\.m?js:\d+|node_modules|[{}<>`]|https?://'),
];

final RegExp _exceptionPrefix = RegExp(
  r'^(Exception|Bad state|StateError|Error|DioException \[[^\]]*\]):\s*',
);

/// True when [text] looks technical or provider-specific.
bool isTechnicalErrorText(String text) {
  final value = text.trim();
  if (value.isEmpty) return false;
  if (value.startsWith('Your Stripe Express account is not complete yet.')) {
    return false;
  }
  if (value.length > 300) return true;
  return _technicalPatterns.any((pattern) => pattern.hasMatch(value));
}

/// Cleans a message string before it is shown to a user.
String sanitizeErrorMessage(String? message, {String fallback = kGenericErrorMessage}) {
  if (message == null) return fallback;
  var value = message.trim();
  // `Exception('Insufficient balance').toString()` → 'Insufficient balance'.
  for (var i = 0; i < 2; i++) {
    value = value.replaceFirst(_exceptionPrefix, '').trim();
  }
  if (value.isEmpty || isTechnicalErrorText(value)) return fallback;
  return value;
}

/// Turns any caught error (DioException, Exception, String, ...) into a
/// short, friendly message that is safe to show in the UI.
String userFacingError(Object? error, {String fallback = kGenericErrorMessage}) {
  if (error == null) return fallback;
  if (error is DioException) {
    return sanitizeErrorMessage(ApiService.parseError(error), fallback: fallback);
  }
  return sanitizeErrorMessage(error.toString(), fallback: fallback);
}

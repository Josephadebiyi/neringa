/// Carries a trip id from a tapped share link (`sendwithbago.com/trip/<id>`)
/// across the sign-in detour: a user who opens a shared trip without being
/// logged in gets sent to sign in first, then lands back on the booking
/// screen for that same trip once authenticated.
///
/// In-memory only — the whole link-tap → sign-in → resume sequence happens
/// within one app session, so nothing here needs to survive a process kill.
class PendingTripLink {
  PendingTripLink._();

  static String? _tripId;

  static void set(String tripId) => _tripId = tripId;

  static String? consume() {
    final id = _tripId;
    _tripId = null;
    return id;
  }
}

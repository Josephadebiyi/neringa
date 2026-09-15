// Carries a shared trip across the signup/login detour: a visitor who opens
// a shared trip link without an account gets sent to sign up first, then
// lands back on the booking flow with the same trip preselected.
const PENDING_TRIP_KEY = 'bago_pending_trip';

export function setPendingTripRedirect(trip) {
    try {
        sessionStorage.setItem(PENDING_TRIP_KEY, JSON.stringify(trip));
    } catch {
        // sessionStorage unavailable (private browsing, etc.) — booking still
        // works, the visitor just has to reselect the trip after auth.
    }
}

export function peekPendingTripRedirect() {
    try {
        const raw = sessionStorage.getItem(PENDING_TRIP_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function consumePendingTripRedirect() {
    try {
        const raw = sessionStorage.getItem(PENDING_TRIP_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(PENDING_TRIP_KEY);
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

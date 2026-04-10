// Session Manager for Web App
// Implements 5-hour inactivity timeout

const INACTIVITY_TIMEOUT = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const LAST_ACTIVITY_KEY = 'last_activity_timestamp';

let inactivityTimer = null;
let activityCheckInterval = null;

/**
 * Update last activity timestamp
 */
export const updateActivity = () => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
};

/**
 * Get time since last activity in milliseconds
 */
const getTimeSinceLastActivity = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return Infinity;
    return Date.now() - parseInt(lastActivity, 10);
};

/**
 * Check if session is expired due to inactivity
 */
export const isSessionExpired = () => {
    const timeSinceActivity = getTimeSinceLastActivity();
    return timeSinceActivity > INACTIVITY_TIMEOUT;
};

/**
 * Initialize inactivity tracking
 * @param {Function} onTimeout - Callback when session expires
 */
export const initInactivityTracking = (onTimeout) => {
    // Set initial activity timestamp
    updateActivity();

    // Track user activity events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
        updateActivity();
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for inactivity periodically
    activityCheckInterval = setInterval(() => {
        if (isSessionExpired()) {
            cleanup();
            if (onTimeout) {
                onTimeout();
            }
        }
    }, ACTIVITY_CHECK_INTERVAL);

    // Cleanup function
    return () => {
        cleanup();
        activityEvents.forEach(event => {
            window.removeEventListener(event, handleActivity);
        });
    };
};

/**
 * Clear inactivity tracking
 */
export const cleanup = () => {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
        activityCheckInterval = null;
    }
};

/**
 * Reset session timer (call on login)
 */
export const resetSession = () => {
    updateActivity();
};

/**
 * Clear session (call on logout)
 */
export const clearSession = () => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    cleanup();
};

/**
 * Get remaining session time in milliseconds
 */
export const getRemainingTime = () => {
    const timeSinceActivity = getTimeSinceLastActivity();
    const remaining = INACTIVITY_TIMEOUT - timeSinceActivity;
    return Math.max(0, remaining);
};

/**
 * Format remaining time as human-readable string
 */
export const getFormattedRemainingTime = () => {
    const remaining = getRemainingTime();
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
};

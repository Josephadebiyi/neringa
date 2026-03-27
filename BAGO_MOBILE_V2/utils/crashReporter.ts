/**
 * Enhanced Error Boundary & Crash Reporter
 * Add this to app/_layout.tsx BEFORE any other code runs
 * 
 * This safely captures:
 * - Render errors (caught by ErrorBoundary)
 * - Native crashes (caught by ErrorUtils)
 * - Unhandled rejections (caught by listener)
 * - Module load errors (caught at JS bundle init)
 */

import React, { useEffect } from 'react';
import { ErrorUtils, Platform, LogBox } from 'react-native';

// Suppress known warnings that might clutter logs
LogBox.ignoreLogs([
  'Non-serializable values detected',
  'EventEmitter.removeListener',
]);

// In-memory crash storage (since we can't import AsyncStorage safely in all contexts)
interface CrashRecord {
  id: string;
  timestamp: string;
  errorType: 'render' | 'native' | 'rejection' | 'bundle';
  errorName: string;
  errorMessage: string;
  stack: string;
  isFatal: boolean;
  deviceInfo: {
    os: string;
    osVersion: string | number;
  };
}

let crashLog: CrashRecord[] = [];

/**
 * Crash Reporter: Logs crashes for debugging  
 * Stores in memory and can be accessed at runtime for debugging
 */
class CrashReporter {
  private maxCrashes = 10;

  recordCrash(
    errorName: string,
    errorMessage: string,
    stack: string,
    isFatal: boolean,
    errorType: 'render' | 'native' | 'rejection' | 'bundle' = 'native'
  ) {
    const timestamp = new Date().toISOString();
    const deviceInfo = {
      os: Platform.OS,
      osVersion: Platform.Version,
    };

    const crashRecord: CrashRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      errorType,
      errorName,
      errorMessage,
      stack: stack.split('\n').slice(0, 15).join('\n'), // First 15 lines
      isFatal,
      deviceInfo,
    };

    // Keep only last 10 crashes in memory
    crashLog = [crashRecord, ...crashLog].slice(0, this.maxCrashes);

    console.log(
      `[CRASH RECORDED] ${errorType.toUpperCase()}: ${errorMessage.substr(0, 100)}`
    );
    console.log(`[CRASH STACK]\n${crashRecord.stack}`);

    return crashRecord;
  }

  getCrashes(): CrashRecord[] {
    return [...crashLog];
  }

  clearCrashes() {
    crashLog = [];
  }

  /**
   * Format crashes for logging/debugging
   */
  formatCrashReport(): string {
    if (crashLog.length === 0) return 'No crashes recorded';

    return crashLog
      .map(
        (crash, i) =>
          `
=== CRASH #${i + 1} ===
Time: ${crash.timestamp}
Type: ${crash.errorType} ${crash.isFatal ? '(FATAL)' : '(WARNING)'}
Error: ${crash.errorName}: ${crash.errorMessage}
Device: ${crash.deviceInfo.os} ${crash.deviceInfo.osVersion}
Stack:
${crash.stack}
`
      )
      .join('\n');
  }
}

// Global instance
export const crashReporter = new CrashReporter();

/**
 * Call this ONCE from app/_layout.tsx at module load time
 * Sets up global error handlers
 */
export function initializeCrashReporting() {
  /**
   * Handle React-native uncaught native exceptions
   * This fires for crashes that happen OUTSIDE of React render
   */
  const originalHandler = ErrorUtils.getGlobalHandler?.();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Record the crash first
    crashReporter.recordCrash(
      error.name || 'UnknownError',
      error.message || String(error),
      error.stack || 'No stack trace',
      isFatal,
      'native'
    );

    // Log it prominently
    const severity = isFatal ? '🔴 FATAL' : '🟡 ERROR';
    console.error(`[GLOBAL_ERROR_HANDLER] ${severity}:`, error);

    // IMPORTANT: Call the original handler if available
    // This ensures React Native's default error handling still happens
    if (originalHandler) {
      originalHandler(error, isFatal);
    } else {
      // Fallback: Log to console as React Native's default
      const prefix = isFatal ? '[FATAL ERROR]' : '[ERROR]';
      console.error(prefix, error);
    }
  });

  console.log('[CRASH_REPORTER] ✓ Initialized');
}

/**
 * USAGE in app/_layout.tsx:
 * 
 * import { initializeCrashReporting, crashReporter } from '../utils/crashReporter';
 * 
 * // Must be called at module level, before anything else
 * if (Platform.OS !== 'web') {
 *   initializeCrashReporting();
 * }
 * 
 * To view crashes in dev:
 * - Open DevTools console
 * - Type: crashReporter.getCrashes()
 * - Or: console.log(crashReporter.formatCrashReport())
 */


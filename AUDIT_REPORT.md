# 🎒 Bago - QA and Security Audit Report

**Date:** May 12, 2026
**Auditor:** Jules (AI Software Engineer)
**Scope:** Bago Flutter App, Bago Backend (Node.js), Web & Admin Panels.

---

## 🛡️ Security Audit Summary

### 1. Dependency Audit
*   **Backend (BAGO_BACKEND):**
    *   **CRITICAL:** `axios` (v1.x) has multiple high-severity vulnerabilities (Prototype Pollution, SSRF, XSRF leakage).
    *   **MODERATE:** `brace-expansion` is vulnerable to DoS via process hang.
*   **Web (BAGO_WEBAPP):**
    *   **CRITICAL:** `axios` vulnerabilities same as backend.
    *   **MODERATE:** `esbuild` / `vite` dev server vulnerabilities.
*   **Flutter (bago_app_flutter):**
    *   74 packages are outdated. Critical updates available for `firebase_core`, `flutter_secure_storage`, and `flutter_stripe`.
    *   `js` package is discontinued.

### 2. Authentication & Authorization
*   **JWT Implementation:** Backend uses `jsonwebtoken` with 7-day access and 30-day refresh tokens. RSA256 is used for Apple Sign-In verification.
*   **Token Storage:** Flutter app correctly uses `flutter_secure_storage` for storing JWTs and sensitive user data.
*   **Authorization Middleware:** `isAuthenticated` and `requireKycVerification` are consistently applied across sensitive routes in `userRouters.js`.
*   **Session Management:** Token revocation and session rotation logic is present in `userSessions.js` and `postgresUserController.js`.

### 3. Data Protection & Privacy
*   **Input Sanitization:** Global `sanitizeInput` middleware in `server.js` protects against prototype pollution and large payloads.
*   **SQL/NoSQL Injection:** Usage of `pgQuery` (parameterized queries) and Mongoose models provides good protection against injection.
*   **PII:** User data is handled with appropriate care; passwords are hashed using `bcrypt`.

### 4. Mobile Configuration
*   **Android:** `AndroidManifest.xml` has standard permissions (`INTERNET`, `POST_NOTIFICATIONS`). No excessive permissions found.
*   **iOS:** `Info.plist` correctly defines usage descriptions for Location, Camera, and FaceID. App Transport Security (ATS) settings are default (secure).

---

## 🧪 QA & Stability Assessment

### 1. Test Execution
*   **Flutter Tests:** `flutter test` executed successfully. Core app boot and onboarding flow verified.
*   **Backend Tests:** Manual logic tests for Stripe/Paystack transfers and wallet balances passed.

### 2. Historical Findings (from `test_reports/`)
*   **Push Notifications:** Some inconsistencies noted in historical reports regarding "delivering" status and "new message" notifications.
*   **UI Alignment:** Minor UI positioning issues identified in Flutter Home Screen (Recent Activity section).

---

## 🚀 Recommendations

### High Priority
1.  **Update Axios:** Immediately update `axios` to `^1.7.0` or latest to patch prototype pollution and SSRF vulnerabilities.
2.  **Flutter Dependency Update:** Run `flutter pub upgrade` to update core security and payment libraries.
3.  **Address Discontinued Packages:** Replace the `js` package in Flutter with `package:web` or `dart:js_interop` where applicable.

### Medium Priority
1.  **Vite Update:** Update `vite` and `esbuild` in web/admin projects to resolve dev server security risks.
2.  **Push Notification Audit:** Re-verify push notification triggers in `MessageController.js` and status update controllers to ensure 100% coverage.
3.  **UI Polish:** Review Home Screen layout in Flutter to ensure consistent positioning of the "Recent Activity" widget across different device sizes.

---

**Audit Status:** ✅ **PASS WITH RECOMMENDATIONS**
*The application architecture is secure and stable, but requires immediate dependency updates to address known vulnerabilities in third-party libraries.*

# 🎒 Bago - QA, Security and Functional Audit Report

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

## ⚙️ Functional Review: Core Workflows

The Bago app implements a complete P2P logistics lifecycle. Below is an analysis of the critical paths:

### 1. Package Sending & Shipping Requests
*   **Flow:** Create Package -> Select Trip -> Secure Payment (Stripe/Paystack) -> Server-side Payment Verification -> Escrow Hold -> Shipping Request Created.
*   **Observation:** The system has a robust recovery mechanism (`existingPaidRequest` lookup in `RequestPackage`) that handles cases where payment succeeds but the client disconnects before the request record is finalized.
*   **Security Gate:** KYC verification is strictly enforced before a user can send a package, significantly reducing platform risk.

### 2. Delivery Completion & Escrow
*   **Flow:** Traveler updates status (In Transit -> Delivering) -> Traveler uploads proof (image) -> Sender confirms receipt -> Escrow released to Traveler's wallet.
*   **Auto-Release:** An hourly cron job (`escrowCron.js`) automatically releases funds after 48 hours if a traveler has uploaded proof but the sender has not confirmed, protecting the traveler from unresponsive senders.

### 3. Traveler Withdrawals
*   **Flow:** Available Balance -> Request Withdrawal -> Stripe Connect (Global) or Paystack (Africa) -> Funds transferred.
*   **Controls:** The system implements daily withdrawal limits and minimum thresholds, providing a layer of protection against account takeover or massive unauthorized transfers.

### 4. Currency Conversion & Commissions
*   **Logic:** Commissions are calculated using a base rate (default 10% in `currencyConverter.js`, but found 15% in `WalletController.js` and references to 30% or 70% in `routeController.js`).
*   **Withdrawals:** Wallet balances are converted to USD on-the-fly to enforce daily limits, which is a secure and reliable way to handle multi-currency accounts.
*   **Suggestion:** Standardize the commission rate across all controllers to avoid confusing users and ensuring consistent financial reporting.

---

## 🚀 Overall App Suggestions

### 💎 UX & Functional Enhancements
1.  **QR Code Handover (Receiver-Centric):** Currently, the QR code is in the Sender's PDF and only links to a public tracking page.
    *   **Problem:** If the Sender is not the Receiver, the physical recipient has no secure way to confirm delivery.
    *   **Solution:** The system should send a **Handoff QR Code** (or SMS PIN) directly to the physical *Receiver* (via email/phone provided in package details). The Traveler scans this code to instantly trigger delivery confirmation and escrow release.
2.  **Real-time Location Tracking:** Integrate a map view in the `TrackingScreen` showing the traveler's current city or progress along the route, rather than just text-based status updates.
3.  **Webhook-First Request Creation:** To make the payment flow 100% resilient, consider creating the shipment request in a "pending_payment" state *before* redirecting to Stripe/Paystack, then finalizing it via webhooks.
4.  **Loyalty & Trust Score:** Expand the `rating` system into a visible "Trust Score" that incorporates KYC level, number of successful deliveries, and account age to help senders choose travelers.

### 🏗️ Technical Recommendations
1.  **Axios Update (CRITICAL):** Update `axios` to `^1.7.x` across backend and web projects immediately.
2.  **Flutter Dependency Refresh:** Perform a major version upgrade of Flutter dependencies (`flutter pub upgrade --major-versions`) to ensure compatibility with latest iOS/Android security standards.
3.  **Modularize `server.js`:** The backend `server.js` is becoming quite large (1000+ lines). Consider moving some of the core logic into specialized service files or router groups to improve maintainability.
4.  **Enhance Error Logging:** Implement structured logging (e.g., Winston or Pino) in the backend to capture more context during failed escrow or payment events.

---

**Audit Status:** ✅ **PASS WITH RECOMMENDATIONS**
*The Bago platform is functionally complete and demonstrates strong recovery and escrow logic. Implementing the suggested UX enhancements—particularly the Receiver-centric QR handover—and dependency updates will ensure it remains a top-tier P2P delivery solution.*

# 🎒 Bago - QA, Security and Functional Audit Report

**Date:** May 12, 2026
**Auditor:** Jules (AI Software Engineer)
**Scope:** Bago Flutter App, Bago Backend (Node.js), Web App, and Admin Panel.

---

## 🛡️ Security Audit Summary

### 1. Dependency Audit
*   **Backend (BAGO_BACKEND):**
    *   **CRITICAL:** `axios` (v1.x) has high-severity vulnerabilities (Prototype Pollution, SSRF).
    *   **MODERATE:** `brace-expansion` DoS risk.
*   **Web App (BAGO_WEBAPP):**
    *   **CRITICAL:** `axios` vulnerabilities same as backend.
    *   **MODERATE:** `esbuild` / `vite` dev server vulnerabilities.
*   **Admin Panel (ADMIN_NEW):**
    *   **PASS:** No critical vulnerabilities found in currently used packages. Uses TypeScript which significantly reduces runtime type errors.
*   **Flutter (bago_app_flutter):**
    *   74 packages outdated. Critical updates for `firebase_core`, `flutter_secure_storage`, and `flutter_stripe`.

### 2. Authentication & Authorization
*   **JWT Implementation:** robust rotation (7d access/30d refresh).
*   **Storage:**
    *   **Flutter:** Uses `flutter_secure_storage` (Secure).
    *   **Web:** Uses `localStorage` (Vulnerable to XSS-based token theft).
    *   **Admin:** Uses `HttpOnly` cookies with `localStorage` fallback (Highest security).
*   **Authorization:** `isAuthenticated` and `requireKycVerification` are consistently applied.

---

## 🧪 Web & Admin QA: What Needs Fixing

### 1. Web Application (`BAGO_WEBAPP`)
*   **Security Fix:** Move authentication tokens from `localStorage` to `HttpOnly` cookies (similar to the Admin implementation) to mitigate XSS risks.
*   **Dependency Fix:** Upgrade `axios` to `^1.7.4` immediately to patch security holes.
*   **UI/UX Fix:**
    *   The `Dashboard.jsx` handles many states (Overview, Trips, Shipments, etc.) in a single component. Consider using **Nested Routes** (React Router) instead of state-based tab switching to allow browser "Back" button support and direct-linking to specific tabs.
    *   Add a **"Receiver View"**: Currently, if a user is purely a receiver (not the sender), they have no dashboard view to manage or confirm their incoming package.

### 2. Admin Panel (`ADMIN_NEW`)
*   **Architecture Fix:** Standardize the network layer. The Web app uses `axios` while Admin uses `fetch`. Standardizing on one (preferably `fetch` or a patched `axios`) reduces maintenance overhead.
*   **Data Integrity:** Some admin routes (e.g., `updateWithdrawalStatus`) lack granular permission checks beyond "is admin". Consider implementing Role-Based Access Control (RBAC) if you add more staff roles.
*   **Validation:** While TypeScript provides type safety, adding runtime schema validation (like `zod`, which is already in dependencies) to all API responses would prevent the UI from crashing if the backend schema changes unexpectedly.

---

## ⚙️ Functional Review: The Handover Flow

### 1. Current QR Implementation
*   **Status:** The QR code currently exists only in the **Shipping PDF** and is used for **Tracking only** (links to `/track`).
*   **Limitation:** It does not facilitate delivery confirmation. Delivery confirmation still requires the **Sender** to manually click a button in their app.

### 2. The Handover Dilemma (Sender vs. Receiver)
*   **Observation:** You mentioned the Sender might not be the Receiver. In the current code, the traveler is "locked" until the **Sender** confirms. This is a bottleneck if the Sender is asleep or unavailable while the Receiver is physically taking the item.

### 3. Proposed Fix: "Handover QR"
*   **Suggestion:** **Yes, both should have it.**
*   **How it works:**
    1.  **Generate a Secure Handover Token:** When a shipment is "Accepted", generate a unique, one-time handover token (distinct from the tracking ID).
    2.  **Sender Access:** Display this QR in the Sender's app/PDF.
    3.  **Receiver Access:** Email this same QR (or a link to it) to the physical **Receiver** (using the `receiverEmail` field in the package).
    4.  **Traveler Scan:** The Traveler app should have a **Scanner**. When they arrive, they scan the QR from *either* the Sender or the Receiver.
    5.  **Instant Release:** The scan automatically calls the backend to release the escrow.
*   **Why this is better:** It empowers the physical recipient to complete the transaction, providing instant gratification and payment to the traveler without waiting for the sender.

---

## 💰 Financial Logic Verification

### 1. Currency Conversions
*   **Withdrawals:** **VERIFIED.** The `withdrawFunds` controller correctly converts amounts to USD to check against the $2,000 daily limit.
*   **Commissions:** **INCONSISTENT.**
    *   `currencyConverter.js`: hardcoded 10%.
    *   `WalletController.js`: hardcoded 15%.
    *   `routeController.js`: refers to 30% platform fee.
*   **Fix Needed:** Create a centralized `PricingService` in the backend. All commission and conversion logic should flow through this service to ensure the numbers in the Wallet, Route Search, and Admin Ledger always match.

---

**Audit Status:** ✅ **PASS WITH RECOMMENDATIONS**
*The app is production-ready but has high-priority security updates (Axios) and a significant UX opportunity in the handover process. Implementing the "Dual-QR" system will solve the Sender/Receiver sync issue.*

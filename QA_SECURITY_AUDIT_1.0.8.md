# Bago 1.0.8 (119) QA and security audit

Date: 2026-10-15. Scope: new Flutter app, checkout/escrow, KYC and administrator trip proof. This is a source and automated regression review, not a guarantee that every flow is defect-free or a completed external penetration test.

## Confirmed findings fixed

| Severity | Finding | Fix / evidence |
| --- | --- | --- |
| Critical | KYC sync trusted a client callback approval and reference. | Ignore caller status/reference. Use authenticated user-owned stored sessions, signed webhook records and provider API results. Forged approval and cross-user reference regressions pass. |
| High | Stripe booking could trust client amounts or omit authoritative commission/conversion fields. | Server computes checkout total including commission and insurance; verifies exact captured amount, currency and sender/package/trip/traveler binding. Reject stale prices before charging. |
| High | An interrupted checkout could charge again or leave a paid booking incomplete. | Persist payment reference on device, retain pending drafts, recover captured/in-flight intents server-side before FX recalculation, serialize booking by payment reference and finalize captured Stripe payments from signed webhooks. |
| High | Flutterwave verification lacked complete recorded-payment ownership checks. | Verify authenticated sender, server-recorded package/trip, amount and currency; prevent caller metadata overriding server bindings. |
| High | Wallet earnings could be converted from the sender payment currency rather than the trip payout currency. | Convert traveler earnings from trip currency to wallet currency; preserve authoritative commission; roll back when no wallet exists. Currency regression tests pass. |
| High | Vulnerable backend runtime dependencies. | Patch compatible dependencies and overrides. Production audit reduced from 1 critical / 11 high / 12 moderate to 0 critical / 0 high / 8 moderate. |
| Medium | Trip proof preview/download relied on direct storage links and could return unreadable files. | Authenticated admin proxy, Cloudinary HTTPS allowlist, reject redirects, timeout and size/type checks; sniff PDF/image bytes and use correct MIME/extension. Five regressions pass. |
| Medium | KYC completion redirect waited for a provider request; users could repeat capture unnecessarily. | Return completion page immediately, reconcile in background, check existing session before camera permissions, poll every two seconds and leave active waiting after 30 seconds with pending status. |

## Validation

- Backend: 162 tests passed across 29 files.
- Flutter: 42 tests passed. Includes simulated native card success/decline/cancel, Apple Pay amount/cancel, paid-intent recovery, booking retries, currency and interface checks.
- Administrator production build passed after proof and dependency changes.
- Flutter analysis: no errors; 13 warnings and 68 informational findings remain (unused fields/elements, unnecessary assertions, async-context/style/deprecation notices). Analysis is not clean.
- Administrator dependency audit: zero vulnerabilities (including development dependencies).
- Backend production dependency audit: eight moderate Firebase/Google/UUID dependency-chain findings remain. Full development audit additionally flags the nodemon/chokidar/braces chain; nodemon is excluded from production install. Do not force an untested Firebase major upgrade as an automatic audit fix.
- Source secret-pattern scan: no private signing keys, Stripe secret keys, GitHub tokens or AWS access keys matched in release source. This is a limited pattern scan, not complete historical secret detection.
- Light app theme retained; country flags are bundled locally, so network availability does not control flag visibility.

## Deployment and live verification requirements

Render deploys main. Card checkout requires matching STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY, plus STRIPE_WEBHOOK_SECRET. An explicit STRIPE_CHECKOUT_ENABLED=false disables checkout. Configure the Stripe endpoint /api/webhooks/stripe with payment_intent.succeeded events (and failure/processing events as appropriate). Keys alone do not establish webhook subscription or delivery.

No live card charge, physical iPhone Apple Pay transaction, production wallet settlement or real Prembly identity submission was performed during this audit. Verify these with the deployed release before public distribution, including app-closed payment recovery, commission ledger entries and administrator proof access using real authorized accounts. Bank declines remain possible.

KYC provider/manual review latency cannot be guaranteed. Background recovery and short active waiting remove app-imposed delays; they do not bypass identity verification. The Render configuration currently uses a free backend plan, which may cold-start and delay requests; a paid always-on service is required to remove that infrastructure delay.

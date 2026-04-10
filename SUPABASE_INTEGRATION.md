# Supabase Integration

This repository now has a Supabase bootstrap for:

- PostgreSQL access from the Render backend via `SUPABASE_DB_URL`
- Supabase Auth clients in Flutter, the React web app, and the admin app
- Supabase Storage buckets for avatars, KYC files, shipment media, support attachments, and travel documents
- Row Level Security policies that let end users access only their own records while keeping admin workflows and payment logic on the backend

## Client-side keys

Use these only in Flutter and Vite apps:

- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`

Never ship `SUPABASE_SERVICE_ROLE_KEY` to Flutter, React, or any public repo.

## App-by-app env files

Use tracked example files for each surface and keep real values in ignored local files:

- Backend: [.env.example](/Users/j/Desktop/CLAUDE/BAGO/neringa/.env.example) or [BAGO_BACKEND/.env.example](/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_BACKEND/.env.example)
- Web app: [BAGO_WEBAPP/.env.example](/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/.env.example)
- Admin app: [ADMIN_NEW/.env.example](/Users/j/Desktop/CLAUDE/BAGO/neringa/ADMIN_NEW/.env.example)
- Flutter app: [bago_app_flutter/.env.example.json](/Users/j/Desktop/CLAUDE/BAGO/neringa/bago_app_flutter/.env.example.json)

Suggested local files:

- Backend: `.env`
- Web app: `BAGO_WEBAPP/.env`
- Admin app: `ADMIN_NEW/.env`
- Flutter app: `bago_app_flutter/.env.json`

Recommended shared values across all apps:

- Backend and Flutter/Web/Admin should all point to the same project `SUPABASE_URL`
- Backend `SUPABASE_PUBLISHABLE_KEY` should match client `SUPABASE_PUBLISHABLE_KEY`
- Web/Admin should mirror the same publishable key via `VITE_SUPABASE_PUBLISHABLE_KEY`

Variable mapping:

- Backend: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- Web: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`
- Admin: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`
- Flutter: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `API_BASE_URL`

## Backend-only secrets

Set these on Render only:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

Use `SUPABASE_SERVICE_ROLE_KEY` only for admin tasks such as webhook handling, privileged storage access, KYC/admin moderation, or syncing auth/profile records.

## Database bootstrap

Run the SQL in `supabase/migrations/20260407_initial_bago_schema.sql` inside your Supabase SQL editor or with the Supabase CLI.

The migration creates:

- profiles, staff_roles
- locations, routes
- trips, packages, shipment_requests
- wallet_accounts, wallet_transactions, payment_events
- kyc_verifications
- notifications
- support_tickets, support_messages
- conversations, conversation_participants, messages
- promo_codes, exchange_rates
- auth trigger to create a profile and wallet automatically
- storage buckets and storage RLS policies

## Trust boundaries

Keep these flows on the backend even after migrating to Supabase:

- payment intent creation and verification
- wallet balance updates and escrow mutations
- KYC callback processing
- admin-only moderation and reporting
- any write that spans multiple financial or compliance records

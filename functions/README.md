# Cloudflare Pages Functions

Place API routes under `functions/api/*`.

Required secrets (set in Cloudflare Pages):
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- ORS_API_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAILS
- APP_URL (optional; e.g. https://gimme-the-loop.pages.dev)

Recommended DB migration for Stripe reliability:
- Run `/Users/alan/_localDEV/Loop/db/sql/stripe_reliability.sql` in Supabase SQL editor.

Recommended DB migration for atomic credits:
- Run `/Users/alan/_localDEV/Loop/db/sql/credits_atomic.sql` in Supabase SQL editor.

Recommended DB migration for free-tier protection:
- Run `/Users/alan/_localDEV/Loop/db/sql/rls_hardening.sql` in Supabase SQL editor.

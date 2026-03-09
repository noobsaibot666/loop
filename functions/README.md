# Cloudflare Pages Functions

Place API routes under `functions/api/*`.

Required secrets (set in Cloudflare Pages):
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- ORS_API_KEY
- OPENAI_API_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- ADMIN_EMAILS
- APP_URL (optional; e.g. https://gimme-the-loop.pages.dev)

Optional secrets:
- OPENAI_MODEL (defaults to `gpt-4o-mini`)

Recommended DB migration for Stripe reliability:
- Run `/Users/alan/_localDEV/Loop/db/sql/stripe_reliability.sql` in Supabase SQL editor.

Recommended DB migration for atomic credits:
- Run `/Users/alan/_localDEV/Loop/db/sql/credits_atomic.sql` in Supabase SQL editor.

Recommended DB migration for free-tier protection:
- Run `/Users/alan/_localDEV/Loop/db/sql/rls_hardening.sql` in Supabase SQL editor.

Recommended DB migration for Alleycat Mode:
- Run `/Users/alan/_localDEV/Loop/db/sql/messenger_mode.sql` in Supabase SQL editor.

Recommended DB migration for advisor cleanup:
- Run `/Users/alan/_localDEV/Loop/db/sql/supabase_security_followups.sql` in Supabase SQL editor.

Admin bootstrap:
- Create or update an admin auth user with `npm run admin:create -- admin@email.com strong-password`
- Make sure the admin email is included in `ADMIN_EMAILS`

Supabase Auth hardening:
- Enable leaked password protection in Dashboard -> Auth -> Providers -> Email

AI drafting:
- AI draft tooling is admin-only and review-gated.
- Keep `OPENAI_API_KEY` server-side only.
- For local dev, store it in `.env`.
- For production on Cloudflare, set it with `wrangler secret put OPENAI_API_KEY`.

# Supabase Audit Report: deqzjblulrxhixmyoocm

Date: 2026-02-12

## Scope
Quick audit focused on reducing abuse and egress risk while staying on the Supabase Free plan.

## Snapshot (Current Auth Config)
Observed via Supabase Management API:
- `site_url`: `http://192.168.178.146:3000/`
- `uri_allow_list`: `http://192.168.178.146:3000/auth/callback`
- `disable_signup`: `false`
- `security_captcha_enabled`: `false`
- `oauth_server_enabled`: `false`
- Rate limits present (`rate_limit_otp`, `rate_limit_verify`, `rate_limit_email_sent`, etc.)

## Why This Matters (Free Tier)
Supabase Free is sensitive to bandwidth/egress spikes. Egress overages are typically caused by one or more of:
- Public tables with weak/missing RLS plus a leaked `anon` key
- Direct client querying REST endpoints with large selects or no limits
- Storage hotlinking or large public files
- Bots hammering endpoints (auth, REST, storage)

The LAN `site_url` itself does not create egress. It indicates this project is configured like a development environment and may still have permissive security defaults.

## Recommendations (Prioritized)

### P0 (Do First)
1. Rotate keys
- Rotate Supabase `anon` key and `service_role` key.
- Update any apps that still use this project.

2. Lock down data access with RLS
- Ensure RLS is enabled on all non-trivial public tables.
- Revoke broad `anon` and `authenticated` privileges on tables that should not be queried directly.
- Add narrowly-scoped policies (select-only for `auth.uid() = user_id` where needed).

3. Check Storage buckets
- Make buckets private unless truly needed public.
- Avoid hotlinking from public pages.

### P1 (Stabilize Auth)
4. Update Auth URL configuration
- Replace LAN `site_url` with a stable real domain.
- Restrict allowed redirects to only active domains.

5. Disable signups if not needed
- If this project is not meant for public user creation, set `disable_signup = true`.

6. Enable CAPTCHA (if available on your plan)
- Helps reduce bot-driven auth traffic.

### P2 (Operational Controls)
7. Add server-side gating
- Prefer server-side access (Cloudflare worker/functions) over direct client selects.

8. Add request limits at the edge
- Cloudflare rate limits for endpoints that still face the public internet.

## Investigation Checklist
To pinpoint the true source of egress later:
- Which app/site(s) use the `anon` key for this project?
- Any endpoints listing large collections (no `limit`)?
- Are Storage objects served publicly (hotlink)?
- Any logs showing high-volume REST calls (bots)?

## Minimal Safe Baseline
- No public tables without RLS
- No broad policies like `using (true)`
- Storage private by default
- `site_url` and redirects reflect real domains
- Keys rotated after any suspected leakage

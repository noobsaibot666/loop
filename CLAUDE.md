# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Loop is a web app for bike messenger and night-ride coordination. It is deployed on **Cloudflare Pages** (`gimme-the-loop.pages.dev`). The companion mobile app is **Hard Chain** (at `../APPS/LOOP/app`), which shares the same backend.

## Commands

```bash
npm run dev           # Vite dev server (frontend)
npm run dev:server    # Express local server for testing server-side code
npm run build         # tsc -b && vite build
npm run lint          # GTS lint and format check
npm run fix           # GTS auto-fix for formatting and safe lint fixes
npm run clean         # GTS clean

# Admin
npm run admin:create -- admin@email.com strong-password

# Verification
npm run verify:loop-routes
```

Development tooling details live in `docs/development-tooling.md`.

## Architecture

### Frontend (`src/`)
- **React 18 + Vite + TypeScript**, single-page app with React Router v7
- Lazy-loaded pages in `src/pages/`. All routes render inside `<MainLayout>` (`src/components/MainLayout.tsx`)
- State: **Zustand** stores in `src/store/` — one store per domain (`useAuthStore`, `useLoopStore`, `useAlleycatStore`, `useFeedStore`, `useCreditStore`, `useCitiesStore`, `useProfileStore`, `useUIStore`)
- Auth: Supabase magic link + password login. Session managed in `useAuthStore` using `zustand/persist`
- API calls: `src/utils/routeUtils.ts` — `postJSON` / `getJSON` helpers that auto-attach the Supabase Bearer token and resolve paths against `API_BASE` (`src/config.ts`)
- Internationalization: `src/i18n.tsx` wraps the app via `<I18nProvider>`

### Backend (`functions/`)
- **Cloudflare Pages Functions** — file-based routing under `functions/api/`
- CORS handled globally by `functions/_middleware.js`
- Common utilities in `functions/_utils.js`
- Secrets injected by Cloudflare (not in code): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ORS_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`
- Static vars in `wrangler.toml`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- OpenAI usage is **admin-only** and never exposed client-side

### Database (`db/sql/`)
- **Supabase** (Postgres + Auth + Storage)
- Migrations are plain `.sql` files applied manually via the Supabase SQL editor (no migration runner)
- Storage buckets: `alleycat-proofs` (checkpoint proof images), `night-ride-posts`

### Configuration (`src/config.ts`)
Central place for Supabase client, `API_BASE` resolution, credit costs, storage bucket names, and the city preset list. When adding new constants, add them here.

## Key env vars (`.env` for local dev)

| Var | Used by |
|-----|---------|
| `VITE_API_BASE` | Frontend — API base URL (defaults to `localhost:8787`) |
| `VITE_SUPABASE_URL` | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Frontend |
| `OPENAI_API_KEY` | Functions (admin AI features) |

## Deployment

Production deploys automatically via Cloudflare Pages CI on push. Secrets (Stripe, OpenAI, Supabase service role) are set in the Cloudflare dashboard — **never commit them**. The `SUPABASE_ANON_KEY` in `wrangler.toml` is the public anon key, not a secret.

## City Expansion

New cities use a **code-driven workflow**. Manual city requests are decommissioned.
1. **Database**: Update `city_packs` and `city_checkpoints` in Supabase.
2. **Ref**: Detailed guide in `../APPS/LOOP/app/docs/Guide/13_city_expansion.md`.

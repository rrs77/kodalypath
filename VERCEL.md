# Deploying Kodály Pathways to Vercel

This repo is set up to deploy as a single Vercel project: a static Vite frontend
plus the Express API as one Node serverless function.

## What's already wired up

- `vercel.json` — install/build commands, output dir, function config, SPA rewrites.
- `api/index.ts` — Vercel serverless entry that re-exports the bundled Express app
  from `artifacts/api-server/dist/handler.mjs`.
- `artifacts/api-server/src/handler.ts` — serverless-friendly Express entry that
  lazily runs the PII migration + idempotent seed on first request (memoised).
- `artifacts/api-server/build.mjs` — emits both `dist/index.mjs` (Replit, calls
  `app.listen`) and `dist/handler.mjs` (Vercel, just exports `app`).
- `artifacts/kodaly-pathways/vite.config.ts` — `BASE_PATH` defaults to `/` and
  `PORT` defaults to `5173`, so `vite build` runs without Replit's env vars.
- `.vercelignore` — keeps Replit-only files, scratch HTML scrapes, and the
  mockup sandbox out of the deployment.

## Required environment variables

Set these in **Project Settings → Environment Variables** for *Production*
(and *Preview* if you want preview deploys to work):

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Use Neon, Supabase, Vercel Postgres, RDS, etc. Must be reachable from `iad1` (or your chosen region). Pooled connection string strongly recommended. |
| `SESSION_SECRET` | Signs the `kp_session` cookie used by `/api/auth/demo` | Long random string. |
| `ENCRYPTION_KEY` | AES-256-GCM key for PII at rest | **64-hex chars (32 bytes)**. Losing this = unrecoverable PII. |
| `EMAIL_HMAC_KEY` | HMAC-SHA256 key for the `teachers.email_hash` lookup column | **64-hex chars (32 bytes)**. Same warning. |
| `CLERK_SECRET_KEY` | Clerk server SDK | From the Clerk dashboard. |
| `CLERK_PUBLISHABLE_KEY` | Clerk server-side publishable key (used by the proxy) | From the Clerk dashboard. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same Clerk publishable key, exposed to the browser | Must be prefixed `VITE_` so Vite inlines it. Re-deploy required to change. |
| `NODE_ENV` | `production` | Vercel sets this automatically; listed for completeness. |

Optional:

| Variable | Purpose |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins to allow in addition to the request's own origin. The current code derives allowed origins from `REPLIT_DOMAINS`; on Vercel that var is unset and CORS becomes permissive for cross-origin requests, which is fine for a single-domain deploy. |

## Database

The app expects a **Postgres** instance with the Drizzle schema applied. Two
options:

1. **Vercel Postgres / Neon / Supabase** — provision a database, copy the
   connection string into `DATABASE_URL`, then run the migration locally once:
   ```bash
   cd lib/db && pnpm run db:push   # or whatever migrate script you use
   ```
   The boot-time `seedIfEmpty()` will populate default Kodály pathway items,
   sample activities, and curriculum links on the first request.

2. **Bring your own Postgres** — same idea; just make sure the URL uses SSL
   (`?sslmode=require`) for managed providers.

The `connect-pg-simple` session store will create its own `session` table on
first use.

## Deploying

1. Push this repo to GitHub/GitLab/Bitbucket and import it into Vercel.
2. **Root Directory**: leave as the repository root.
3. **Framework Preset**: *Other* (the `vercel.json` overrides the build).
4. Set the env vars above.
5. Deploy.

Vercel will:
- run `pnpm install --no-frozen-lockfile`
- build the API (`artifacts/api-server/dist/handler.mjs`)
- build the frontend (`artifacts/kodaly-pathways/dist/public`)
- deploy the static frontend as the site
- deploy `api/index.ts` as a Node 20 serverless function with a 30 s timeout
- rewrite `/api/*` to the function and everything else to the SPA

## Things to verify after the first deploy

- `GET /api/healthz` returns `200`.
- `POST /api/auth/demo` with `{ email, name }` returns a teacher and sets the
  `kp_session` cookie.
- Clerk-hosted login works at `/sign-in`. The proxy path `/api/__clerk/*` must
  return Clerk Frontend API responses.
- The PII migration log line "PII encryption migration failed" does **not**
  appear in the function logs after the first request.

## Things this setup does **not** do

- **No edge runtime.** Express + Drizzle + pdfkit need full Node.
- **No background jobs.** Boot-time work runs on the first request per
  container; it's idempotent and fast (DB no-op once seeded).
- **No file uploads to local disk.** Serverless filesystems are read-only
  outside `/tmp`. PDF generation streams responses, so this is already fine.

# Kodály Pathways

Full-stack web app for UK music teachers (EYFS–KS4) to plan Kodály-method lessons.

## Stack
- Frontend: React + Vite (`artifacts/kodaly-pathways`), wouter router, Tailwind v4 + shadcn/ui, dnd-kit, abcjs, sonner toasts.
- Backend: Express + Drizzle/PostgreSQL (`artifacts/api-server`).
- Contract-first OpenAPI (`lib/api-spec/openapi.yaml`) → Orval-generated React Query hooks (`@workspace/api-client-react`) and Zod validators (`@workspace/api-zod`).
- Cookie session auth (`kp_session`, httpOnly+secure+sameSite:lax). No password — email + name creates a teacher on first sign-in.
- PDF export via pdfkit; resource URL import does best-effort `<title>` scrape.

## Important contract notes
- Orval emits Zod request-body schemas as `<Operation>Body` (e.g. `LoginBody`), not `<Operation>Request`. The OpenAPI components are named `*Request`, but server imports must use `LoginBody` from `@workspace/api-zod`.
- Generated React Query hooks return T directly (data, not `{ data }`).
- `dup.mutate({ id, data: {} })` — the duplicate endpoint's body is required even though optional in spec.

## Build externals
`artifacts/api-server/build.mjs` externalises `pdfkit`, `fontkit`, `brotli` (PDF generation). Adding them to the bundle pulls in `@swc/helpers` cjs which fails at runtime.

## Routes (frontend)
`/login`, `/dashboard`, `/classes`, `/pathway`, `/activities`, `/lesson-builder`, `/lessons/:id`, `/calendar`, `/resources`, `/iwb`, `/settings`. Wouter base = `import.meta.env.BASE_URL` so all paths are prefix-aware.

## Theme
Warm musical palette: sage/teal primary on parchment cream (light mode); deep slate with same accents (dark mode). All HSL vars defined in `src/index.css`.

## DB seed
On boot, `seedIfEmpty()` populates ~85 default Kodály pathway items, 12 sample activities, and 21 NC curriculum links (all with teacherId NULL = global). Re-running is a no-op.

## Generation
`POST /api/lessons/generate` uses `lib/lesson-generator.ts` to produce a 7-component lesson sequence (warm-up → rhythm → solfa → singing game → notation → creative → plenary) with durations normalised to the requested length.

## Workflow restart
After installing pkg deps or editing build externals, restart `artifacts/api-server: API Server`. After frontend changes, Vite HMR is sufficient.

## PII encryption at rest
All personal information is AES-256-GCM encrypted in the database. Helpers live in `artifacts/api-server/src/lib/crypto.ts` (`encrypt`, `decrypt`, `emailHash`). Ciphertext is prefixed `enc:v1:` so migration is idempotent and detectable.

Encrypted columns:
- `teachers.email`, `teachers.name`
- `classes.name`, `classes.notes`
- `lessons.notes`, `lessons.differentiation`, `lessons.send_adaptations`, `lessons.eal_adaptations`
- `calendar_entries.notes`

Email lookup uses a separate deterministic `teachers.email_hash` column (HMAC-SHA256, unique). Login flow: `loginAndSetCookie` in `lib/auth.ts` looks up by `emailHash(cleanEmail)`, decrypts name/email for the response.

Two env vars are required (32-byte hex each, persisted as shared env vars): `ENCRYPTION_KEY`, `EMAIL_HMAC_KEY`. Loss = unrecoverable PII, so do NOT delete or rotate without a planned re-encryption pass.

Boot-time migration `lib/encrypt-existing.ts` runs alongside `seedIfEmpty()` and encrypts any plaintext PII rows it finds (only rows missing the `enc:v1:` prefix are touched).

Out-of-scope (deliberately plaintext): activities, pathway items, curriculum links, resources — these are public/curriculum content and need to remain searchable by `ilike`. Lesson `components` JSONB is also plaintext for now (it primarily references activities; sensitive notes belong on the top-level `lesson.notes`/SEND/EAL fields).

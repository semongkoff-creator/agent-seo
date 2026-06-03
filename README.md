# SEO Agent

Prototype HTML reference + upcoming Next.js app foundation.

## What is in this repo

- `reference-html/` holds the original static HTML prototype.
- `app/`, `components/`, `lib/`, `scripts/`, and `tests/` are the scaffold for the Next.js rewrite.
- `app/api/openapi` exposes a static OpenAPI snapshot, and `app/api/docs` renders a dev-only docs page.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. For Supabase, set `DATABASE_URL` and `DIRECT_URL` to your pooler URLs, and fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. For n8n, set at least one workflow URL. In this repo, `N8N_IDENTIFY_WEBHOOK_URL` is used for identify, and `N8N_OBJECTIVE_WEBHOOK_URL` can be added later. `N8N_WEBHOOK_URL` is optional shared fallback for objective, then fill `N8N_WEBHOOK_SECRET` for BE -> n8n signing and `APP_WEBHOOK_SECRET` for n8n -> BE callback verification.
5. Run the prototype HTML by opening `index.html` in a browser, or use the future Next app once pages are added.
6. Start development with `pnpm dev`.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm db:generate`
- `pnpm db:push`

## Notes

- `index.html` redirects to `reference-html/dashboard.html`.
- The HTML files remain as design references while we build the app structure in Next.js.
- The identify flow is wired to `N8N_IDENTIFY_WEBHOOK_URL`; set it to your n8n webhook endpoint in `.env.local`.
- The outbound identify payload keeps both the merged form data and the original per-step drafts, so the n8n workflow can inspect raw inputs and final context together.
- The objective flow uses `N8N_OBJECTIVE_WEBHOOK_URL` when you add it later; until then it will fall back to `N8N_WEBHOOK_URL` if you choose to reuse one workflow.
- The canonical outbound job payload builders live in `lib/n8n/contracts.ts`.
- The same file also holds callback payload helpers for `diagnosis-complete`, `objective-complete`, and `job-failed`.
- The identify flow signs outgoing requests with `N8N_WEBHOOK_SECRET`, and the n8n callback routes verify `APP_WEBHOOK_SECRET`.
- n8n callback requests should send `x-n8n-signature` and `x-n8n-timestamp`, with the signature computed from `timestamp.body` using `APP_WEBHOOK_SECRET`.
- Authenticated API routes accept either `Authorization: Bearer <supabase-access-token>` or the internal `x-user-id` test header.
- Auth routes also set HttpOnly cookies (`seo-agent-access-token` and `seo-agent-refresh-token`) after login/register/refresh/OAuth callback.
- This repo currently uses Drizzle ORM. I did not switch it to Prisma because that would duplicate the data layer and slow the rewrite down.

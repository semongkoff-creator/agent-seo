# API Scaffold

This folder contains the first-pass API structure for SEO Agent.

Current helpers:
- `app/api/_lib/response.ts` for standard JSON envelopes
- `app/api/_lib/route.ts` for simple try/catch wrappers
- `app/api/health/route.ts` for a basic liveness check
- `app/api/openapi/route.ts` for a static OpenAPI snapshot
- `app/api/docs/route.ts` for a development-only docs page

Planned domains:
- `auth`
- `users`
- `projects`
- `diagnoses`
- `objectives`
- `integrations`
- `api-keys`
- `dashboard`
- `tasks`
- `webhooks/n8n`

Webhook note:
- `lib/n8n/client.ts` sends identify/objective jobs to the workflow URL envs. Use `N8N_IDENTIFY_WEBHOOK_URL` / `N8N_OBJECTIVE_WEBHOOK_URL` if you want separate endpoints, or keep `N8N_WEBHOOK_URL` as the shared fallback.
- `N8N_WEBHOOK_SECRET` signs outbound BE -> n8n requests.
- `APP_WEBHOOK_SECRET` verifies inbound n8n -> BE callbacks.
- Outbound job payloads include `app`, `action`, `job`, `project`, and action-specific data. For identify, the payload also includes both `identify.drafts` and `identify.merged`.
- `lib/n8n/contracts.ts` is the canonical place for outbound payload shape builders and callback payload helpers.
- Callback routes expect `x-n8n-signature` and `x-n8n-timestamp` headers, and the raw body is validated before the JSON payload is processed.
- Authenticated routes can read Supabase access tokens from `Authorization: Bearer <token>` or the internal `x-user-id` testing header.
- Auth login/register/refresh/OAuth callback routes also set HttpOnly cookies so browser sessions work without manual token storage.
- `POST /api/integrations/{provider}` stores an integration connection with optional API key and property payload, and `DELETE` disconnects it.
- `GET /api/diagnoses/{id}/stream` is the live diagnosis monitor stream used by the diagnosis page. It subscribes to Supabase Realtime on the server and emits SSE events to the browser.

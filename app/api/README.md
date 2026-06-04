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

Webhook note:
- `lib/n8n/client.ts` sends identify/objective jobs to the workflow URL envs. Use `N8N_IDENTIFY_WEBHOOK_URL` and `N8N_OBJECTIVE_WEBHOOK_URL` for production endpoints. `N8N_WEBHOOK_URL` is only a shared fallback for local/dev setups.
- Outbound webhook requests include `X-Webhook-Secret` using `N8N_WEBHOOK_SECRET`, which must match the n8n Header Auth credential.
- See `docs/n8n-workflow.md` for the exact n8n node layout, response mode, and recommended expressions.
- `N8N_WEBHOOK_SECRET` signs outbound BE -> n8n requests.
- Outbound job payloads include `app`, `action`, `job`, `project`, and action-specific data. For identify, the payload also includes both `identify.drafts` and `identify.merged`.
- For easier n8n expression mapping, the outbound body also carries flat aliases such as `job_id`, `project_id`, `diagnosis_id`, `objective_id`, `identify_drafts`, `identify_merged`, `diagnosis_result`, and `objective_input`.
- `lib/n8n/contracts.ts` is the canonical place for outbound payload shape builders.
- The current production flow writes results to Supabase directly from n8n.
- Authenticated routes can read Supabase access tokens from `Authorization: Bearer <token>` or the internal `x-user-id` testing header.
- Auth login/register/refresh/OAuth callback routes also set HttpOnly cookies so browser sessions work without manual token storage.
- `POST /api/integrations/{provider}` stores an integration connection with optional API key and property payload, and `DELETE` disconnects it.
- `GET /api/diagnoses/{id}/stream` is the live diagnosis monitor stream used by the diagnosis page. It subscribes to Supabase Realtime on the server and emits SSE events to the browser.
- Upstash Redis rate limiting is optional. If the env vars are absent, the app falls back to a no-op limiter.

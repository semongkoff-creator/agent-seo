# SEO Agent — Full-Stack Implementation Prompt for Codex

> **How to use this file**
> Master spec + sequential task prompts for a coding agent (Codex / Claude Code / Cursor Composer / v0).
> Feed **Section 1 (Project Context)** at session start as system context.
> Then feed **Sections 2–13 as individual tasks** one by one. Do NOT paste the whole file at once — coding agents perform best with bounded, ordered tasks. Verify each task is done (tests green, types clean, no regressions) before moving on.

---

## SECTION 1 — Project Context (paste first, every session)

You are building **SEO Agent**, an AI-powered SaaS platform that diagnoses website SEO problems and generates SMART SEO objectives via a guided multi-step workflow. The static HTML prototype designs the desktop UI; you must convert it to a responsive Next.js app and back it with a TypeScript API. AI work is delegated to an external n8n workflow engine called via webhook.

### Stack (non-negotiable)

**Backend & Runtime**
- Node.js 20 LTS
- Next.js 14 (App Router) — backend lives in `app/api/` Route Handlers
- TypeScript strict mode
- Supabase Postgres (use `@supabase/supabase-js` v2)
- Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- Supabase Auth (email/password + Google OAuth)
- Zod for validation
- `@upstash/ratelimit` for rate limiting
- Pino for logging
- Vitest + Supertest for tests
- pnpm package manager

**Frontend**
- Same Next.js 14 App Router (server + client components)
- Tailwind CSS with custom config matching Stitch design tokens
- shadcn/ui components (Sheet, Dialog, Tabs, DropdownMenu, Accordion, Popover, Toast)
- Lucide icons (replaces Material Symbols from the prototype)
- Recharts for charts (`ResponsiveContainer`)
- framer-motion for transitions where helpful

### Source of visual truth

The HTML in `seo_agent_linked/` (provided alongside this prompt) is the visual reference for desktop layout, colors, spacing, typography, and copy. Use it as a layout spec — but rewrite the markup as semantic React, do NOT paste raw JSX. The HTML is desktop-only; you must produce **one responsive component per page** that adapts to mobile, tablet, and desktop in a single file.

### API conventions

- All API routes return JSON. Standard envelope:
  ```json
  { "ok": true, "data": {...} }
  { "ok": false, "error": { "code": "STRING", "message": "human readable", "details": {...} } }
  ```
- All inputs validated via Zod. Invalid → HTTP 422 with `error.code = "VALIDATION_ERROR"`.
- All mutating routes require auth via `requireUser()`.
- Route handlers only: auth + validate + call service + map errors. Business logic lives in `lib/services/<domain>.ts`.
- All timestamps `timestamptz` UTC. IDs UUID v4 server-side. snake_case in DB, camelCase in TS — Drizzle handles mapping.

### Tailwind breakpoint policy (mobile-first)

| Token | Min width | Use for |
|-------|-----------|---------|
| (default) | 0 | Mobile-first base styles |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablet portrait — start two-column |
| `lg:` | 1024px | Tablet landscape — show sidebar |
| `xl:` | 1280px | Standard desktop — full Stitch layout |
| `2xl:` | 1536px | Wide desktop — optional |

Write base classes for mobile, scale up with `lg:` / `xl:`. Do NOT write desktop-first then `max-lg:` to scale down — backwards and harder to maintain.

### Global responsive rules (apply to every page)

1. **Sidebar.** Visible from `lg:` up as fixed `w-60`. Below `lg:`, hidden by default; replace with bottom navigation bar on mobile + hamburger button (top-left) that opens the sidebar as a slide-in Sheet on tablet.
2. **Top bar / search.** Search field shrinks on tablet, collapses to an icon-only button on mobile that opens a full-screen search overlay.
3. **Page heading.** `text-2xl` mobile, `lg:text-3xl`, `xl:text-4xl`. Subtitle/description hidden on mobile (`hidden sm:block`).
4. **Right-rail sidebars** ("Recommended Next Action", "AI Insights"). Below `xl:`, move them BELOW the main content as a stacked section, not next to it. Use `flex flex-col xl:flex-row` on the container.
5. **Multi-column grids.** Default single column on mobile. Use `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. Card padding shrinks on mobile (`p-4 md:p-6`).
6. **Data tables.** Below `md:`, render as stacked cards. Each row becomes a card with key-value pairs. From `md:` up, normal table.
7. **Modals / Sheets.** shadcn `Sheet` (slide-up from bottom) on mobile, `Dialog` (centered) on desktop. shadcn handles via `side="bottom"` prop on Sheet.
8. **Bottom navigation (mobile only).** Fixed `bottom-0`, 5 items (Dashboard / Projects / Diagnoses / Campaigns / Settings), height 64px. Hidden at `lg:` up. Main content needs `pb-20 lg:pb-0` to avoid overlap.
9. **Floating Action Button.** Only on mobile, fixed bottom-right above bottom nav, `+` icon, links to `/identify`.
10. **Touch targets.** All interactive elements min `44x44px` on mobile (Apple/Android HIG). Buttons `py-3 lg:py-2`.
11. **Mobile typography scale.** Reduce `headline-lg` from 32px→24px, `display-lg` from 48px→32px. Use `text-2xl lg:text-3xl xl:text-4xl` pattern.
12. **Horizontal scroll containers.** For pill rows, tab rows, chart legends, metric strips on mobile: `overflow-x-auto snap-x snap-mandatory` with `snap-start` on children.
13. **Charts.** Recharts responsive by default via `ResponsiveContainer`. Reduce X-axis ticks on mobile (show every nth tick). Hide grid lines on mobile.
14. **Forms.** Inputs full-width on mobile. Two-column field groups (`grid grid-cols-2`) collapse to single column below `md:`.

### Folder structure

```
seo-agent/
├── app/
│   ├── api/                    # backend
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── diagnoses/
│   │   ├── objectives/
│   │   ├── integrations/
│   │   ├── api-keys/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   └── webhooks/n8n/
│   └── (app)/                  # authenticated frontend
│       ├── layout.tsx          # shell w/ sidebar, top bar, bottom nav, FAB
│       ├── _components/        # layout primitives
│       ├── dashboard/page.tsx
│       ├── projects/page.tsx
│       ├── identify/page.tsx
│       ├── diagnosis/[id]/page.tsx
│       ├── objective/[id]/page.tsx
│       ├── campaign/[id]/page.tsx
│       └── settings/page.tsx
├── components/
│   └── ui/                     # shared responsive primitives
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   └── migrations/
│   ├── services/
│   ├── validators/
│   ├── auth/
│   ├── n8n/
│   ├── crypto/
│   ├── ratelimit/
│   ├── errors.ts
│   └── logger.ts
├── tests/
│   ├── unit/
│   └── integration/
├── drizzle.config.ts
├── package.json
└── .env.example
```

### Environment variables (required)

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=              # HMAC, BE → n8n
APP_WEBHOOK_SECRET=              # HMAC, n8n → BE callback
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ENCRYPTION_KEY=                  # 32-byte base64, libsodium secretbox
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## SECTION 2 — Task 1: Bootstrap Project

Initialize the project with all dependencies, folder structure, base configs, and helper modules. No API routes or pages yet. Foundation only.

**Deliverables:**
1. `package.json` with exact dependencies listed in Section 1
2. `tsconfig.json` strict mode, path alias `@/*` → root
3. `next.config.js` with env validation
4. `tailwind.config.ts` with design tokens from `seo_agent_linked/dashboard.html` (extract from the embedded `tailwind.config` script — same colors, spacing, fonts)
5. `drizzle.config.ts` pointing to `lib/db/schema.ts`, dialect `postgresql`
6. Empty folder structure from Section 1
7. `lib/errors.ts`:
   - `AppError` class with `code`, `message`, `statusCode`, `details`
   - Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`, `INTEGRATION_ERROR`, `N8N_ERROR`, `QUOTA_EXCEEDED`
   - Helper `toResponse(error: unknown)` mapping to standard JSON envelope
8. `lib/logger.ts`: Pino instance with request-id binding via async local storage
9. `lib/auth/session.ts`:
   - `getUser()` returns user or null
   - `requireUser()` throws `UNAUTHORIZED` if no session
   - `requireUserWithProjectAccess(projectId)` verifies project ownership
10. `lib/crypto/secrets.ts`:
    - `encryptSecret(plaintext: string): string` — libsodium `secretbox` with `ENCRYPTION_KEY`
    - `decryptSecret(ciphertext: string): string`
11. `lib/ratelimit/index.ts`: Upstash factory, default 60 req/min per user, 10 req/min for `/api/webhooks/*`
12. `.env.example` with all variables from Section 1
13. `README.md` with setup steps

**Acceptance:**
- `pnpm install` succeeds
- `pnpm typecheck` passes with zero errors
- `pnpm dev` starts without crashing
- No API routes or pages exist yet

---

## SECTION 3 — Task 2: Database Schema

Implement the full Drizzle schema, generate migration, apply Row Level Security.

**Tables in `lib/db/schema.ts`:**

```
users (id, email, full_name, avatar_url, role, plan, timezone, created_at, updated_at)
  ← synced from Supabase auth.users

projects (id, user_id, name, website_url, industry, target_location, target_audience,
          main_product_or_service, website_stage, main_business_goal, status,
          current_step, created_at, updated_at)
  website_stage ∈ {from_scratch, new, existing}
  main_business_goal ∈ {traffic, leads, sales, awareness, local_visibility}
  status ∈ {active, archived}
  current_step ∈ 1..7
  INDEX (user_id, status), INDEX (user_id, updated_at DESC)

seo_inputs (id, project_id, step_number, sub_step, payload jsonb, is_draft,
            created_at)
  INDEX (project_id, step_number, sub_step)

seo_diagnoses (id, project_id, input_id, primary_problem_type, secondary_problem_type,
               severity, confidence_score, diagnosis_summary, root_cause, evidence jsonb,
               business_impact jsonb, campaign_readiness, recommended_next_step,
               objective_direction, not_recommended_actions jsonb, warnings jsonb,
               raw_llm_output jsonb, model_used, status, error_message,
               created_at, completed_at)
  primary_problem_type ∈ {technical_bottleneck, relevance_gap, authority_deficit,
                          conversion_pitfall, from_scratch, mixed}
  severity ∈ {low, medium, high, critical}
  confidence_score numeric(5,2) 0..100
  campaign_readiness ∈ {ready, not_ready, partially_ready}
  status ∈ {pending, processing, completed, failed}
  evidence: [{label, value, icon_hint, source}]
  business_impact: {summary, metrics: [{label, value, direction}]}
  INDEX (project_id, created_at DESC), INDEX (status)

seo_objectives (id, project_id, diagnosis_id, input_id, objective_type, smart_objective,
                business_goal_alignment, input_metrics jsonb, output_metrics jsonb,
                outcome_metrics jsonb, baseline jsonb, target jsonb, time_period,
                achievability_score, achievability_percent, risk_notes jsonb,
                reasoning, next_step, raw_llm_output, model_used, status,
                error_message, created_at, completed_at)
  objective_type ∈ {technical_recovery, qualified_traffic, authority_growth,
                    conversion_improvement, foundation_building, mixed}
  achievability_score ∈ {low, moderate, high}
  achievability_percent numeric(5,2)
  INDEX (project_id, created_at DESC), INDEX (diagnosis_id)

campaign_progress (id, project_id, step_number, status, started_at, completed_at)
  status ∈ {not_started, in_progress, completed, blocked, locked}
  UNIQUE (project_id, step_number)

tasks (id, project_id, step_number, title, description, impact, status, due_at,
       completed_at, created_at)
  impact ∈ {high, medium, low}
  status ∈ {pending, in_progress, completed, skipped}
  INDEX (project_id, status)

integrations (id, user_id, provider, status, credentials_encrypted, metadata jsonb,
              last_sync_at, created_at)
  provider ∈ {gsc, ga4, ahrefs, semrush}
  status ∈ {connected, disconnected, error}
  UNIQUE (user_id, provider)

api_keys (id, user_id, label, key_hash, key_prefix, environment, last_used_at,
          expires_at, revoked_at, created_at)
  environment ∈ {live, test}
  INDEX (user_id), INDEX (key_hash)

jobs (id, user_id, project_id, type, status, request_payload jsonb,
      response_payload jsonb, error_message, created_at, started_at, completed_at)
  type ∈ {identify_problem, define_objective}
  status ∈ {queued, processing, completed, failed}
  INDEX (project_id), INDEX (status, created_at)

usage_events (id, user_id, event_type, metadata jsonb, created_at)
  event_type ∈ {project_created, diagnosis_run, objective_generated, api_request}
  INDEX (user_id, event_type, created_at DESC)

ai_insights (id, user_id, project_id, kind, title, body, action_label, action_url,
             dismissed_at, created_at)
  kind ∈ {opportunity, anomaly, recommendation}
  INDEX (user_id, dismissed_at, created_at DESC)
```

**Row Level Security:**
- Enable RLS on every table.
- Default: rows with `user_id` visible only when `user_id = auth.uid()`.
- Rows with `project_id` but no `user_id`: visible if `EXISTS (SELECT 1 FROM projects WHERE projects.id = <table>.project_id AND projects.user_id = auth.uid())`.
- Service role bypasses RLS (used by Next.js BE).
- Enable Realtime on `seo_diagnoses`, `seo_objectives`, `jobs`, `campaign_progress`.

**Deliverables:**
1. Full `lib/db/schema.ts`
2. Generated migration `lib/db/migrations/0001_initial.sql`
3. `lib/db/policies.sql` with all RLS policies
4. `lib/db/client.ts` exports `db` (service role) and `dbAsUser(userId)` (RLS context)
5. `scripts/seed.ts` for dev seeding (1 user, 2 projects, 1 diagnosis, 1 objective)

**Acceptance:**
- `pnpm drizzle-kit generate` produces clean migration
- All tables created in Supabase
- RLS verified via SQL: anon user sees nothing, authed user sees only own rows
- Seed script runs

---

## SECTION 4 — Task 3: Auth Routes

Implement auth endpoints leveraging Supabase Auth. Backend = session validator + profile manager.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Email/password signup, creates `users` row |
| POST | `/api/auth/login` | Email/password login, returns session |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/oauth/google/start` | Begin Google OAuth |
| GET | `/api/auth/oauth/google/callback` | Handle OAuth callback |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Complete reset |

- Upsert `users` row on first login (any method)
- Validate with Zod. Email valid, password ≥ 8 chars with letter+number
- Rate-limit `/login`, `/register`, `/forgot-password`: 5 req/min per IP
- Service: `lib/services/auth.ts`

**Deliverables:** 9 routes + `lib/validators/auth.ts` + service + tests covering: register, duplicate email rejection, wrong password, `/me` requires auth, OAuth creates user row

---

## SECTION 5 — Task 4: Projects + Identify Problem Routes

Project CRUD + Identify Problem wizard flow (Step 1).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List user's projects, paginated |
| POST | `/api/projects` | Create project + 7 `campaign_progress` rows (step 1 in_progress, 2-7 locked) |
| GET | `/api/projects/:id` | Single project + current step status |
| PATCH | `/api/projects/:id` | Update metadata |
| DELETE | `/api/projects/:id` | Soft delete (status='archived') |
| GET | `/api/projects/:id/identify/draft` | Load all draft sub-step payloads |
| PUT | `/api/projects/:id/identify/step/:subStep` | Save/upsert sub-step draft (1-6) |
| POST | `/api/projects/:id/identify/submit` | Finalize → merge → write `seo_inputs` → enqueue n8n → return `{ jobId, diagnosisId, status: "queued" }` |
| GET | `/api/projects/:id/identify/status` | Polling fallback |
| GET | `/api/diagnoses` | List diagnoses across user's projects |
| GET | `/api/diagnoses/:id` | Single diagnosis |
| POST | `/api/diagnoses/:id/rerun` | Re-enqueue with same input |

**Identify sub-step Zod schemas (6 sub-steps):**
1. **Website Basics**: `website_url`, `business_name`, `industry`, `target_location`, `target_audience`, `main_product_or_service`
2. **Website Status**: `website_stage`, `is_indexed`, `monthly_organic_traffic`, `organic_traffic_trend`, `indexed_pages`, `published_pages`, `main_seo_concern`
3. **Technical SEO**: `sitemap_url`, `robots_txt`, `crawl_errors_count`, `core_web_vitals_pass`, `mobile_usability_issues`, `has_redirect_errors`, `has_4xx_5xx_errors`, `canonical_issues`, `noindex_issues`
4. **Keywords & Relevance**: `current_ranking_keywords[]`, `target_keywords[]`, `monthly_impressions`, `monthly_ctr`, `competitor_domains[]`
5. **Authority & Trust**: `domain_rating`, `referring_domains`, `backlink_count`, `competitor_dr_avg`, `brand_mentions_estimate`, `has_case_studies`, `has_author_pages`
6. **Conversion**: `current_conversion_rate`, `monthly_organic_leads`, `monthly_organic_sales`, `bounce_rate`, `avg_session_duration`, `top_landing_pages[]`, `cta_quality_self_rating`

All numeric fields optional. Use `.passthrough()` for forward compatibility.

**Submit logic (`lib/services/identify.ts`):**
1. Verify all 6 sub-step drafts exist (or just 1-2 if `website_stage='from_scratch'`)
2. Merge into composite payload
3. Insert `seo_inputs` with `is_draft=false`
4. Insert pending `seo_diagnoses` (`status='pending'`)
5. Create `jobs` row (`type='identify_problem'`)
6. Fire HMAC-signed webhook to `N8N_WEBHOOK_URL` with `{ jobId, projectId, userId, action, payload, callbackUrl }`
7. Don't wait — return `{ jobId, diagnosisId }` immediately
8. Non-2xx from n8n → mark job 'failed', diagnosis 'failed', log error

**Deliverables:** 12 routes + validators + services + `lib/n8n/client.ts` with `triggerJob(payload)` doing HMAC + tests

---

## SECTION 6 — Task 5: Define Objective Routes

Step 2 — Define Objective.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/objective/draft` | Load draft inputs |
| PUT | `/api/projects/:id/objective/inputs` | Save inputs as draft |
| POST | `/api/projects/:id/objective/generate` | Finalize → trigger n8n → return `{ jobId, objectiveId }` |
| GET | `/api/objectives/:id` | Single objective |
| POST | `/api/objectives/:id/regenerate` | Re-trigger with same input |
| GET | `/api/objectives` | List across projects |

**Generate input schema:**
```typescript
const objectiveInputSchema = z.object({
  business_goal: z.object({
    main_business_goal: z.enum(['traffic','leads','sales','revenue','awareness','local_visibility']),
    business_target_value: z.string().optional(),
    target_period: z.string().optional(),
    priority_product_or_service: z.string().optional(),
    target_market: z.string().optional(),
    average_order_value: z.number().optional()
  }),
  seo_baseline: z.object({
    current_monthly_organic_traffic: z.number().optional(),
    current_organic_conversions: z.number().optional(),
    current_impressions: z.number().optional(),
    current_ctr: z.number().optional(),
    current_ranking_keywords: z.number().optional(),
    current_indexed_pages: z.number().optional(),
    domain_authority: z.number().optional(),
    referring_domains: z.number().optional()
  }),
  constraints: z.object({
    campaign_duration: z.string(),
    budget_level: z.enum(['low','medium','high']),
    content_capacity_per_month: z.number(),
    developer_support_available: z.boolean(),
    link_building_capacity: z.enum(['low','medium','high']).optional(),
    industry_competition_level: z.enum(['low','medium','high'])
  })
});
```

**Generate logic (`lib/services/objective.ts`):**
1. Verify completed `seo_diagnoses` exists — if not, 409 `CONFLICT` "Run diagnosis first"
2. Load latest completed diagnosis
3. Auto-inject diagnosis output into n8n payload (user did NOT input it)
4. Create pending `seo_objectives` row
5. Fire HMAC webhook
6. Update `campaign_progress` step 2 → `in_progress`

**Deliverables:** 6 routes + validator + service + tests

---

## SECTION 7 — Task 6: n8n Webhook Callback Handler

n8n calls back with diagnosis/objective output. Must be secure, idempotent, and trigger FE realtime.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/n8n/diagnosis-complete` | n8n posts diagnosis result |
| POST | `/api/webhooks/n8n/objective-complete` | n8n posts objective result |
| POST | `/api/webhooks/n8n/job-failed` | n8n reports failure |

**Security:**
- Verify HMAC `X-N8N-Signature`: `HMAC-SHA256(rawBody, APP_WEBHOOK_SECRET)`, constant-time compare via `crypto.timingSafeEqual`
- Reject if header missing/invalid
- Reject if `X-N8N-Timestamp` > 5 minutes old (replay prevention)
- Rate-limit 60 req/min per IP
- Service role DB client (bypass RLS)

**Payload contract (diagnosis-complete):**
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "diagnosis_id": "uuid",
  "status": "completed",
  "result": {
    "primary_problem_type": "...",
    "secondary_problem_type": "...",
    "severity": "...",
    "confidence_score": 87.5,
    "diagnosis_summary": "...",
    "root_cause": "...",
    "evidence": [{"label":"...","value":"...","icon_hint":"...","source":"..."}],
    "business_impact": {"summary":"...","metrics":[{"label":"...","value":"...","direction":"negative"}]},
    "campaign_readiness": "ready",
    "recommended_next_step": "...",
    "objective_direction": "...",
    "not_recommended_actions": ["...","..."],
    "warnings": ["..."],
    "raw_llm_output": {...},
    "model_used": "claude-opus-4-7"
  }
}
```

**Handler logic:**
1. Verify HMAC + timestamp
2. Parse + Zod validate
3. Idempotency: if `jobs.id = job_id` already `status='completed'` → return 200 `{ok:true, alreadyProcessed:true}` (n8n retry safety)
4. Transaction: update `seo_diagnoses` with result + `status='completed'` + `completed_at`; update `jobs`; insert `usage_events` (`diagnosis_run`); update `campaign_progress` step 1 → `completed`, step 2 → `in_progress`
5. Return 200 quickly. No heavy sync work.

**Realtime:** Supabase Realtime auto-fires on table changes. FE subscribes to `seo_diagnoses` filtered by `project_id`. No extra code if Realtime enabled on the table.

**Deliverables:** 3 routes + `lib/n8n/verifier.ts` + service + tests (invalid sig 401, replay 401, valid OK, idempotent retry returns 200 no duplicate)

---

## SECTION 8 — Task 7: Integrations + API Keys + Dashboard + Tasks

**Integration routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/integrations` | List + status |
| POST | `/api/integrations/gsc/connect` | Start GSC OAuth, returns Google URL |
| GET | `/api/integrations/gsc/callback` | Handle code, store encrypted refresh_token, list properties |
| POST | `/api/integrations/gsc/select-property` | Save chosen property to metadata |
| POST | `/api/integrations/ga4/connect` | Same |
| GET | `/api/integrations/ga4/callback` | Same |
| POST | `/api/integrations/ga4/select-property` | Same |
| POST | `/api/integrations/ahrefs/connect` | Body `{apiKey}`, validate via `/account` hit, encrypt + store |
| POST | `/api/integrations/semrush/connect` | Same as Ahrefs |
| DELETE | `/api/integrations/:provider` | Disconnect, delete credentials |

**API Keys:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/api-keys` | List, masked (prefix only) |
| POST | `/api/api-keys` | Generate `sk_live_<32chars>` or `sk_test_<...>`. SHA-256 hash. Return plaintext ONCE only. |
| DELETE | `/api/api-keys/:id` | Revoke (set `revoked_at`) |

**Dashboard:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/overview` | Aggregate metrics |
| GET | `/api/dashboard/insights` | Latest 5 undismissed AI insights |
| POST | `/api/dashboard/insights/:id/dismiss` | Mark dismissed |

**Campaign + Tasks:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/campaign/overview` | Step progress, metric strip, next action |
| GET | `/api/projects/:id/tasks` | List tasks, filterable |
| POST | `/api/projects/:id/tasks` | Create |
| PATCH | `/api/tasks/:id` | Update |
| DELETE | `/api/tasks/:id` | Delete |

**Notes:**
- Encrypt all OAuth tokens + API keys before storing
- OAuth refresh: store `expires_at`, refresh proactively
- Ahrefs/SEMrush: validate key via provider's `/account` — reject `INTEGRATION_ERROR` on 401
- MVP dashboard metrics derive from `usage_events` + `seo_diagnoses` aggregates (no real GSC sync yet — Phase 2)

**Deliverables:** all routes + validators + services + `lib/integrations/google.ts` OAuth helpers + tests

---

## SECTION 9 — Task 8: API Key Authentication Middleware

Programmatic access via `Authorization: Bearer sk_live_...`.

- Helper `requireApiKeyOrUser()` in `lib/auth/session.ts`
- Precedence: cookie session first, then `Authorization: Bearer`
- API key: SHA-256 lookup → verify not revoked/expired → update `last_used_at`
- API key maps to user; RLS applies based on that user
- Variant `requireApiKey()` for programmatic-only endpoints
- Rate-limit by API key ID: 1000/hr for `sk_live_`, 100/hr for `sk_test_`

**API-key-accessible routes (read-only):**
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/diagnoses`
- `GET /api/diagnoses/:id`
- `GET /api/objectives/:id`

**Deliverables:** updated session helper + middleware + tests (valid auths, revoked rejected, expired rejected, write w/ key forbidden)

---

## SECTION 10 — Task 9: Frontend Shared Layout & Navigation

This is where the responsive frontend begins. Build the shell that wraps every authenticated page.

**Files to create:**
```
app/(app)/
├── layout.tsx                       # auth-guarded shell
└── _components/
    ├── Sidebar.tsx                  # desktop sidebar
    ├── BottomNav.tsx                # mobile bottom nav
    ├── TopBar.tsx                   # responsive top bar
    ├── MobileSidebarSheet.tsx       # slide-in sidebar for tablet
    └── FloatingActionButton.tsx     # mobile FAB
```

### `(app)/layout.tsx` — server component

Reads session, redirects if anonymous. Renders the shell:

```tsx
<div className="min-h-screen flex flex-col lg:flex-row">
  <Sidebar />                                    {/* hidden < lg, fixed left ≥ lg */}
  <div className="flex-1 flex flex-col">
    <TopBar />                                    {/* always visible */}
    <main className="flex-1 pb-20 lg:pb-0 lg:ml-60">{children}</main>
    <BottomNav />                                 {/* visible < lg only */}
  </div>
  <FloatingActionButton href="/identify" />        {/* visible < lg only */}
</div>
```

### Sidebar.tsx

- `w-60` fixed positioning at `lg:`
- `hidden lg:flex flex-col`
- 6 nav items + Profile + Help, active state via `usePathname()`
- "New Project" CTA at bottom → `/identify`
- Lucide icons: `LayoutDashboard`, `FolderKanban`, `Activity`, `Target`, `Megaphone`, `Settings`, `User`, `HelpCircle`

### MobileSidebarSheet.tsx

- shadcn `Sheet` `side="left"`, triggered by TopBar hamburger (only below `lg:`)
- Same nav items, vertically stacked, larger touch targets
- Closes on item click

### TopBar.tsx

- Sticky `top-0`, height 60px, white bg, bottom border
- Mobile (< lg): hamburger (left), search icon button (right) → full-screen overlay, notification bell
- Tablet (md to lg): no hamburger, compact search, bell + history + Export + Run Audit
- Desktop (lg+): full search, bell + history + 2 buttons

### BottomNav.tsx

- `fixed bottom-0 left-0 right-0 border-t bg-white h-16 z-40 lg:hidden`
- 5 items: Dashboard, Projects, Diagnoses, Campaigns, Settings
- Active item: indigo pill bg + filled icon
- Each item is Next.js `<Link>` with `min-h-[44px]`

### FloatingActionButton.tsx

- `fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg z-50 lg:hidden`
- Plus icon → `/identify`
- Accept `href` prop to override per page

**Acceptance:**
- 375px: only bottom nav + FAB visible, no sidebar overflow
- 768px: hamburger opens sheet, no bottom nav
- 1024px: sidebar always visible, no bottom nav, no hamburger
- Lighthouse mobile accessibility ≥ 95

---

## SECTION 11 — Task 10: Per-Page Responsive Conversion

Convert each desktop HTML page from `seo_agent_linked/` into a responsive Next.js page. Section 1 globals apply to all.

### 11.1 `app/(app)/dashboard/page.tsx`

Source: `dashboard.html`

**Desktop (xl+):** main content with 2 metric cards top-right, project table left + "New Diagnosis" CTA right (2:1), recent diagnoses 3-up, competitive velocity chart + Insights Co-pilot rail.

**Mobile (< md):**
- Aggregate Health + Active Alerts cards stack vertically, full-width
- Active Projects table → stacked cards: domain (large), industry chip, then 3 rows: Visibility / Auth Score (bar) / Trend (sparkline)
- "New Diagnosis" card collapses to a banner button
- Recent Diagnoses 3-up grid → horizontal scroll with snap
- Competitive Velocity + Insights stack vertically

**Tablet (md to xl):**
- Aggregate cards top-right but smaller
- Active Projects renders as table normally
- Recent Diagnoses → 2-up
- Bottom row stacked or 2-column

### 11.2 `app/(app)/projects/page.tsx`

Source: `projects.html`

**Desktop:** 2-col project cards + "Add New" empty card; bottom row "Audit Completion" banner + "Resource Usage" 2-col

**Mobile:** cards full-width single column. "Add New" becomes a button at top of list. Bottom row stacked.
**Tablet:** cards 2-up. Bottom row 2-up.

### 11.3 `app/(app)/identify/page.tsx`

Source: `identify.html`. **Trickiest screen.**

**Desktop:** 3-column wizard — left step indicator (vertical), center form, right contextual help.

**Mobile (< md):**
- Step indicator → horizontal dot/pill row at top showing only current step number + label ("Step 3 of 6 · Technical SEO"). Tap to expand a Sheet listing all 6 steps.
- Form spans full-width.
- Right help panel → collapsible accordion below the form, titled "Need help?", default collapsed.
- Footer (Back / Continue / Save & Exit) sticky at bottom. Back+Continue side-by-side, Save&Exit as link.

**Tablet (md to lg):**
- Step indicator → top-bar pill OR left rail with icons only (80px wide, no labels)
- Help panel hidden behind a help button → opens right-side Sheet

**Desktop (lg+):** 3-column as designed.

### 11.4 `app/(app)/diagnosis/[id]/page.tsx`

Source: `diagnosis.html`

**Desktop:** Hero card; Evidence 2x2 (left) + "Recommended Next Step" indigo card (right); Root Cause + Business Impact (left) + "Avoid These Actions" (right).

**Mobile:**
- Hero: badges stack vertically, confidence becomes horizontal bar (not circular gauge)
- Evidence 2x2 → 2x1 or 1x4 vertical
- "Recommended Next Step" moves to **first** thing after hero (most important CTA stays high in scroll)
- Root Cause → accordion (collapsed after first item)
- Business Impact full-width, metrics 2-up
- "Avoid These Actions" full-width below

**Tablet:** Hero full-width. Evidence + Next Step 2-col. Root Cause + Avoid 2-col.

### 11.5 `app/(app)/objective/[id]/page.tsx`

Source: `objective.html`

**Desktop:** Form left (50%), SMART output right (50%).

**Mobile:**
- Form first, each accordion section (Business Goal / Baseline / Constraints) full-width
- "Generate SMART Objective" sticky at bottom of form
- On generation, scroll output into view; show "View Result" anchor button at top

**Tablet:** stack vertically at `md:` and below.

**Important:** add a **diagnosis reference badge** at the top of the form: "Based on diagnosis: {problem_type} ({confidence}%)" with a link to the diagnosis page. The Stitch design omits this — add it back.

### 11.6 `app/(app)/campaign/[id]/page.tsx`

Source: `campaign.html`

**Desktop:** horizontal 7-step tracker top, 3 metric cards, tabs + chart + right rail (Recommended Next Action + AI Insights).

**Mobile:**
- Step tracker → horizontal scroll with snap, each pill `min-w-[120px]`, current step centered on initial render
- 3 metric cards → horizontal scroll with snap, each card `min-w-[280px]`
- Tabs (Overview/Tasks/Metrics/Diagnosis/Objective) → horizontal scroll, sticky below header
- Chart card height reduced to 240px
- Right rail moves below chart, full-width stacked

**Tablet:** Step tracker fits without scroll. Metric cards 3-up but smaller. Right rail below.

### 11.7 `app/(app)/settings/page.tsx`

Source: `settings.html`

**Desktop:** Profile 2-col (avatar+desc left, fields right); Integrations 4-up; API Keys table.

**Mobile:**
- Profile: avatar centered top, fields stacked single column
- Integrations 4-up → 1-up single column
- API Keys table → stacked cards (label + masked key + created + usage + revoke)

**Tablet:** Profile 2-col. Integrations 2-up. API Keys table normal.

**Acceptance for each page:**
- No horizontal scroll at 375px, 414px, 768px, 1024px, 1440px
- All interactive elements meet 44px touch target on mobile
- No critical CTA below the fold on first paint at 375px
- Tested in Chrome DevTools: iPhone SE, iPhone 14 Pro, iPad Mini, iPad Pro

---

## SECTION 12 — Task 11: Shared Responsive Primitives

Build once, reuse across pages.

### `components/ui/responsive-table.tsx`

Wraps children as `<table>` on `md:` up, list of cards below `md:`. Props: `columns: { key, label, render }[]`, `rows: any[]`.

### `components/ui/horizontal-scroll-snap.tsx`

`overflow-x-auto snap-x snap-mandatory scroll-pl-4`. Children get `snap-start shrink-0`. Used for metric strips, step trackers, tab rows.

### `components/ui/stat-card.tsx`

Metric card from dashboard / campaign. Props: `label`, `value`, `delta`, `trend` (sparkline data). Responsive font, sparkline keeps aspect ratio.

### `components/ui/page-header.tsx`

Standard page header: title (responsive size), subtitle (hidden on mobile), action buttons (collapse to icon-only on mobile).

### `components/ui/severity-badge.tsx`

Colored pill from diagnosis. Variants: low / medium / high / critical. Auto-shrinks padding on mobile.

### `components/ui/confidence-gauge.tsx`

Circular SVG gauge. `variant="bar"` prop gives horizontal bar version for mobile.

**Acceptance:**
- Each primitive has a story/demo page showing mobile + desktop variants
- Pages from Section 11 import these, no duplicate logic

---

## SECTION 13 — Task 12: Testing, Hardening, Docs

Final pass.

1. Integration tests per route: happy path + auth failure + validation failure
2. `lib/openapi.ts` generates OpenAPI 3.1 from Zod (`@asteasolutions/zod-to-openapi`)
3. `GET /api/docs` serves Swagger UI in dev only
4. `GET /api/health`: `{ ok:true, version, db: "ok"|"fail", n8n: "ok"|"fail" }`
5. Request logging middleware: method, path, status, latency, user_id, request_id
6. CORS: allow `APP_URL` only in prod, `*` in dev
7. `SECURITY.md`: HMAC + key rotation, RLS, encryption at rest, rate limits
8. `README.md`: setup, tests, deploy (Vercel + Supabase), n8n requirements

**Acceptance:**
- `pnpm test` all green
- `pnpm typecheck` zero errors
- `pnpm lint` zero warnings
- Coverage > 75% on services + routes
- `/api/docs` renders all endpoints

---

## SECTION 14 — n8n Workflow Contracts (Reference Only)

Codex does NOT build these but must respect the contract.

### Workflow 1: `identify_problem`

**Trigger:** Webhook `POST /webhook/seo-agent` with HMAC header `X-App-Signature`

**Request:**
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "action": "identify_problem",
  "payload": { ...merged sub-step data... },
  "callback_url": "https://app/api/webhooks/n8n/diagnosis-complete"
}
```

**Sync response (within 2s):** `200 {"ok":true,"received":true}`

**Async callback (after LLM):** POST to `callback_url` with diagnosis envelope (see Section 7).

### Workflow 2: `define_objective`

Same pattern, `action='define_objective'`, payload includes `diagnosis_result`, callback to `/api/webhooks/n8n/objective-complete`.

---

## SECTION 15 — Definition of Done (per task)

A task is done only when ALL of:
1. Code committed and runs locally
2. TypeScript builds zero errors
3. Lint passes
4. Tests added and green
5. Endpoints documented via JSDoc + Zod schemas
6. Error cases mapped to proper error codes (no leaked stack traces)
7. Logs at info level for key events
8. **For frontend tasks:** no horizontal scroll at 320/375/414/768/1024/1280/1440/1920px; touch targets ≥ 44x44px on mobile; tested on iOS Safari + Android Chrome (or BrowserStack)
9. Lighthouse mobile: Performance > 80, Accessibility > 95, Best Practices > 90

---

## Appendix A — Error Codes

| Code | HTTP | Use When |
|------|------|----------|
| VALIDATION_ERROR | 422 | Zod parse failed |
| UNAUTHORIZED | 401 | No session and not API key |
| FORBIDDEN | 403 | Authenticated but not owner |
| NOT_FOUND | 404 | Row not found OR not visible to user |
| CONFLICT | 409 | State mismatch (e.g., objective without diagnosis) |
| RATE_LIMITED | 429 | Rate limit hit |
| QUOTA_EXCEEDED | 402 | Plan limits exceeded |
| INTEGRATION_ERROR | 502 | Third-party API error |
| N8N_ERROR | 502 | n8n unreachable or errored |
| INTERNAL_ERROR | 500 | Catch-all, log full stack |

## Appendix B — HMAC Signing Reference

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto';

export function signPayload(body: string, secret: string, timestamp: number): string {
  const message = `${timestamp}.${body}`;
  return createHmac('sha256', secret).update(message).digest('hex');
}

export function verifySignature(
  body: string,
  signature: string,
  timestamp: number,
  secret: string,
  maxAgeSec = 300
): boolean {
  if (Math.abs(Date.now() / 1000 - timestamp) > maxAgeSec) return false;
  const expected = signPayload(body, secret, timestamp);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

## Appendix C — Tailwind Responsive Patterns

```tsx
// Sidebar (desktop) vs bottom nav (mobile)
<aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col" />
<nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 flex" />

// Main content offset
<main className="pb-20 lg:pb-0 lg:ml-60 px-4 md:px-6 lg:px-8" />

// 3-column → stacked
<div className="flex flex-col xl:flex-row gap-6">
  <aside className="xl:w-60" />
  <section className="flex-1" />
  <aside className="xl:w-80" />
</div>

// Grid 1 → 2 → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" />

// Heading responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight" />

// Horizontal scroll snap row
<div className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 lg:overflow-visible lg:mx-0 lg:px-0">
  <div className="snap-start shrink-0 w-72 lg:w-auto" />
</div>

// Touch-friendly button
<button className="min-h-[44px] px-4 py-3 lg:py-2" />

// Hide on mobile, show on desktop
<p className="hidden sm:block" />

// Show on mobile, hide on desktop
<button className="lg:hidden" />
```

---

## END OF SPEC

**Recommended execution order:**
1. Feed Section 1 to your coding agent as system/context.
2. Backend foundation: Sections 2 → 3 → 4 (Bootstrap → DB → Auth)
3. Core flow: Sections 5 → 6 → 7 (Projects+Identify → Objective → n8n callback)
4. Backend completeness: Sections 8 → 9 (Integrations/Keys → API auth)
5. Frontend: Sections 10 → 11 → 12 (Layout → Pages → Primitives)
6. Polish: Section 13 (Testing + docs)

Section 14 is for the n8n side (informational). Sections 15 + Appendices A/B/C are references.

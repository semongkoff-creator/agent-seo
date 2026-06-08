# n8n Workflow Guide

This guide matches the current SEO Agent app flow:

- Website -> n8n
- n8n -> AI analysis
- n8n -> Supabase
- Website reads results from Supabase

## Shared conventions

- Outbound trigger requests are signed by the app with `x-app-signature`.
- Use the built-in Web Crypto API in Code nodes for HMAC verification.
- The n8n trigger body includes both nested objects and flat aliases:
- `job_id`
- `project_id`
- `user_id`
- `diagnosis_id`
- `objective_id`
- `identify_drafts`
- `identify_merged`
- `diagnosis_result`
- `objective_input`

## Workflow 1: Identify Problem

This workflow must only do identification and diagnosis.
It should not create the final SMART objective.
For the V2 version, the AI result should also include:

- `technical_health_score`
- `ai_visibility_score`
- `technical_section`
- `keyword_section`
- `ai_overview_section`
- `business_impact_section`

### 1) Webhook trigger

- Path: `seo-agent/identify-problem`
- Method: `POST`
- Response mode: `Using Respond to Webhook Node`

This removes the red warning in the webhook node and keeps the response in the dedicated response node.

### 2) Code node: Verify HMAC

Verify the incoming app signature.

Use the raw request body and the `x-app-signature` header with `N8N_WEBHOOK_SECRET`.

Expected incoming fields:

- `job_id`
- `project_id`
- `diagnosis_id`
- `identify.drafts`
- `identify.merged`

### 3) AI Agent node

Use the **AI Agent** node as the analysis core.

Recommended setup:

- AI Agent root node
- OpenAI Chat Model sub-node
- at least one tool sub-node

Suggested prompt behavior:

- inspect `identify_drafts` and `identify_merged`
- if available, include enriched signals from GSC, GA4, technical errors, and AI visibility
- return a strict JSON object only
- keep the output compatible with the backend diagnosis schema

If you want deterministic helper logic, connect a small **Code Tool** as a supporting tool for the agent.

The goal is to produce the final diagnosis result.

### 4) Code node: Normalize AI Result

Convert the AI Agent output into the final Supabase payload shape.

Recommended fields:

- `job_id`
- `project_id`
- `diagnosis_id`
- `diagnosis_result`
- `supabase_diagnosis_payload`
- `supabase_job_payload`
- `supabase_usage_event_payload`

### 5) HTTP Request node: Update Diagnosis in Supabase

PATCH the diagnosis row directly in Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/seo_diagnoses?id=eq.{{$json.diagnosis_id}}`

Send headers:

- `apikey`
- `Authorization`
- `Content-Type`
- `Prefer`

Body should be the prepared `supabase_diagnosis_payload`.

### 6) HTTP Request node: Update Job in Supabase

PATCH the job row directly in Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/jobs?id=eq.{{$json.job_id}}`

Body should be the prepared `supabase_job_payload`.

### 7) HTTP Request node: Insert Usage Event

POST a usage event row to Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/usage_events`

Body should be the prepared `supabase_usage_event_payload`.

### 8) Respond OK node

Return a small success response to the original caller.

Recommended body:

```json
{
  "ok": true,
  "stored": true,
  "job_id": "={{ $json.job_id || $json.payload?.job?.id }}"
}
```

## Workflow 2: Define Objective

This workflow must only do objective planning.
It should not re-identify the problem or overwrite the diagnosis logic.
For the V2 version, the AI result should return three pillar objectives:

- `technical`
- `content_keyword`
- `business_impact`

### 1) Webhook trigger

- Path: `seo-agent/define-objective`
- Method: `POST`
- Response mode: `Using Respond to Webhook Node`

### 2) Code node: Verify HMAC

Verify `x-app-signature` with `N8N_WEBHOOK_SECRET`.

### 3) AI Agent node

Use the **AI Agent** node as the planning core.

Recommended setup:

- AI Agent root node
- OpenAI Chat Model sub-node
- at least one tool sub-node

Suggested prompt behavior:

- inspect `diagnosis_result` and `objective_input`
- include `technical_errors` when available so the technical pillar can reference real checklist items
- return a strict JSON object only
- keep the output compatible with the backend objective schema

### 4) Code node: Normalize AI Result

Convert the AI Agent output into the final Supabase payload shape.

Recommended fields:

- `job_id`
- `project_id`
- `objective_id`
- `objective_result`
- `supabase_objective_payload`
- `supabase_job_payload`
- `supabase_usage_event_payload`

### 5) HTTP Request node: Update Objective in Supabase

PATCH the objective row directly in Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/seo_objectives?id=eq.{{$json.objective_id}}`

Body should be the prepared `supabase_objective_payload`.

### 6) HTTP Request node: Update Job in Supabase

PATCH the job row directly in Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/jobs?id=eq.{{$json.job_id}}`

Body should be the prepared `supabase_job_payload`.

### 7) HTTP Request node: Insert Usage Event

POST a usage event row to Supabase.

Recommended endpoint:

- `{{$env.SUPABASE_URL}}/rest/v1/usage_events`

Body should be the prepared `supabase_usage_event_payload`.

### 8) Respond OK node

Return:

```json
{
  "ok": true,
  "stored": true,
  "job_id": "={{ $json.job_id || $json.payload?.job?.id }}"
}
```

## Why this layout works

- The app triggers n8n and does not block on the final AI result.
- n8n handles the AI orchestration.
- n8n writes the final result directly to Supabase.
- Supabase is the system of record.

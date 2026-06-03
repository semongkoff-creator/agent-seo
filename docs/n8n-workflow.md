# n8n Workflow Guide

This guide matches the current SEO Agent app flow:

- Website -> n8n
- n8n -> Website callback
- Website persists results to Supabase

## Shared conventions

- Outbound trigger requests are signed by the app with `x-app-signature`.
- Callback requests back to the app must include:
  - `x-n8n-signature`
  - `x-n8n-timestamp`
- The callback signature is computed from `timestamp.body` with `APP_WEBHOOK_SECRET`.
- The n8n trigger body includes both nested objects and flat aliases:
  - `job_id`
  - `project_id`
  - `user_id`
  - `callback_url`
  - `diagnosis_id`
  - `objective_id`
  - `identify_drafts`
  - `identify_merged`
  - `diagnosis_result`
  - `objective_input`

## Workflow 1: Identify Problem

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
- `callback_url`
- `identify.drafts`
- `identify.merged`

### 3) Business logic nodes

Use whatever processing nodes you want:

- OpenAI
- HTTP Request
- Switch
- IF
- Merge
- Set

The goal is to produce the final diagnosis result.

### 4) Code node: Sign Callback

Before sending the callback back to the app:

- create a timestamp in seconds
- compute HMAC with `APP_WEBHOOK_SECRET`
- sign `timestamp.body`

Send headers:

- `x-n8n-signature`
- `x-n8n-timestamp`

### 5) HTTP Request node: Callback to app

POST to:

- `{{$json.callback_url}}`

Use this payload shape:

```json
{
  "job_id": "{{$json.job_id}}",
  "project_id": "{{$json.project_id}}",
  "diagnosis_id": "{{$json.diagnosis_id}}",
  "status": "completed",
  "result": {
    "primary_problem_type": "qualified_traffic",
    "severity": "high"
  }
}
```

The real `result` object should contain the diagnosis output you generate in n8n.

### 6) Respond OK node

Return a small success response to the original caller.

Recommended body:

```json
{
  "ok": true,
  "received": true,
  "job_id": "={{ $json.job_id || $json.payload?.job?.id }}"
}
```

## Workflow 2: Define Objective

### 1) Webhook trigger

- Path: `seo-agent/define-objective`
- Method: `POST`
- Response mode: `Using Respond to Webhook Node`

### 2) Code node: Verify HMAC

Verify `x-app-signature` with `N8N_WEBHOOK_SECRET`.

### 3) Business logic nodes

Build the SMART objective from:

- `diagnosis_result`
- `objective_input`
- `project_id`
- `diagnosis_id`

### 4) Code node: Sign Callback

Sign the callback body with `APP_WEBHOOK_SECRET`.

### 5) HTTP Request node: Callback to app

POST to:

- `{{$json.callback_url}}`

Use this callback shape:

```json
{
  "job_id": "{{$json.job_id}}",
  "project_id": "{{$json.project_id}}",
  "objective_id": "{{$json.objective_id}}",
  "status": "completed",
  "result": {
    "objective_type": "mixed",
    "smart_objective": "Generate the final SMART objective here"
  }
}
```

### 6) Respond OK node

Return:

```json
{
  "ok": true,
  "received": true,
  "job_id": "={{ $json.job_id || $json.payload?.job?.id }}"
}
```

## Why this layout works

- The app triggers n8n and does not block on the final AI result.
- n8n can handle the entire AI orchestration.
- The callback writes the final result back to the app.
- Supabase remains the system of record.


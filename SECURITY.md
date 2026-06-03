# Security Notes

## Authentication

- Session-based routes require a user session or trusted API key bearer token where supported.
- API keys are stored hashed with SHA-256 and never returned after creation.

## Webhooks

- n8n callbacks must include `X-N8N-Signature` and `X-N8N-Timestamp`.
- Signatures are verified with HMAC-SHA256 over `timestamp.body`.
- Requests older than 5 minutes are rejected.

## Data Protection

- Sensitive provider credentials should be encrypted before storage.
- Database access should use RLS for user-owned rows.

## Operational Notes

- Rotate `APP_WEBHOOK_SECRET` and `N8N_WEBHOOK_SECRET` periodically.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

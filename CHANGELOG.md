# Changelog

## 2026-06-08

- Hardened Google sync deduplication by deleting previous GSC/GA4 metric rows before inserting fresh sync results.
- Normalized GA4 engagement rate storage/display to percentage values and corrected bounce rate derivation.
- Upgraded GSC indexed pages sync to use discovery sampling, URL Inspection fallback, and metadata-rich coverage summaries.
- Added a cleanup migration for duplicate Google metric rows in Supabase.
- Aligned Google OAuth and encryption helpers with the Kaitech Vercel env vars (`NEXT_PUBLIC_APP_URL`, `GOOGLE_OAUTH_REDIRECT_URI`, `OAUTH_STATE_SECRET`, `TOKEN_ENCRYPTION_KEY`).
- Improved Google sync project resolution so Kaitech domain matches are preferred before falling back to the latest project.
- Added Google OAuth integration for GSC and GA4 with dedicated initiate, callback, disconnect, and refresh routes.
- Added OAuth connection storage, Google property selection, and real sync endpoints for GSC and GA4.
- Added Google property cards and selector UI to the Settings page.
- Updated GSC and GA4 mock readers to prefer real synced data from `gsc_metrics` and `ga4_metrics`.
- Updated n8n workflow contracts for Phase 5, including V2 diagnosis sections and multi-pillar objective payload support.
- Added backend support for V2 diagnosis/objective webhook fields and technical error context in objective generation.
- Updated the shared n8n workflow guide to reflect the V2 diagnosis and objective orchestration flow.
- Restructured the objective detail page into 3 pillars: Technical, Content & Keyword, and Business Impact.
- Added a shared technical error hook for cross-page checklist sync between Diagnosis and Objective pages.
- Added new pillar components and helper utilities under `app/(app)/objective/[id]/pillars/`.
- Added a compact objective header with overall progress, diagnosis reference, and quick actions.
- Removed the old generic objective sections and shifted risk notes into a compact sidebar card.
- Restructured the diagnosis page into Technical Issue, Keyword Position, AI Overview, and Business Impact sections.
- Added a technical error patch endpoint for checklist status updates.
- Added mock data helpers for keyword positions, AI visibility, and keyword owning counters.
- Added diagnosis dashboard hooks for technical errors, AI metrics, GA4 metrics, GSC keywords, and keyword owning.
- Added a new diagnosis dashboard header with technical health and AI visibility scores.
- Kept the existing pending/failed diagnosis states intact while replacing the completed-state report viewer.
- Updated the Create Project modal/form to use dropdowns for industry, audience, and main goal.
- Added default target location `Indonesia`.
- Added `Other (specify)` inputs for industry, audience, and product/service.
- Reduced main goal choices to `Traffic`, `Leads`, and `Keyword Position` in the UI.
- Updated Identify wizard Step 2 to remove the manual `indexed_pages`, `published_pages`, and `main_seo_concern` fields.
- Added mock GSC and GA4 summary cards to Step 2.
- Updated Identify wizard Step 3 to use auto/manual sitemap and robots.txt controls.
- Replaced technical toggle fields with clickable technical error cards and a detail modal.
- Added mock data helpers under `lib/mocks/`.
- Added shared wizard types under `types/wizard.ts`.
- Kept backward compatibility for legacy business goal values in display and validation.

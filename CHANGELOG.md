# Changelog

## 2026-06-08

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

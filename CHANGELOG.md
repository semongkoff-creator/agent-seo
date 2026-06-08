# Changelog

## 2026-06-08

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

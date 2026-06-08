# 🚀 PHASE 1: Database Migration (SEO Agent V2)

## 🎭 PERSONA
Anda adalah **Senior Database Engineer** dengan 10 tahun pengalaman di PostgreSQL + Supabase. Fokus: data integrity, backward compatibility, dan RLS security.

## 📌 CONTEXT
Project: SEO Agent (Next.js + Supabase). Existing schema: 13 tables (projects, seo_inputs, seo_diagnoses, seo_objectives, campaign_progress, jobs, dll).

V2 pivot dari "generic SEO advisor" ke "Technical-first SEO platform dengan AI Visibility tracking". Butuh 4 tabel baru + update 2 tabel existing.

## 🎯 TASK
Buat migration SQL untuk Supabase. Tujuan:
1. Tambah 4 tabel baru
2. Update kolom existing (tidak destructive)
3. Setup RLS policies
4. Seed mock data untuk testing

## 📋 DETAIL

### Tabel Baru 1: `technical_errors`
Menyimpan error teknis SEO per project. Sync dengan checklist di Diagnosis & Objective.

```sql
CREATE TABLE technical_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  diagnosis_id UUID REFERENCES seo_diagnoses(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('screaming_frog', 'pagespeed', 'gsc', 'manual')),
  error_type TEXT NOT NULL,
  error_count INTEGER DEFAULT 0,
  affected_urls JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('open', 'in_progress', 'fixed')) DEFAULT 'open',
  fixed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_technical_errors_project ON technical_errors(project_id);
CREATE INDEX idx_technical_errors_status ON technical_errors(status);
```

### Tabel Baru 2: `ai_visibility_metrics`
Menyimpan metrics AI Overview (Geoptie integration). Differentiation feature.

```sql
CREATE TABLE ai_visibility_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  engine TEXT NOT NULL CHECK (engine IN ('gemini', 'chatgpt', 'perplexity')),
  keyword TEXT NOT NULL,
  visibility_score INTEGER CHECK (visibility_score BETWEEN 0 AND 100),
  detection_rate NUMERIC(5,2),
  top3_visibility INTEGER DEFAULT 0,
  avg_position NUMERIC(4,2),
  citation_data JSONB DEFAULT '{}'::jsonb,
  measured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_visibility_project ON ai_visibility_metrics(project_id);
CREATE INDEX idx_ai_visibility_engine ON ai_visibility_metrics(engine);
```

### Tabel Baru 3: `gsc_metrics` (mock untuk MVP)
Cache GSC data (sebelum real OAuth integration).

```sql
CREATE TABLE gsc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gsc_metrics_project ON gsc_metrics(project_id);
```

### Tabel Baru 4: `ga4_metrics` (mock untuk MVP)
Cache GA4 data.

```sql
CREATE TABLE ga4_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ga4_metrics_project ON ga4_metrics(project_id);
```

### Update Tabel `seo_diagnoses` (Non-destructive)
TAMBAH kolom baru, JANGAN hapus yang lama.

```sql
ALTER TABLE seo_diagnoses 
  ADD COLUMN IF NOT EXISTS technical_health_score INTEGER CHECK (technical_health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ai_visibility_score INTEGER CHECK (ai_visibility_score BETWEEN 0 AND 100);

-- Kolom lama tetap ada (deprecated, jangan hapus):
-- not_recommended_actions, campaign_readiness
```

### Update Tabel `seo_objectives` (Non-destructive)
TAMBAH kolom `pillar` untuk 3-pillar structure.

```sql
ALTER TABLE seo_objectives 
  ADD COLUMN IF NOT EXISTS pillar TEXT CHECK (pillar IN ('technical', 'content_keyword', 'business_impact'));

-- Kolom lama tetap ada (deprecated):
-- achievability_score, achievability_percent
```

### RLS Policies (WAJIB untuk Security)
Semua tabel baru harus pakai RLS sama seperti tabel existing.

```sql
-- technical_errors
ALTER TABLE technical_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own technical errors" ON technical_errors
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own technical errors" ON technical_errors
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Repeat pattern untuk: ai_visibility_metrics, gsc_metrics, ga4_metrics
```

### Realtime Configuration
Enable Realtime untuk `technical_errors` (karena status checklist akan di-sync real-time):

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE technical_errors;
```

### Seed Mock Data (untuk testing)
Buat seed function yang populate mock data untuk project tertentu.

```sql
-- Function untuk seed mock data per project
CREATE OR REPLACE FUNCTION seed_mock_data_for_project(p_project_id UUID)
RETURNS void AS $$
BEGIN
  -- Mock GSC data
  INSERT INTO gsc_metrics (project_id, metric_type, metric_value) VALUES
    (p_project_id, 'indexed_pages', '{"indexed": 45, "total": 60, "percentage": 75}'::jsonb),
    (p_project_id, 'impressions', '{"value": 25000, "trend_30d": "stagnant"}'::jsonb),
    (p_project_id, 'avg_ctr', '{"value": 1.5, "benchmark": 2.3}'::jsonb);
  
  -- Mock GA4 data
  INSERT INTO ga4_metrics (project_id, metric_type, metric_value) VALUES
    (p_project_id, 'session', '{"value": 2150, "trend_pct": 5.2}'::jsonb),
    (p_project_id, 'page_view', '{"value": 4800, "trend_pct": 3.1}'::jsonb),
    (p_project_id, 'engagement_rate', '{"value": 45, "benchmark": 55}'::jsonb),
    (p_project_id, 'visitor', '{"new": 1200, "returning": 300, "total": 1500}'::jsonb);
  
  -- Mock Technical Errors
  INSERT INTO technical_errors (project_id, source, error_type, error_count, severity, status, affected_urls) VALUES
    (p_project_id, 'pagespeed', 'Core Web Vitals Fail', 0, 'low', 'fixed', '[]'::jsonb),
    (p_project_id, 'screaming_frog', '4xx Errors', 12, 'high', 'open', '["/old-page-1", "/removed-feature"]'::jsonb),
    (p_project_id, 'gsc', 'Indexed Pages Gap', 15, 'medium', 'open', '[]'::jsonb),
    (p_project_id, 'screaming_frog', 'Missing Meta Description', 8, 'low', 'open', '["/blog/post-1", "/blog/post-2"]'::jsonb);
  
  -- Mock AI Visibility (Gemini + ChatGPT)
  INSERT INTO ai_visibility_metrics (project_id, engine, keyword, visibility_score, detection_rate, top3_visibility, avg_position) VALUES
    (p_project_id, 'gemini', 'custom software development indonesia', 65, 42.5, 2, 2.5),
    (p_project_id, 'gemini', 'odoo erp implementation', 80, 60.0, 3, 1.8),
    (p_project_id, 'chatgpt', 'custom software development indonesia', 45, 28.0, 1, 4.2),
    (p_project_id, 'chatgpt', 'odoo erp implementation', 70, 50.0, 2, 2.0);
END;
$$ LANGUAGE plpgsql;
```

## ✅ ACCEPTANCE CRITERIA

- [ ] 4 tabel baru tercipta dengan benar
- [ ] RLS policies aktif di semua tabel baru
- [ ] Realtime enable untuk technical_errors
- [ ] Tabel existing tidak rusak (existing data preserved)
- [ ] Seed function bisa di-run untuk project sample KaitechSEO
- [ ] Migration script bisa di-rollback (idempotent)

## 🛠️ DELIVERABLE

1. File migration SQL: `supabase/migrations/V2_pivot_technical_first.sql`
2. Verify run: `npx supabase db push` atau via Supabase Dashboard SQL Editor
3. Test: run `SELECT seed_mock_data_for_project('<kaitech_project_id>');` dan verify data tersimpan
4. Document changes di `CHANGELOG.md`

## ⚠️ IMPORTANT

- JANGAN delete kolom existing
- JANGAN drop tabel apapun
- Pakai `IF NOT EXISTS` untuk safety re-run
- Test di Supabase staging dulu sebelum production

Mulai!

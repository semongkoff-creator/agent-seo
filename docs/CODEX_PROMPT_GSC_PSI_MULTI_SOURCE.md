## CONTEXT SPESIFIK KAITECH

Project Kaitech:
- ID: f6682438-e267-4939-9ed8-aac730992315
- URL: https://kaitech.io/

Status saat ini:
- ✅ DataForSEO jalan (13 issues found)
- ✅ Wizard Step 3 ada 2 manual field legacy
- ✅ OAuth GSC jalan

Goal:
- Auto-populate Crawl Errors Count dari GSC
- Auto-populate Core Web Vitals dari PSI  
- Add new field Mobile Usability dari GSC
- DataForSEO integration JANGAN diganggu

Constraints:
- Max 10 URLs untuk PSI (slow, 30s per URL)
- Max 200 URLs untuk GSC URL Inspection (quota 2000/day)
- User trigger manual sync (no auto)

# 🚀 PROMPT: Multi-Source Technical Audit — GSC Enhancement + PageSpeed Insights

## 🎭 PERSONA

Anda adalah **Senior Fullstack Engineer + Technical SEO Specialist** dengan pengalaman:
- Google Search Console API (URL Inspection, Search Analytics)
- Google PageSpeed Insights API integration
- Multi-source data aggregation patterns
- Next.js 14 App Router + TypeScript + Supabase
- Async parallel processing
- Caching strategy untuk slow APIs
- Real-time UI updates

Anda menulis kode yang **production-ready, dapat handle multiple data sources gracefully, dan honest tentang data origin**. Setiap field di UI clearly indicate source data-nya supaya user tau "data ini dari mana".

---

## 📌 CONTEXT

**Project**: SEO Agent V2 — AI-powered SEO platform.

**Status Saat Ini**:
- ✅ Wizard Fundamentals selesai (3 steps only)
- ✅ DataForSEO integration jalan (real audit data)
- ✅ Technical errors grid display real data
- ✅ Per-URL detail modal working
- ✅ GSC OAuth jalan (indexed_pages, impressions, CTR, position)
- ⏳ Field "Crawl Errors Count" masih manual input (LEGACY)
- ⏳ Field "Core Web Vitals Pass" masih toggle manual (LEGACY)
- ⏳ Field "Mobile Usability" belum ada
- ⏳ PSI integration belum ada

**Pain Point dari Docs Revisi**:

Berdasarkan docs revisi (table mapping input-source), beberapa field harus **auto-populated dari source spesifik**:

```
INPUT                              SOURCE              CURRENT STATUS
─────────────────────────────────────────────────────────────────
GSC crawl errors          →  GSC                 →  ❌ Manual input
Page indexing report      →  GSC                 →  ✅ Done
Robots.txt status         →  Website/GSC         →  ✅ Done
Sitemap status            →  GSC                 →  ✅ Done
Core Web Vitals           →  GSC/PageSpeed       →  ❌ Manual toggle
Mobile usability          →  GSC                 →  ❌ Not exists
Canonical tag status      →  Site audit          →  ✅ Done (DataForSEO)
Noindex tag presence      →  Site audit          →  ✅ Done (DataForSEO)
Redirect errors           →  Site audit          →  ✅ Done (DataForSEO)
404/5xx errors            →  Site audit          →  ✅ Done (DataForSEO)
```

**IMPORTANT**: 
- DataForSEO integration **TIDAK** boleh di-touch (sudah work)
- Tambahkan **2 sources baru**: GSC enhancement + PSI
- Pertahankan technical_errors grid yang display DataForSEO data

---

## 🎯 TASK

Build **2 new integrations** untuk auto-populate field yang masih manual:

### 1. GSC URL Inspection Enhancement
Extend existing GSC OAuth untuk extract:
- **Crawl errors** (404, soft 404, server errors)
- **Mobile usability issues**
- **Robots.txt blocked status per URL**

### 2. PageSpeed Insights (PSI) Integration
New API integration untuk extract:
- **Core Web Vitals** (LCP, CLS, INP)
- **Performance score**
- **Mobile-friendly score**
- **Accessibility score**

### 3. Update Wizard Step 3 UI
Replace manual input dengan auto-populated display:
- "Crawl Errors Count" → auto-detected dari GSC
- "Core Web Vitals" → auto-detected dari PSI
- "Mobile Usability" → NEW field, auto-detected dari GSC

### 4. Source Indicator
Setiap field show **source label** untuk transparency:
- "Source: GSC URL Inspection"
- "Source: PageSpeed Insights"
- "Source: DataForSEO Crawl"

---

## 📋 DETAIL IMPLEMENTASI

### 1. ENVIRONMENT VARIABLES

Tambah di Vercel + `.env.local`:

```bash
# Google PageSpeed Insights API
PAGESPEED_INSIGHTS_API_KEY=<get from Google Cloud Console>
PAGESPEED_INSIGHTS_RATE_LIMIT=25000  # per day, default Google limit
PAGESPEED_INSIGHTS_MAX_URLS_PER_AUDIT=10  # PSI slow, limit sample

# GSC URL Inspection Enhancement
GSC_URL_INSPECTION_MAX_URLS=200  # quota 2000/day per property, sample 200
```

**Cara dapat PSI API Key**:
1. Buka https://console.cloud.google.com
2. Pilih project `kaitech-seo-engine` (yang sama dengan OAuth GSC)
3. **APIs & Services → Library**
4. Search "PageSpeed Insights API" → **Enable**
5. **APIs & Services → Credentials**
6. **+ Create Credentials → API Key**
7. Copy API key
8. (Optional) Restrict to PageSpeed Insights API only

### 2. DATABASE SCHEMA UPDATES

#### Update Diagnosis Table

```sql
-- Add new columns untuk auto-populated data
ALTER TABLE diagnoses
  ADD COLUMN IF NOT EXISTS crawl_errors_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS core_web_vitals_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mobile_usability_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_sources_status JSONB DEFAULT '{}'::jsonb;

-- Mark legacy columns sebagai optional (kalau belum nullable)
ALTER TABLE diagnoses
  ALTER COLUMN crawl_errors_count DROP NOT NULL,
  ALTER COLUMN core_web_vitals_pass DROP NOT NULL;
```

#### New Tables untuk Sync Tracking

```sql
-- Track PSI audit per project
CREATE TABLE IF NOT EXISTS psi_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  audited_url TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('mobile', 'desktop')) DEFAULT 'mobile',
  
  -- Core Web Vitals
  lcp_value NUMERIC,
  lcp_score TEXT,  -- 'good' | 'needs_improvement' | 'poor'
  cls_value NUMERIC,
  cls_score TEXT,
  inp_value NUMERIC,
  inp_score TEXT,
  
  -- Lighthouse scores
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,
  
  -- Audits failed (jsonb array)
  audits_failed JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  raw_response JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_psi_audits_project ON psi_audits(project_id);
CREATE INDEX idx_psi_audits_fetched ON psi_audits(fetched_at DESC);

ALTER TABLE psi_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own PSI audits" ON psi_audits
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE psi_audits;
```

```sql
-- Track GSC enhancement data per project
CREATE TABLE IF NOT EXISTS gsc_inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Aggregated metrics
  total_urls_inspected INTEGER DEFAULT 0,
  crawl_errors_total INTEGER DEFAULT 0,
  crawl_errors_breakdown JSONB DEFAULT '{}'::jsonb,
  
  mobile_usability_issues_total INTEGER DEFAULT 0,
  mobile_usability_breakdown JSONB DEFAULT '{}'::jsonb,
  
  robots_blocked_count INTEGER DEFAULT 0,
  
  -- Per-URL detail (sample)
  affected_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  inspected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gsc_inspection_project ON gsc_inspection_results(project_id);

ALTER TABLE gsc_inspection_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own GSC inspection" ON gsc_inspection_results
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE gsc_inspection_results;
```

### 3. FILE STRUCTURE

```
app/
├── api/
│   ├── psi/
│   │   ├── run/route.ts                    # POST: Run PSI audit
│   │   └── status/[projectId]/route.ts     # GET: Latest PSI data
│   └── gsc/
│       └── inspect-batch/route.ts          # POST: Batch URL inspection
│
└── projects/[id]/
    └── components/
        ├── WizardStep3.tsx                 # UPDATED
        ├── CrawlErrorsCard.tsx             # NEW
        ├── CoreWebVitalsCard.tsx           # NEW
        └── MobileUsabilityCard.tsx         # NEW

lib/
├── psi/
│   ├── client.ts                           # PSI API client
│   ├── parser.ts                           # Parse Lighthouse response
│   └── types.ts
└── gsc/
    └── inspection-extractor.ts             # Extract errors dari URL Inspection
```

### 4. PAGESPEED INSIGHTS CLIENT

#### File: `lib/psi/client.ts`

```typescript
const PSI_BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export type PSIStrategy = 'mobile' | 'desktop';
export type PSICategory = 'PERFORMANCE' | 'ACCESSIBILITY' | 'BEST_PRACTICES' | 'SEO';

interface PSIResult {
  url: string;
  strategy: PSIStrategy;
  lcp: { value: number; score: 'good' | 'needs_improvement' | 'poor' };
  cls: { value: number; score: 'good' | 'needs_improvement' | 'poor' };
  inp: { value: number; score: 'good' | 'needs_improvement' | 'poor' };
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  audits_failed: Array<{
    id: string;
    title: string;
    score: number;
    displayValue?: string;
  }>;
  raw: any;
}

export async function runPSI(
  url: string,
  strategy: PSIStrategy = 'mobile'
): Promise<PSIResult | null> {
  const apiKey = process.env.PAGESPEED_INSIGHTS_API_KEY;
  if (!apiKey) throw new Error('PSI API key not configured');
  
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
    category: 'PERFORMANCE'
  });
  
  // Add multiple categories
  params.append('category', 'ACCESSIBILITY');
  params.append('category', 'BEST_PRACTICES');
  params.append('category', 'SEO');
  
  try {
    const response = await fetch(`${PSI_BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(60000)  // 60s timeout (PSI slow)
    });
    
    if (!response.ok) {
      console.error(`PSI API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return parsePSIResponse(data, url, strategy);
  } catch (error: any) {
    console.error('PSI fetch failed:', error.message);
    return null;
  }
}

function parsePSIResponse(data: any, url: string, strategy: PSIStrategy): PSIResult {
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse?.audits || {};
  const categories = lighthouse?.categories || {};
  
  // Extract Core Web Vitals
  const lcpRaw = audits['largest-contentful-paint']?.numericValue || 0;
  const clsRaw = audits['cumulative-layout-shift']?.numericValue || 0;
  const inpRaw = audits['interaction-to-next-paint']?.numericValue || 
                 audits['experimental-interaction-to-next-paint']?.numericValue || 0;
  
  // Score thresholds (Google official)
  const lcpScore = lcpRaw <= 2500 ? 'good' : lcpRaw <= 4000 ? 'needs_improvement' : 'poor';
  const clsScore = clsRaw <= 0.1 ? 'good' : clsRaw <= 0.25 ? 'needs_improvement' : 'poor';
  const inpScore = inpRaw <= 200 ? 'good' : inpRaw <= 500 ? 'needs_improvement' : 'poor';
  
  // Extract failed audits (score < 0.9)
  const auditsFailed = Object.entries(audits)
    .filter(([_, audit]: [string, any]) => 
      audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'notApplicable'
    )
    .map(([id, audit]: [string, any]) => ({
      id,
      title: audit.title,
      score: audit.score,
      displayValue: audit.displayValue,
      description: audit.description
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 20);  // Top 20 issues
  
  return {
    url,
    strategy,
    lcp: { value: lcpRaw, score: lcpScore },
    cls: { value: clsRaw, score: clsScore },
    inp: { value: inpRaw, score: inpScore },
    performance_score: Math.round((categories.performance?.score || 0) * 100),
    accessibility_score: Math.round((categories.accessibility?.score || 0) * 100),
    best_practices_score: Math.round((categories['best-practices']?.score || 0) * 100),
    seo_score: Math.round((categories.seo?.score || 0) * 100),
    audits_failed: auditsFailed,
    raw: data
  };
}

export async function runPSIBatch(
  urls: string[],
  strategy: PSIStrategy = 'mobile'
): Promise<(PSIResult | null)[]> {
  // PSI slow, jangan parallel banyak
  const CONCURRENCY = 2;
  const results: (PSIResult | null)[] = [];
  
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(url => runPSI(url, strategy))
    );
    results.push(...batchResults);
    
    // Rate limiting (PSI quota 25k/day, but be safe)
    if (i + CONCURRENCY < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### 5. GSC INSPECTION EXTRACTOR

#### File: `lib/gsc/inspection-extractor.ts`

```typescript
import { inspectURL } from '@/lib/gsc-client';

interface CrawlError {
  url: string;
  error_type: 'soft_404' | 'not_found' | 'server_error' | 'access_denied' | 'redirect_error';
  detail: string;
}

interface MobileIssue {
  url: string;
  issue_type: string;
  description: string;
}

interface InspectionExtractionResult {
  crawl_errors: {
    total: number;
    breakdown: Record<string, number>;
    samples: CrawlError[];
  };
  mobile_usability: {
    total: number;
    breakdown: Record<string, number>;
    samples: MobileIssue[];
  };
  robots_blocked: {
    count: number;
    urls: string[];
  };
}

export async function extractFromInspections(
  accessToken: string,
  propertyUrl: string,
  urls: string[]
): Promise<InspectionExtractionResult> {
  const result: InspectionExtractionResult = {
    crawl_errors: { total: 0, breakdown: {}, samples: [] },
    mobile_usability: { total: 0, breakdown: {}, samples: [] },
    robots_blocked: { count: 0, urls: [] }
  };
  
  // Limit URLs (quota 2000/day, sample max 200)
  const maxUrls = parseInt(process.env.GSC_URL_INSPECTION_MAX_URLS || '200');
  const urlsToInspect = urls.slice(0, maxUrls);
  
  // Batch inspect dengan controlled concurrency
  const CONCURRENCY = 5;
  for (let i = 0; i < urlsToInspect.length; i += CONCURRENCY) {
    const batch = urlsToInspect.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async url => {
        const inspection = await inspectURL(accessToken, propertyUrl, url);
        return { url, inspection };
      })
    );
    
    // Process each result
    for (const { url, inspection } of batchResults) {
      if (!inspection) continue;
      
      const indexResult = inspection.indexStatusResult || {};
      
      // Crawl errors
      const pageFetchState = indexResult.pageFetchState;
      if (pageFetchState && pageFetchState !== 'SUCCESSFUL') {
        let errorType: CrawlError['error_type'] = 'server_error';
        if (pageFetchState === 'SOFT_404') errorType = 'soft_404';
        else if (pageFetchState === 'NOT_FOUND') errorType = 'not_found';
        else if (pageFetchState === 'ACCESS_DENIED') errorType = 'access_denied';
        else if (pageFetchState === 'REDIRECT_ERROR') errorType = 'redirect_error';
        
        result.crawl_errors.total++;
        result.crawl_errors.breakdown[errorType] = 
          (result.crawl_errors.breakdown[errorType] || 0) + 1;
        
        if (result.crawl_errors.samples.length < 50) {
          result.crawl_errors.samples.push({
            url,
            error_type: errorType,
            detail: `Page fetch state: ${pageFetchState}`
          });
        }
      }
      
      // Robots.txt blocked
      const robotsState = indexResult.robotsTxtState;
      if (robotsState === 'DISALLOWED') {
        result.robots_blocked.count++;
        if (result.robots_blocked.urls.length < 50) {
          result.robots_blocked.urls.push(url);
        }
      }
      
      // Mobile usability
      const mobileResult = inspection.mobileUsabilityResult || {};
      const mobileIssues = mobileResult.issues || [];
      if (mobileIssues.length > 0) {
        result.mobile_usability.total += mobileIssues.length;
        
        for (const issue of mobileIssues) {
          const issueType = issue.issueType || 'UNKNOWN_ISSUE';
          result.mobile_usability.breakdown[issueType] = 
            (result.mobile_usability.breakdown[issueType] || 0) + 1;
          
          if (result.mobile_usability.samples.length < 50) {
            result.mobile_usability.samples.push({
              url,
              issue_type: issueType,
              description: issue.message || issue.issueType
            });
          }
        }
      }
    }
    
    // Rate limiting between batches
    if (i + CONCURRENCY < urlsToInspect.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return result;
}
```

### 6. API ENDPOINTS

#### A. Run PSI Audit (`POST /api/psi/run`)

```typescript
// app/api/psi/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { runPSIBatch } from '@/lib/psi/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { project_id } = await req.json();
  
  const { data: project } = await supabase
    .from('projects')
    .select('id, website_url, user_id')
    .eq('id', project_id)
    .single();
  
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (project.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  // Get top URLs to audit (limit sample karena PSI slow)
  const maxUrls = parseInt(process.env.PAGESPEED_INSIGHTS_MAX_URLS_PER_AUDIT || '10');
  
  // Try to get from GSC discovered URLs (URLs dengan impressions)
  // Fallback to homepage only
  let urlsToAudit: string[] = [project.website_url];
  
  try {
    const { data: gscMetrics } = await supabase
      .from('gsc_metrics')
      .select('metric_value')
      .eq('project_id', project_id)
      .eq('metric_type', 'keyword_position')
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();
    
    const keywords = gscMetrics?.metric_value?.keywords || [];
    const topUrls = keywords
      .slice(0, maxUrls - 1)
      .map((k: any) => k.url)
      .filter((u: string) => u && u.startsWith('http'));
    
    if (topUrls.length > 0) {
      urlsToAudit = [project.website_url, ...topUrls].slice(0, maxUrls);
    }
  } catch (error) {
    console.error('Failed to get top URLs:', error);
  }
  
  // Run PSI for both mobile and desktop (for homepage only)
  // Other URLs: mobile only (save quota)
  try {
    const results = await runPSIBatch(urlsToAudit, 'mobile');
    
    // Save to psi_audits table
    const recordsToInsert = results
      .filter(r => r !== null)
      .map(r => ({
        project_id,
        user_id: user.id,
        audited_url: r!.url,
        strategy: r!.strategy,
        lcp_value: r!.lcp.value,
        lcp_score: r!.lcp.score,
        cls_value: r!.cls.value,
        cls_score: r!.cls.score,
        inp_value: r!.inp.value,
        inp_score: r!.inp.score,
        performance_score: r!.performance_score,
        accessibility_score: r!.accessibility_score,
        best_practices_score: r!.best_practices_score,
        seo_score: r!.seo_score,
        audits_failed: r!.audits_failed,
        raw_response: r!.raw
      }));
    
    // Delete old PSI data untuk project ini
    await supabase
      .from('psi_audits')
      .delete()
      .eq('project_id', project_id);
    
    // Insert new
    if (recordsToInsert.length > 0) {
      await supabase.from('psi_audits').insert(recordsToInsert);
    }
    
    // Calculate summary
    const validResults = results.filter(r => r !== null) as any[];
    const avgLCP = validResults.reduce((s, r) => s + r.lcp.value, 0) / validResults.length;
    const avgCLS = validResults.reduce((s, r) => s + r.cls.value, 0) / validResults.length;
    const avgINP = validResults.reduce((s, r) => s + r.inp.value, 0) / validResults.length;
    const avgPerf = validResults.reduce((s, r) => s + r.performance_score, 0) / validResults.length;
    
    return NextResponse.json({
      success: true,
      summary: {
        urls_audited: validResults.length,
        avg_lcp: avgLCP,
        avg_cls: avgCLS,
        avg_inp: avgINP,
        avg_performance: avgPerf,
        overall_pass: avgLCP <= 2500 && avgCLS <= 0.1 && avgINP <= 200
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### B. Get Latest PSI Data (`GET /api/psi/status/[projectId]`)

```typescript
// app/api/psi/status/[projectId]/route.ts
export async function GET(
  req: NextRequest, 
  { params }: { params: { projectId: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: audits } = await supabase
    .from('psi_audits')
    .select('*')
    .eq('project_id', params.projectId)
    .order('fetched_at', { ascending: false });
  
  if (!audits || audits.length === 0) {
    return NextResponse.json({ data: null, message: 'No PSI audits yet' });
  }
  
  // Aggregate
  const avgLCP = audits.reduce((s, a) => s + (a.lcp_value || 0), 0) / audits.length;
  const avgCLS = audits.reduce((s, a) => s + (a.cls_value || 0), 0) / audits.length;
  const avgINP = audits.reduce((s, a) => s + (a.inp_value || 0), 0) / audits.length;
  
  return NextResponse.json({
    data: {
      urls_audited: audits.length,
      lcp: { 
        value: avgLCP, 
        score: avgLCP <= 2500 ? 'good' : avgLCP <= 4000 ? 'needs_improvement' : 'poor' 
      },
      cls: { 
        value: avgCLS, 
        score: avgCLS <= 0.1 ? 'good' : avgCLS <= 0.25 ? 'needs_improvement' : 'poor' 
      },
      inp: { 
        value: avgINP, 
        score: avgINP <= 200 ? 'good' : avgINP <= 500 ? 'needs_improvement' : 'poor' 
      },
      overall_pass: avgLCP <= 2500 && avgCLS <= 0.1 && avgINP <= 200,
      per_url: audits.map(a => ({
        url: a.audited_url,
        lcp: a.lcp_value,
        cls: a.cls_value,
        inp: a.inp_value,
        performance_score: a.performance_score
      })),
      last_audited: audits[0].fetched_at
    }
  });
}
```

#### C. Run GSC Batch Inspection (`POST /api/gsc/inspect-batch`)

```typescript
// app/api/gsc/inspect-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/google-oauth';
import { extractFromInspections } from '@/lib/gsc/inspection-extractor';
import { getDiscoveredURLs } from '@/lib/gsc-client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { project_id } = await req.json();
  
  // Get GSC connection
  const { data: conn } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('service', 'gsc')
    .single();
  
  if (!conn) return NextResponse.json({ error: 'GSC not connected' }, { status: 400 });
  
  const propertyUrl = conn.connected_resource?.property_url;
  const accessToken = await getValidAccessToken(user.id, 'gsc');
  
  // Get URLs to inspect (from search analytics)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const discoveredURLs = await getDiscoveredURLs(accessToken, propertyUrl, startDate, endDate);
  
  if (discoveredURLs.length === 0) {
    return NextResponse.json({ error: 'No URLs to inspect' }, { status: 400 });
  }
  
  // Extract data
  try {
    const result = await extractFromInspections(accessToken, propertyUrl, discoveredURLs);
    
    // Save to gsc_inspection_results
    await supabase
      .from('gsc_inspection_results')
      .delete()
      .eq('project_id', project_id);
    
    await supabase.from('gsc_inspection_results').insert({
      project_id,
      user_id: user.id,
      total_urls_inspected: discoveredURLs.length,
      crawl_errors_total: result.crawl_errors.total,
      crawl_errors_breakdown: result.crawl_errors.breakdown,
      mobile_usability_issues_total: result.mobile_usability.total,
      mobile_usability_breakdown: result.mobile_usability.breakdown,
      robots_blocked_count: result.robots_blocked.count,
      affected_urls: [
        ...result.crawl_errors.samples.map(s => ({ ...s, category: 'crawl_error' })),
        ...result.mobile_usability.samples.map(s => ({ ...s, category: 'mobile_issue' })),
        ...result.robots_blocked.urls.map(url => ({ url, category: 'robots_blocked' }))
      ]
    });
    
    return NextResponse.json({
      success: true,
      summary: {
        urls_inspected: discoveredURLs.length,
        crawl_errors: result.crawl_errors.total,
        mobile_issues: result.mobile_usability.total,
        robots_blocked: result.robots_blocked.count
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 7. UI COMPONENTS

#### A. Update Wizard Step 3

Replace 2 manual fields dengan auto-populated cards:

```tsx
// app/projects/[id]/identify/components/WizardStep3.tsx
'use client';
import { CrawlErrorsCard } from './CrawlErrorsCard';
import { CoreWebVitalsCard } from './CoreWebVitalsCard';
import { MobileUsabilityCard } from './MobileUsabilityCard';
import { RealAuditSection } from './RealAuditSection';
import { TechnicalErrorsGrid } from './TechnicalErrorsGrid';

export function WizardStep3({ projectId, formData }: Props) {
  return (
    <div className="space-y-6">
      {/* Sitemap & Robots (existing, auto-detected) */}
      <SitemapAndRobotsSection projectId={projectId} />
      
      {/* NEW: 3 Auto-populated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CrawlErrorsCard projectId={projectId} />
        <CoreWebVitalsCard projectId={projectId} />
        <MobileUsabilityCard projectId={projectId} />
      </div>
      
      {/* Real Audit Section (DataForSEO trigger) */}
      <RealAuditSection projectId={projectId} />
      
      {/* Technical Errors Grid (DataForSEO results) */}
      <TechnicalErrorsGrid projectId={projectId} />
      
      {/* Submit button (existing) */}
      <SubmitButton />
    </div>
  );
}
```

#### B. Crawl Errors Card

```tsx
// app/projects/[id]/identify/components/CrawlErrorsCard.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function CrawlErrorsCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [projectId]);
  
  const fetchData = async () => {
    const supabase = createClient();
    const { data: result } = await supabase
      .from('gsc_inspection_results')
      .select('*')
      .eq('project_id', projectId)
      .order('inspected_at', { ascending: false })
      .limit(1)
      .single();
    
    setData(result);
    setLoading(false);
  };
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      const resp = await fetch('/api/gsc/inspect-batch', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });
      
      if (resp.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  if (loading) {
    return <Card><CardContent>Loading...</CardContent></Card>;
  }
  
  const total = data?.crawl_errors_total || 0;
  const hasData = data !== null;
  const isHealthy = total === 0;
  
  return (
    <Card className={isHealthy ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
              Crawl Errors
            </p>
            <h3 className="text-3xl font-bold mt-1">{total}</h3>
          </div>
          {isHealthy ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-orange-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-2">No data yet</p>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync from GSC'
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Breakdown */}
            {data.crawl_errors_breakdown && Object.keys(data.crawl_errors_breakdown).length > 0 && (
              <div className="space-y-1 text-xs mb-3">
                {Object.entries(data.crawl_errors_breakdown).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Source */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                Source: GSC
              </Badge>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="text-xs text-blue-600 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 inline mr-1 ${syncing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

#### C. Core Web Vitals Card

```tsx
// app/projects/[id]/identify/components/CoreWebVitalsCard.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity } from 'lucide-react';

const SCORE_COLORS = {
  good: 'text-green-600 bg-green-100',
  needs_improvement: 'text-yellow-600 bg-yellow-100',
  poor: 'text-red-600 bg-red-100'
};

const SCORE_LABELS = {
  good: '✓ Good',
  needs_improvement: '⚠ Needs Improvement',
  poor: '✗ Poor'
};

export function CoreWebVitalsCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [projectId]);
  
  const fetchData = async () => {
    try {
      const resp = await fetch(`/api/psi/status/${projectId}`);
      const { data: result } = await resp.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch PSI:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      const resp = await fetch('/api/psi/run', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });
      
      if (resp.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  if (loading) return <Card><CardContent>Loading...</CardContent></Card>;
  
  const hasData = data !== null;
  const overallPass = hasData && data.overall_pass;
  
  return (
    <Card className={overallPass ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
            Core Web Vitals
          </p>
          <Activity className="w-5 h-5 text-muted-foreground" />
        </div>
        {hasData && (
          <Badge className={overallPass ? SCORE_COLORS.good : SCORE_COLORS.needs_improvement}>
            {overallPass ? '✓ Pass' : '⚠ Needs Work'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-2">No data yet</p>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                'Run PSI Audit'
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">~30s per URL</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium">LCP</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{(data.lcp.value / 1000).toFixed(1)}s</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${SCORE_COLORS[data.lcp.score]}`}>
                    {SCORE_LABELS[data.lcp.score]}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">CLS</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{data.cls.value.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${SCORE_COLORS[data.cls.score]}`}>
                    {SCORE_LABELS[data.cls.score]}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">INP</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{Math.round(data.inp.value)}ms</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${SCORE_COLORS[data.inp.score]}`}>
                    {SCORE_LABELS[data.inp.score]}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <Badge variant="outline" className="text-xs">
                Source: PageSpeed
              </Badge>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="text-xs text-blue-600 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 inline mr-1 ${syncing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {data.urls_audited} URL{data.urls_audited > 1 ? 's' : ''} audited
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

#### D. Mobile Usability Card

```tsx
// app/projects/[id]/identify/components/MobileUsabilityCard.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function MobileUsabilityCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [projectId]);
  
  const fetchData = async () => {
    const supabase = createClient();
    const { data: result } = await supabase
      .from('gsc_inspection_results')
      .select('*')
      .eq('project_id', projectId)
      .order('inspected_at', { ascending: false })
      .limit(1)
      .single();
    
    setData(result);
    setLoading(false);
  };
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      const resp = await fetch('/api/gsc/inspect-batch', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });
      
      if (resp.ok) await fetchData();
    } finally {
      setSyncing(false);
    }
  };
  
  if (loading) return <Card><CardContent>Loading...</CardContent></Card>;
  
  const total = data?.mobile_usability_issues_total || 0;
  const hasData = data !== null;
  const isHealthy = total === 0;
  
  return (
    <Card className={isHealthy ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
              Mobile Usability
            </p>
            <h3 className="text-3xl font-bold mt-1">{total}</h3>
          </div>
          <Smartphone className="w-6 h-6 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-2">No data yet</p>
            <Button 
              onClick={handleSync}
              disabled={syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? 'Syncing...' : 'Sync from GSC'}
            </Button>
          </div>
        ) : (
          <>
            {data.mobile_usability_breakdown && Object.keys(data.mobile_usability_breakdown).length > 0 && (
              <div className="space-y-1 text-xs mb-3">
                {Object.entries(data.mobile_usability_breakdown).slice(0, 3).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex justify-between">
                    <span className="truncate">{type.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                Source: GSC
              </Badge>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="text-xs text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 8. INTEGRATION DENGAN N8N WORKFLOW

Update AI prompt di n8n untuk include data baru:

```
ANALYSIS DATA:

[Existing fields...]

NEW SOURCES:

1. GSC Crawl Errors:
   Total: {{ $json.crawl_errors_data.total }}
   Breakdown: {{ JSON.stringify($json.crawl_errors_data.breakdown) }}
   Sample affected URLs: {{ JSON.stringify($json.crawl_errors_data.samples) }}

2. Core Web Vitals (PSI):
   LCP: {{ $json.core_web_vitals_data.lcp.value }}ms ({{ $json.core_web_vitals_data.lcp.score }})
   CLS: {{ $json.core_web_vitals_data.cls.value }} ({{ $json.core_web_vitals_data.cls.score }})
   INP: {{ $json.core_web_vitals_data.inp.value }}ms ({{ $json.core_web_vitals_data.inp.score }})
   Overall: {{ $json.core_web_vitals_data.overall_pass ? 'PASS' : 'NEEDS WORK' }}

3. Mobile Usability (GSC):
   Total issues: {{ $json.mobile_usability_data.total }}
   Breakdown: {{ JSON.stringify($json.mobile_usability_data.breakdown) }}

4. Technical Errors (DataForSEO Crawl):
   {{ JSON.stringify($json.technical_errors) }}

Use ALL above sources for comprehensive technical SEO diagnosis.
Cross-reference data — kalau GSC report crawl errors tapi DataForSEO gak detect, 
investigate why. Provide actionable recommendations per source.
```

---

## ✅ ACCEPTANCE CRITERIA

### Functional
- [ ] PSI API key setup di env vars
- [ ] Database tables `psi_audits` dan `gsc_inspection_results` ter-create
- [ ] `POST /api/psi/run` working — fetch dari PSI, save ke DB
- [ ] `POST /api/gsc/inspect-batch` working — fetch dari GSC URL Inspection
- [ ] Wizard Step 3 display 3 cards (Crawl Errors, CWV, Mobile Usability)
- [ ] Card show auto-populated data dengan source label
- [ ] "Refresh" button per card untuk re-sync
- [ ] DataForSEO integration **TIDAK** terganggu (tetap jalan)
- [ ] Technical Errors grid tetap display DataForSEO data

### Data Quality
- [ ] PSI return real Core Web Vitals untuk Kaitech
- [ ] GSC inspection return real crawl errors
- [ ] Source label correct per card
- [ ] Realtime update when synced

### Backward Compatibility
- [ ] Manual fields `crawl_errors_count` dan `core_web_vitals_pass` tetap di DB (nullable)
- [ ] Existing diagnoses tetap render normal
- [ ] No breaking changes ke existing OAuth GSC

### UI/UX
- [ ] Card empty state dengan CTA "Sync"
- [ ] Loading state saat fetch
- [ ] Score color-coded (green/yellow/red)
- [ ] Source badge clearly visible
- [ ] Mobile responsive

---

## 🛠️ DELIVERABLE

1. Migration SQL: `psi_audits`, `gsc_inspection_results`, alter `diagnoses`
2. PSI client library (`lib/psi/`)
3. GSC inspection extractor (`lib/gsc/inspection-extractor.ts`)
4. 3 API endpoints (psi/run, psi/status, gsc/inspect-batch)
5. 3 UI cards (CrawlErrors, CoreWebVitals, MobileUsability)
6. Updated WizardStep3 component
7. n8n workflow update untuk new data sources
8. Env var documentation
9. E2E test dengan Kaitech

---

## 🧪 TESTING SCENARIOS

### Test 1: PSI Audit Kaitech

```
1. Buka project Kaitech → Wizard Step 3
2. Card "Core Web Vitals" → klik "Run PSI Audit"
3. Wait ~30-60 detik (depending on URLs)
4. Card update show:
   - LCP: 2.4s [Good]
   - CLS: 0.12 [Good]
   - INP: 250ms [Needs Improvement]
   - Source: PageSpeed
5. Verify Supabase:
   SELECT * FROM psi_audits WHERE project_id = 'f6682438-...';
   Expected: 10 rows (homepage + 9 top URLs)
```

### Test 2: GSC Inspection Kaitech

```
1. Card "Crawl Errors" → klik "Sync from GSC"
2. Wait ~30 detik
3. Card update show:
   - Total: 5 (atau angka real)
   - Breakdown: soft_404, not_found, etc
   - Source: GSC
4. Card "Mobile Usability" auto-update juga (data dari same sync)
5. Verify Supabase:
   SELECT * FROM gsc_inspection_results 
   WHERE project_id = 'f6682438-...';
```

### Test 3: DataForSEO Tidak Terganggu

```
1. Wizard Step 3 → scroll down
2. "Real Audit" section tetap ada
3. Click "Run Audit" → DataForSEO submit
4. Technical Errors grid tetap display DataForSEO results
5. All 3 sources coexist:
   - Crawl Errors (GSC)
   - Core Web Vitals (PSI)
   - Technical Errors Grid (DataForSEO)
```

### Test 4: Submit Diagnosis dengan Multi-Source

```
1. Setelah semua data ter-sync, klik "Generate Diagnosis"
2. n8n workflow receive 3 sources data
3. AI generate diagnosis yang reference:
   - "GSC shows 5 crawl errors..."
   - "PSI reports LCP 2.4s (good)..."
   - "DataForSEO detected 13 issues..."
4. Diagnosis comprehensive cross-referencing
```

---

## ⚠️ CRITICAL NOTES

### MUST DO

1. **DON'T BREAK DATAFORSEO**
   - DataForSEO integration JANGAN diubah
   - Technical Errors grid tetap pakai source 'dataforseo'
   - Real Audit button tetap trigger DataForSEO
   - 2 sources baru (GSC, PSI) **TAMBAHAN**, bukan replacement

2. **Source Transparency**
   - Setiap card show source label clearly
   - User tau data dari mana ("Source: GSC", "Source: PageSpeed")

3. **Quota Management**
   - PSI: 25k/day (lebih dari cukup)
   - GSC URL Inspection: 2000/day per property
   - Sample max 200 URLs untuk GSC, 10 URLs untuk PSI

4. **Empty State**
   - Card "No data yet" dengan CTA "Sync"
   - User pro-actively trigger sync (not auto)
   - Avoid auto-sync (control cost + quota)

### DO NOT

- ❌ Replace DataForSEO Technical Errors grid
- ❌ Auto-trigger PSI / GSC sync (let user click)
- ❌ Skip source label (transparency penting)
- ❌ Hardcode API key (env var)
- ❌ Exceed PSI sample (10 URLs max)

---

## 🎬 IMPLEMENTATION ORDER

**Day 1**: Environment setup
- PSI API key di Google Cloud
- Env vars di Vercel
- Database migration

**Day 2**: PSI Integration
- Client library
- API endpoints (run + status)
- Test dengan Kaitech

**Day 3**: GSC Enhancement
- Inspection extractor
- API endpoint
- Test dengan Kaitech

**Day 4**: UI Components
- CrawlErrorsCard
- CoreWebVitalsCard
- MobileUsabilityCard
- Update WizardStep3

**Day 5**: Integration & Testing
- n8n workflow update
- E2E test dengan Kaitech
- Polish & bug fixes
- Verify DataForSEO tidak terganggu

**Total**: 5 hari kerja

---

## 🎯 EXPECTED FINAL STATE

### Wizard Step 3 UI:

```
┌──────────────────────────────────────────────┐
│ Step 3: Technical Signals                    │
├──────────────────────────────────────────────┤
│ Sitemap: kaitech.io/sitemap.xml [✓]         │
│ Robots:  kaitech.io/robots.txt  [✓]         │
└──────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────────┐
│Crawl Errors │ Core Web    │ Mobile          │
│             │ Vitals      │ Usability       │
│   5         │ ⚠ Needs Work│   3             │
│             │ LCP: 2.4s ✓ │                 │
│ soft_404: 3 │ CLS: 0.12 ✓ │ Viewport: 2     │
│ not_found:2 │ INP: 350ms ⚠│ Text small: 1   │
│             │             │                 │
│ Source: GSC │ Source: PSI │ Source: GSC     │
└─────────────┴─────────────┴─────────────────┘

┌──────────────────────────────────────────────┐
│ REAL AUDIT (DataForSEO)                      │
│ [▶ Run Audit] Audit deep technical issues   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ TECHNICAL ERRORS (from DataForSEO)           │
│ 13 issues found - click for details          │
│                                              │
│ [13 Missing H1] [12 Duplicate Title] [137]   │
│ [Open]          [Open]                       │
└──────────────────────────────────────────────┘
```

### Database Final State:

```sql
-- All 3 sources stored:

psi_audits: 10 rows (per URL)
gsc_inspection_results: 1 row (aggregated)
technical_errors: 13 rows (from dataforseo)
audit_tasks: 1 row (dataforseo completed)
```

---

**Test dengan Kaitech (https://kaitech.io). Expected: 3 sources data muncul di UI Step 3, semua auto-populated dari real Google APIs + DataForSEO. Submit diagnosis akan consume 4 data sources (Sitemap/Robots, GSC Inspection, PSI, DataForSEO). DataForSEO integration TIDAK boleh terganggu.**

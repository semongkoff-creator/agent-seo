## CONTEXT SPESIFIK KAITECH

Project Kaitech: 
- ID: f6682438-e267-4939-9ed8-aac730992315
- URL: https://kaitech.io/
- Test pages: ~370 pages

DataForSEO sudah ready:
- Env vars set di Vercel ✅
- Credentials tested (Task Created sukses)
- Saldo cukup ($5+)

Wizard Fundamentals udah selesai (Codex Week 1):
- Wizard 3 steps only
- Submit di Step 3
- n8n workflow updated

Goal Week 2:
- Real audit data Kaitech replace hardcoded mock
- Click card → modal show affected URLs
- "How to Fix" tab tersedia
- Demo ready dalam 5 hari

# 🚀 PROMPT: DataForSEO Integration + Per-URL Detail Modal (ENHANCED)

## 🎭 PERSONA

Anda adalah **Senior Fullstack Engineer + Technical SEO Specialist** dengan pengalaman:
- Integrasi REST API komersial (DataForSEO, Ahrefs, SEMrush)
- Async task processing dengan polling pattern
- UI/UX untuk data-heavy applications (drill-down, modals, tables)
- Next.js 14 App Router + TypeScript + Supabase
- Real-time updates via Supabase Realtime
- Error handling dengan graceful degradation
- Cost-aware development (per-request pricing)

Anda menulis kode yang **production-ready, drill-down friendly, dan transparent soal cost**. Anda paham bahwa user butuh **actionable insight** — bukan cuma angka aggregate, tapi spesifik mana URL yang bermasalah dan cara fix-nya.

---

## 📌 CONTEXT

**Project**: SEO Agent V2 — AI-powered SEO platform.

**Tech Stack**:
- Frontend: Next.js 14 App Router (TypeScript) di Vercel
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL + Realtime
- UI: shadcn/ui + Tailwind CSS

**Status Saat Ini**:
- ✅ Wizard Fundamentals selesai (3 steps only)
- ✅ Database table `technical_errors` ready
- ✅ Wizard Step 3 atau Diagnosis page menampilkan technical errors
- ✅ DataForSEO account aktif (saldo cukup, API password siap)
- ✅ Env vars sudah di-set di Vercel:
  - `DATAFORSEO_LOGIN=hellobotkilat@gmail.com`
  - `DATAFORSEO_API_PASSWORD=<api-password>`
  - `DATAFORSEO_MAX_PAGES_PER_AUDIT=500`
  - `DATAFORSEO_MONTHLY_BUDGET_USD=50`
- ⏳ FE masih hardcoded mock data untuk technical errors

**Test Manual yang Sudah Sukses**:
```bash
POST https://api.dataforseo.com/v3/on_page/task_post
Body: [{ "target": "kaitech.io", "max_crawl_pages": 50 }]

Response:
{
  "tasks": [{
    "id": "06090724-1866-0216-0000-74d977e7701b",
    "status_message": "Task Created.",
    "cost": 0.00625
  }]
}
```

**Pain Point**:
- Frontend masih display data hardcoded (bukan real)
- User belum bisa trigger real audit dari UI
- User butuh **drill-down per error** untuk tau URL mana yang bermasalah
- Belum ada "How to Fix" guidance

---

## 🎯 TASK

Build **complete DataForSEO integration** dengan **interactive drill-down**:

### Core Flow:
1. User klik **"Run Audit"** di Diagnosis page atau Wizard Step 3
2. Backend submit task ke DataForSEO
3. Background polling untuk cek status task
4. Saat selesai, fetch:
   - **Summary** (overview aggregated errors)
   - **Pages detail** (per-URL info)
5. Save ke `technical_errors` dengan `affected_urls` field rich
6. Display di UI: error cards
7. **Click card → Modal** dengan 2 tabs:
   - **Tab 1: Affected URLs** — list URLs dengan detail per URL
   - **Tab 2: How to Fix** — static recommendation (markdown)

### Scope:
- ✅ On-demand audit (user klik tombol)
- ✅ Polling status (30s interval)
- ✅ Real data dari DataForSEO
- ✅ Per-URL detail dengan reason
- ✅ Static "How to Fix" untuk 20+ error types
- ✅ Replace hardcoded mock data
- ✅ Cost transparency (estimated cost shown)
- ✅ Realtime updates via Supabase

---

## 📋 DETAIL IMPLEMENTASI

### 1. DATABASE SCHEMA UPDATES

#### A. Update Check Constraint untuk `source`

```sql
ALTER TABLE technical_errors 
  DROP CONSTRAINT IF EXISTS technical_errors_source_check;

ALTER TABLE technical_errors 
  ADD CONSTRAINT technical_errors_source_check 
  CHECK (source IN (
    'screaming_frog', 
    'pagespeed', 
    'gsc', 
    'manual', 
    'custom_crawler', 
    'dataforseo'
  ));
```

#### B. Update Structure `affected_urls` (Lebih Rich)

Saat ini `affected_urls` adalah `jsonb` simple array. Update jadi **array of objects** dengan detail:

```typescript
// Format baru affected_urls:
[
  {
    "url": "https://kaitech.io/old-product",
    "reason": "Page returns 404 status code",
    "status_code": 404,
    "detected_at": "2026-06-09T10:00:00Z",
    "additional_info": {
      "page_title": "Old Product Page",
      "redirect_chain": ["url1", "url2"],   // optional
      "content_type": "text/html"
    }
  }
]
```

**No migration needed** — `jsonb` flexible enough.

#### C. Buat Tabel `audit_tasks`

```sql
CREATE TABLE audit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- DataForSEO tracking
  provider TEXT NOT NULL DEFAULT 'dataforseo',
  external_task_id TEXT,
  
  -- Config
  target_url TEXT NOT NULL,
  max_crawl_pages INTEGER DEFAULT 500,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'in_progress', 'parsing', 
    'completed', 'failed', 'cancelled'
  )) DEFAULT 'queued',
  
  -- Progress
  pages_crawled INTEGER DEFAULT 0,
  pages_total INTEGER,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Results
  total_errors_found INTEGER DEFAULT 0,
  errors_by_severity JSONB DEFAULT '{}'::jsonb,
  
  -- Cost
  estimated_cost_usd NUMERIC(10,4),
  actual_cost_usd NUMERIC(10,4),
  
  -- Timing
  submitted_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  raw_summary JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_tasks_project ON audit_tasks(project_id);
CREATE INDEX idx_audit_tasks_status ON audit_tasks(status);
CREATE INDEX idx_audit_tasks_external_id ON audit_tasks(external_task_id);

ALTER TABLE audit_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own audit tasks" ON audit_tasks
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE audit_tasks;
```

---

### 2. FILE STRUCTURE

```
app/
├── api/
│   └── audits/
│       ├── run/route.ts                    # POST: Submit audit
│       ├── status/[taskId]/route.ts        # GET: Check status + auto-process
│       └── cancel/[taskId]/route.ts        # POST: Cancel audit
│
└── projects/[id]/
    └── components/
        ├── RunAuditButton.tsx              # Tombol Run Audit
        ├── AuditProgressDialog.tsx         # Modal progress
        ├── TechnicalErrorsGrid.tsx         # Grid error cards (UPDATED)
        ├── ErrorDetailModal.tsx            # ⭐ NEW: Modal detail per error
        └── HowToFixContent.tsx             # ⭐ NEW: Static recommendations

lib/
├── dataforseo/
│   ├── client.ts                           # DataForSEO API client
│   ├── parser.ts                           # Parse response → error_types
│   ├── error-mapper.ts                     # Map DataForSEO → error_type
│   ├── how-to-fix.ts                       # ⭐ NEW: Static fix guides
│   └── types.ts                            # TypeScript types

hooks/
├── useAuditTask.ts                         # Track active audit
└── useTechnicalErrors.ts                   # Fetch errors from DB
```

---

### 3. DATAFORSEO CLIENT LIBRARY

#### File: `lib/dataforseo/client.ts`

```typescript
const BASE_URL = 'https://api.dataforseo.com/v3';

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_API_PASSWORD!;
  const credentials = Buffer.from(`${login}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function submitOnPageTask(config: {
  target: string;
  max_crawl_pages: number;
  load_resources?: boolean;
  enable_javascript?: boolean;
}): Promise<{ id: string; cost: number }> {
  const response = await fetch(`${BASE_URL}/on_page/task_post`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([config])
  });
  
  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO: ${data.status_message}`);
  }
  
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20100) {
    throw new Error(`Task creation failed: ${task?.status_message}`);
  }
  
  return {
    id: task.id,
    cost: task.cost
  };
}

export async function getTasksReady(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/on_page/tasks_ready`, {
    headers: { 'Authorization': getAuthHeader() }
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  const tasks = data.tasks?.[0]?.result || [];
  return tasks.map((t: any) => t.id);
}

export async function getTaskSummary(taskId: string): Promise<any> {
  const response = await fetch(
    `${BASE_URL}/on_page/summary/${taskId}`,
    { headers: { 'Authorization': getAuthHeader() } }
  );
  
  if (!response.ok) throw new Error(`Failed to fetch summary: ${response.status}`);
  
  const data = await response.json();
  return data.tasks?.[0]?.result?.[0] || null;
}

/**
 * Fetch per-page details with errors
 * IMPORTANT: Ini source data untuk per-URL detail di modal
 */
export async function getTaskPages(
  taskId: string, 
  options?: { limit?: number; filters?: any[] }
): Promise<any[]> {
  const body = [{
    id: taskId,
    limit: options?.limit || 1000,
    ...(options?.filters && { filters: options.filters })
  }];
  
  const response = await fetch(
    `${BASE_URL}/on_page/pages/${taskId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.tasks?.[0]?.result?.[0]?.items || [];
}

/**
 * Fetch specific issue details (e.g. duplicate content, redirect chains)
 */
export async function getDuplicateContent(taskId: string): Promise<any[]> {
  const response = await fetch(
    `${BASE_URL}/on_page/duplicate_content/${taskId}`,
    { headers: { 'Authorization': getAuthHeader() } }
  );
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.tasks?.[0]?.result?.[0]?.items || [];
}

export async function getRedirectChains(taskId: string): Promise<any[]> {
  const response = await fetch(
    `${BASE_URL}/on_page/redirect_chains/${taskId}`,
    { headers: { 'Authorization': getAuthHeader() } }
  );
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.tasks?.[0]?.result?.[0]?.items || [];
}

export async function getNonIndexable(taskId: string): Promise<any[]> {
  const response = await fetch(
    `${BASE_URL}/on_page/non_indexable/${taskId}`,
    { headers: { 'Authorization': getAuthHeader() } }
  );
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.tasks?.[0]?.result?.[0]?.items || [];
}

export async function getUserBalance(): Promise<{ balance: number; spent: number }> {
  const response = await fetch(`${BASE_URL}/appendix/user_data`, {
    headers: { 'Authorization': getAuthHeader() }
  });
  
  if (!response.ok) return { balance: 0, spent: 0 };
  
  const data = await response.json();
  const money = data.tasks?.[0]?.result?.[0]?.money || {};
  return {
    balance: money.balance || 0,
    spent: money.spent || 0
  };
}
```

#### File: `lib/dataforseo/error-mapper.ts`

```typescript
interface ErrorMapping {
  error_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export const DATAFORSEO_ERROR_MAP: Record<string, ErrorMapping> = {
  // CRITICAL
  is_5xx_code: {
    error_type: 'Server Error (5xx)',
    severity: 'critical',
    description: 'Pages returning server errors'
  },
  no_title: {
    error_type: 'Missing Title Tag',
    severity: 'critical',
    description: 'Pages without title tag'
  },
  
  // HIGH
  is_4xx_code: {
    error_type: '404 Not Found',
    severity: 'high',
    description: 'Pages returning 404 errors'
  },
  broken_links: {
    error_type: 'Broken Internal Links',
    severity: 'high',
    description: 'Internal links pointing to broken pages'
  },
  duplicate_title: {
    error_type: 'Duplicate Title Tags',
    severity: 'high',
    description: 'Multiple pages with same title'
  },
  no_h1_tag: {
    error_type: 'Missing H1 Tag',
    severity: 'high',
    description: 'Pages without H1 heading'
  },
  non_indexable: {
    error_type: 'Non-Indexable Pages',
    severity: 'high',
    description: 'Pages blocked from indexing'
  },
  is_http: {
    error_type: 'HTTP (Not HTTPS)',
    severity: 'high',
    description: 'Pages served over insecure HTTP'
  },
  duplicate_content: {
    error_type: 'Duplicate Content',
    severity: 'high',
    description: 'Pages with duplicate content'
  },
  
  // MEDIUM
  no_description: {
    error_type: 'Missing Meta Description',
    severity: 'medium',
    description: 'Pages without meta description'
  },
  duplicate_description: {
    error_type: 'Duplicate Meta Descriptions',
    severity: 'medium',
    description: 'Multiple pages with same description'
  },
  broken_resources: {
    error_type: 'Broken Resources',
    severity: 'medium',
    description: 'Broken images, CSS, JS files'
  },
  is_redirect: {
    error_type: 'Redirect Chain',
    severity: 'medium',
    description: 'Pages with redirects'
  },
  no_image_alt: {
    error_type: 'Missing Image Alt Text',
    severity: 'medium',
    description: 'Images without alt attribute'
  },
  canonical: {
    error_type: 'Canonical Issues',
    severity: 'medium',
    description: 'Pages with canonical conflicts'
  },
  high_loading_time: {
    error_type: 'Slow Loading Pages',
    severity: 'medium',
    description: 'Pages with high loading time'
  },
  
  // LOW
  no_image_title: {
    error_type: 'Missing Image Title',
    severity: 'low',
    description: 'Images without title attribute'
  },
  no_favicon: {
    error_type: 'Missing Favicon',
    severity: 'low',
    description: 'No favicon set'
  },
  small_page_size: {
    error_type: 'Small Page Size',
    severity: 'low',
    description: 'Pages with small file size'
  },
  no_encoding_meta_tag: {
    error_type: 'Missing Encoding Meta Tag',
    severity: 'low',
    description: 'Pages without charset meta'
  }
};

export function mapDataForSEOErrors(checks: Record<string, number>): Array<{
  error_type: string;
  error_count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field_name: string;
}> {
  const results = [];
  
  for (const [fieldName, count] of Object.entries(checks)) {
    if (count > 0 && DATAFORSEO_ERROR_MAP[fieldName]) {
      const mapping = DATAFORSEO_ERROR_MAP[fieldName];
      results.push({
        error_type: mapping.error_type,
        error_count: count,
        severity: mapping.severity,
        field_name: fieldName
      });
    }
  }
  
  return results;
}
```

#### ⭐ File: `lib/dataforseo/how-to-fix.ts` (NEW)

Static recommendations untuk setiap error type:

```typescript
export interface HowToFixGuide {
  problem: string;
  why_matters: string;
  steps: string[];
  example?: string;
  resources?: { title: string; url: string }[];
}

export const HOW_TO_FIX_GUIDES: Record<string, HowToFixGuide> = {
  '404 Not Found': {
    problem: 'Halaman yang user akses menampilkan error 404 (page not found).',
    why_matters: 'Halaman 404 merusak user experience dan SEO. Search engine akan stop crawling kalau banyak 404, dan user akan bounce.',
    steps: [
      'Setup 301 redirect dari URL 404 ke halaman yang relevan (misal: /old-product → /new-product)',
      'Update internal links yang point ke URL 404',
      'Buat custom 404 page yang informatif dengan link ke homepage dan search',
      'Hapus URL 404 dari sitemap.xml',
      'Submit removal request via GSC > Removals (untuk URL yang gak penting)'
    ],
    example: 'Di .htaccess: RewriteRule ^old-page$ /new-page [R=301,L]',
    resources: [
      { title: 'Google: Fix 404 errors', url: 'https://developers.google.com/search/docs/crawling-indexing/http-network-errors' }
    ]
  },
  
  'Server Error (5xx)': {
    problem: 'Halaman menampilkan error 5xx (server error).',
    why_matters: 'Server error indicates masalah hosting/infrastructure. Bisa drop ranking signifikan kalau persisten.',
    steps: [
      'Cek server logs untuk identify root cause',
      'Pastikan hosting memadai (RAM, CPU)',
      'Cek timeout configuration di web server (nginx/apache)',
      'Setup monitoring (UptimeRobot, Pingdom) untuk detect early',
      'Implement caching (Cloudflare, CDN) untuk reduce server load'
    ]
  },
  
  'Broken Internal Links': {
    problem: 'Ada internal links yang point ke halaman 404 atau broken.',
    why_matters: 'Broken links merusak crawl budget Google dan user experience. Page authority terbuang.',
    steps: [
      'Identify broken links via list affected URLs',
      'Update link ke URL yang benar',
      'Atau hapus link kalau target page udah gak ada',
      'Setup automated check (link checker tool) untuk monitor future',
      'Update sitemap.xml setelah perbaikan'
    ],
    example: 'Hapus <a href="/old-page">...</a> dari menu, atau update jadi <a href="/new-page">...</a>'
  },
  
  'Missing Title Tag': {
    problem: 'Halaman gak punya tag <title> di HTML head.',
    why_matters: 'Title tag adalah salah satu SEO ranking factor terpenting. Tanpa title, Google generate title sendiri (yang biasanya buruk).',
    steps: [
      'Tambah tag <title> di setiap halaman',
      'Format: 50-60 karakter, include target keyword',
      'Unique untuk setiap halaman (no duplicates)',
      'Sertakan brand name di akhir (opsional)',
      'Pakai dynamic title untuk halaman CMS (WordPress, Next.js metadata)'
    ],
    example: '<title>Best Coffee Beans 2026 - Premium Selection | YourBrand</title>'
  },
  
  'Duplicate Title Tags': {
    problem: 'Multiple halaman punya title yang sama.',
    why_matters: 'Google bingung mana halaman yang harus di-rank. Bisa cause cannibalization.',
    steps: [
      'Identify halaman dengan duplicate title',
      'Buat title unique untuk setiap halaman',
      'Gunakan template variable untuk pages serupa (misal: /products/{name})',
      'Audit periodic untuk prevent duplicate baru',
      'Pakai meta tag <meta name="robots" content="noindex"> untuk filter pages yang duplicate by design'
    ]
  },
  
  'Missing H1 Tag': {
    problem: 'Halaman gak punya tag H1.',
    why_matters: 'H1 adalah signal kuat untuk main topic halaman. Tanpa H1, Google harder to understand content hierarchy.',
    steps: [
      'Tambah satu H1 per halaman',
      'H1 harus describe main topic halaman',
      'Include target keyword secara natural',
      'JANGAN gunakan H1 multiple kali di 1 halaman',
      'Pakai H2-H6 untuk subheadings'
    ],
    example: '<h1>Ultimate Guide to SEO in 2026</h1>'
  },
  
  'Missing Meta Description': {
    problem: 'Halaman gak punya meta description.',
    why_matters: 'Meta description muncul di search results. Tanpa itu, Google generate sendiri (biasanya kurang menarik) → CTR turun.',
    steps: [
      'Tambah meta description untuk setiap halaman',
      'Length 150-160 karakter',
      'Include target keyword dan call-to-action',
      'Unique untuk setiap halaman',
      'Engaging copywriting untuk maximize CTR'
    ],
    example: '<meta name="description" content="Discover premium SEO tools. Free trial, no credit card required.">'
  },
  
  'Duplicate Meta Descriptions': {
    problem: 'Multiple halaman punya meta description sama.',
    why_matters: 'Wasted opportunity untuk maximize CTR. Google mungkin override kalau detect duplicate.',
    steps: [
      'Audit halaman dengan duplicate descriptions',
      'Tulis unique description per halaman',
      'Pakai dynamic description untuk CMS',
      'Highlight unique value proposition per page'
    ]
  },
  
  'Redirect Chain': {
    problem: 'Halaman punya redirect chain (A → B → C).',
    why_matters: 'Redirect chain slow down page load, waste crawl budget, dan kurangi PageRank flow.',
    steps: [
      'Identify redirect chains via list affected URLs',
      'Replace chain dengan single redirect (A → C, skip B)',
      'Update internal links yang point ke URL lama',
      'Pakai 301 (permanent) untuk SEO-friendly redirect',
      'Audit redirect map periodic'
    ],
    example: 'Sebelum: /old → /middle → /new. Setelah: /old → /new (langsung)'
  },
  
  'Missing Image Alt Text': {
    problem: 'Images gak punya alt attribute.',
    why_matters: 'Alt text penting untuk accessibility (screen readers) dan SEO (image search).',
    steps: [
      'Tambah alt attribute ke semua images',
      'Describe image secara meaningful (bukan "image123")',
      'Include keyword kalau relevant',
      'Empty alt="" untuk decorative images',
      'Audit via automated tools'
    ],
    example: '<img src="coffee.jpg" alt="Premium Arabica coffee beans from Ethiopia">'
  },
  
  'Canonical Issues': {
    problem: 'Halaman punya canonical tag yang conflicting atau salah.',
    why_matters: 'Canonical tells Google halaman versi mana yang harus di-index. Salah setup = duplicate content issue.',
    steps: [
      'Identify halaman dengan canonical mismatch',
      'Setup canonical tag yang point ke URL preferred',
      'Self-referencing canonical untuk unique pages',
      'Konsisten dengan internal linking',
      'Test dengan GSC URL Inspection tool'
    ],
    example: '<link rel="canonical" href="https://example.com/preferred-url" />'
  },
  
  'Non-Indexable Pages': {
    problem: 'Halaman blocked dari indexing (noindex tag atau robots.txt).',
    why_matters: 'Kalau penting, blocking prevents Google from showing in search. Kalau gak penting, sometimes wasted crawl budget.',
    steps: [
      'Audit halaman non-indexable',
      'Decide: should be indexable atau not?',
      'Remove noindex tag untuk halaman penting',
      'Update robots.txt kalau accidentally block',
      'Verify dengan GSC > URL Inspection'
    ]
  },
  
  'HTTP (Not HTTPS)': {
    problem: 'Halaman masih pakai HTTP (insecure).',
    why_matters: 'HTTPS adalah ranking signal dan security requirement. Browser show "Not Secure" warning.',
    steps: [
      'Setup SSL certificate (Let\'s Encrypt gratis)',
      'Redirect semua HTTP → HTTPS (301)',
      'Update internal links ke HTTPS',
      'Update canonical tags ke HTTPS',
      'Update sitemap.xml ke HTTPS URLs',
      'Submit HTTPS version di GSC'
    ]
  },
  
  'Duplicate Content': {
    problem: 'Multiple halaman punya content yang duplicate atau sangat similar.',
    why_matters: 'Google bingung mana yang harus rank. Bisa cause cannibalization atau page demotion.',
    steps: [
      'Identify pages dengan duplicate content',
      'Decide: consolidate jadi 1 page atau differentiate',
      'Pakai 301 redirect kalau consolidate',
      'Pakai canonical tag untuk indicate preferred version',
      'Rewrite content untuk yang harus tetap exist'
    ]
  },
  
  'Slow Loading Pages': {
    problem: 'Halaman load lambat (>3 seconds).',
    why_matters: 'Slow load merusak UX, naikkan bounce rate, dan demote ranking. Core Web Vitals factor.',
    steps: [
      'Test dengan PageSpeed Insights',
      'Optimize images (WebP, lazy loading)',
      'Minify CSS, JS, HTML',
      'Enable caching (browser + CDN)',
      'Reduce server response time',
      'Lazy load images & iframes',
      'Eliminate render-blocking resources'
    ]
  },
  
  'Broken Resources': {
    problem: 'Resources (images, CSS, JS) yang gak bisa di-load.',
    why_matters: 'Broken resources merusak rendering dan user experience. Bisa cause layout shift.',
    steps: [
      'Identify broken resources via DevTools Network tab',
      'Update path ke resource yang benar',
      'Hapus reference kalau resource udah gak ada',
      'Setup CDN untuk reliability',
      'Monitor 404 di Network panel'
    ]
  }
};

export function getHowToFix(errorType: string): HowToFixGuide | null {
  return HOW_TO_FIX_GUIDES[errorType] || null;
}
```

---

### 4. API ENDPOINTS

#### A. Submit Audit (`POST /api/audits/run`)

```typescript
// app/api/audits/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { submitOnPageTask, getUserBalance } from '@/lib/dataforseo/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { project_id, max_pages } = await req.json();
  
  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, website_url, user_id')
    .eq('id', project_id)
    .single();
  
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (project.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  // Check existing task
  const { data: existing } = await supabase
    .from('audit_tasks')
    .select('id, status')
    .eq('project_id', project_id)
    .in('status', ['queued', 'in_progress', 'parsing'])
    .single();
  
  if (existing) {
    return NextResponse.json({ 
      error: 'Audit already in progress', 
      taskId: existing.id 
    }, { status: 409 });
  }
  
  // Validate balance
  const maxPages = Math.min(max_pages || 500, parseInt(process.env.DATAFORSEO_MAX_PAGES_PER_AUDIT || '500'));
  const estimatedCost = 0.00625 + (maxPages * 0.00075);
  
  try {
    const { balance } = await getUserBalance();
    if (balance < estimatedCost) {
      return NextResponse.json({ 
        error: `Saldo tidak cukup. Butuh $${estimatedCost.toFixed(2)}, ada $${balance.toFixed(2)}` 
      }, { status: 402 });
    }
  } catch (error) {
    console.error('Balance check failed:', error);
  }
  
  // Extract domain
  let domain = project.website_url;
  try {
    domain = new URL(project.website_url).hostname;
  } catch {}
  
  try {
    // Submit ke DataForSEO
    const task = await submitOnPageTask({
      target: domain,
      max_crawl_pages: maxPages,
      load_resources: true,
      enable_javascript: false
    });
    
    // Save
    const { data: auditTask, error: insertError } = await supabase
      .from('audit_tasks')
      .insert({
        project_id,
        user_id: user.id,
        provider: 'dataforseo',
        external_task_id: task.id,
        target_url: project.website_url,
        max_crawl_pages: maxPages,
        status: 'in_progress',
        estimated_cost_usd: estimatedCost,
        submitted_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) throw new Error('Failed to save audit task');
    
    return NextResponse.json({
      taskId: auditTask.id,
      externalTaskId: task.id,
      status: 'in_progress',
      estimatedCost,
      message: 'Audit dimulai. Status akan auto-update.',
      pollInterval: 30000
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
```

#### B. Status + Auto-Process (`GET /api/audits/status/[taskId]`)

```typescript
// app/api/audits/status/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { 
  getTasksReady, getTaskSummary, getTaskPages,
  getRedirectChains, getNonIndexable
} from '@/lib/dataforseo/client';
import { mapDataForSEOErrors, DATAFORSEO_ERROR_MAP } from '@/lib/dataforseo/error-mapper';

export async function GET(
  req: NextRequest, 
  { params }: { params: { taskId: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: task } = await supabase
    .from('audit_tasks')
    .select('*')
    .eq('id', params.taskId)
    .eq('user_id', user.id)
    .single();
  
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  
  // Cached result
  if (task.status === 'completed' || task.status === 'failed') {
    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      totalErrors: task.total_errors_found,
      errorsBySeverity: task.errors_by_severity,
      duration: task.duration_seconds,
      cost: task.actual_cost_usd
    });
  }
  
  try {
    // Check ready
    const readyIds = await getTasksReady();
    const isReady = readyIds.includes(task.external_task_id);
    
    if (!isReady) {
      return NextResponse.json({
        taskId: task.id,
        status: 'in_progress',
        message: 'Crawl in progress...',
        progressPercent: 50
      });
    }
    
    // Update to parsing
    await supabase
      .from('audit_tasks')
      .update({ status: 'parsing', updated_at: new Date().toISOString() })
      .eq('id', task.id);
    
    // Fetch summary + pages parallel
    const [summary, pages, redirectChains, nonIndexable] = await Promise.all([
      getTaskSummary(task.external_task_id),
      getTaskPages(task.external_task_id, { limit: 500 }),
      getRedirectChains(task.external_task_id),
      getNonIndexable(task.external_task_id)
    ]);
    
    if (!summary) throw new Error('Failed to fetch summary');
    
    const pageMetrics = summary.page_metrics || {};
    const checks = pageMetrics.checks || {};
    const crawlStatus = summary.crawl_status || {};
    
    // Flatten all error checks
    const flatChecks: Record<string, number> = {};
    for (const [k, v] of Object.entries(checks)) {
      if ((v as number) > 0) flatChecks[k] = v as number;
    }
    flatChecks.broken_links = pageMetrics.broken_links || 0;
    flatChecks.duplicate_title = pageMetrics.duplicate_title || 0;
    flatChecks.duplicate_description = pageMetrics.duplicate_description || 0;
    flatChecks.duplicate_content = pageMetrics.duplicate_content || 0;
    flatChecks.non_indexable = pageMetrics.non_indexable || 0;
    flatChecks.broken_resources = pageMetrics.broken_resources || 0;
    
    const mappedErrors = mapDataForSEOErrors(flatChecks);
    
    // ⭐ Build affected URLs per error type
    const affectedUrlsByType: Record<string, any[]> = {};
    
    for (const page of pages) {
      // 404
      if (page.status_code >= 400 && page.status_code < 500) {
        affectedUrlsByType['404 Not Found'] = affectedUrlsByType['404 Not Found'] || [];
        affectedUrlsByType['404 Not Found'].push({
          url: page.url,
          reason: `Status code: ${page.status_code}`,
          status_code: page.status_code,
          detected_at: new Date().toISOString()
        });
      }
      
      // 5xx
      if (page.status_code >= 500) {
        affectedUrlsByType['Server Error (5xx)'] = affectedUrlsByType['Server Error (5xx)'] || [];
        affectedUrlsByType['Server Error (5xx)'].push({
          url: page.url,
          reason: `Server error: ${page.status_code}`,
          status_code: page.status_code,
          detected_at: new Date().toISOString()
        });
      }
      
      // Missing title
      if (!page.meta?.title) {
        affectedUrlsByType['Missing Title Tag'] = affectedUrlsByType['Missing Title Tag'] || [];
        affectedUrlsByType['Missing Title Tag'].push({
          url: page.url,
          reason: 'No <title> tag found in HTML head',
          detected_at: new Date().toISOString()
        });
      }
      
      // Missing description
      if (!page.meta?.description) {
        affectedUrlsByType['Missing Meta Description'] = affectedUrlsByType['Missing Meta Description'] || [];
        affectedUrlsByType['Missing Meta Description'].push({
          url: page.url,
          reason: 'No meta description found',
          detected_at: new Date().toISOString()
        });
      }
      
      // Missing H1
      if (page.checks?.no_h1_tag) {
        affectedUrlsByType['Missing H1 Tag'] = affectedUrlsByType['Missing H1 Tag'] || [];
        affectedUrlsByType['Missing H1 Tag'].push({
          url: page.url,
          reason: 'No H1 heading found',
          detected_at: new Date().toISOString()
        });
      }
      
      // High loading time
      if (page.checks?.high_loading_time) {
        affectedUrlsByType['Slow Loading Pages'] = affectedUrlsByType['Slow Loading Pages'] || [];
        affectedUrlsByType['Slow Loading Pages'].push({
          url: page.url,
          reason: `Loading time: ${page.page_timing?.fetch_time_ms || 'high'}ms`,
          additional_info: { timing: page.page_timing },
          detected_at: new Date().toISOString()
        });
      }
      
      // HTTP not HTTPS
      if (page.checks?.is_http) {
        affectedUrlsByType['HTTP (Not HTTPS)'] = affectedUrlsByType['HTTP (Not HTTPS)'] || [];
        affectedUrlsByType['HTTP (Not HTTPS)'].push({
          url: page.url,
          reason: 'Page served over HTTP instead of HTTPS',
          detected_at: new Date().toISOString()
        });
      }
    }
    
    // Add redirect chains detail
    for (const item of redirectChains) {
      affectedUrlsByType['Redirect Chain'] = affectedUrlsByType['Redirect Chain'] || [];
      affectedUrlsByType['Redirect Chain'].push({
        url: item.url,
        reason: `Redirect chain length: ${item.chain?.length || 'multiple'}`,
        additional_info: { 
          chain: item.chain?.map((c: any) => c.url) || [],
          total_redirects: item.chain?.length || 0
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Add non-indexable detail
    for (const item of nonIndexable) {
      affectedUrlsByType['Non-Indexable Pages'] = affectedUrlsByType['Non-Indexable Pages'] || [];
      affectedUrlsByType['Non-Indexable Pages'].push({
        url: item.url,
        reason: item.reason || 'Page blocked from indexing',
        additional_info: { 
          robots_txt: item.robots_txt,
          meta_robots: item.meta_robots,
          canonical_url: item.canonical
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Delete old DataForSEO errors
    await supabase
      .from('technical_errors')
      .delete()
      .eq('project_id', task.project_id)
      .eq('source', 'dataforseo');
    
    // Insert new errors with rich affected_urls
    const errorsToInsert = mappedErrors.map(err => ({
      project_id: task.project_id,
      source: 'dataforseo',
      error_type: err.error_type,
      error_count: err.error_count,
      severity: err.severity,
      status: 'open',
      affected_urls: affectedUrlsByType[err.error_type]?.slice(0, 100) || []
    }));
    
    if (errorsToInsert.length > 0) {
      await supabase.from('technical_errors').insert(errorsToInsert);
    }
    
    // Calculate stats
    const errorsBySeverity = {
      critical: mappedErrors.filter(e => e.severity === 'critical').reduce((s, e) => s + e.error_count, 0),
      high: mappedErrors.filter(e => e.severity === 'high').reduce((s, e) => s + e.error_count, 0),
      medium: mappedErrors.filter(e => e.severity === 'medium').reduce((s, e) => s + e.error_count, 0),
      low: mappedErrors.filter(e => e.severity === 'low').reduce((s, e) => s + e.error_count, 0)
    };
    
    const totalErrors = mappedErrors.reduce((s, e) => s + e.error_count, 0);
    const duration = Math.round((Date.now() - new Date(task.started_at).getTime()) / 1000);
    
    // Update audit task
    await supabase
      .from('audit_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        pages_crawled: crawlStatus.pages_crawled || 0,
        pages_total: (crawlStatus.pages_in_queue || 0) + (crawlStatus.pages_crawled || 0),
        progress_percent: 100,
        total_errors_found: totalErrors,
        errors_by_severity: errorsBySeverity,
        raw_summary: summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    return NextResponse.json({
      taskId: task.id,
      status: 'completed',
      summary: {
        pagesCrawled: crawlStatus.pages_crawled || 0,
        totalErrors,
        errorsBySeverity,
        duration
      }
    });
    
  } catch (error: any) {
    await supabase
      .from('audit_tasks')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### C. Cancel (`POST /api/audits/cancel/[taskId]`)

```typescript
// app/api/audits/cancel/[taskId]/route.ts
export async function POST(
  req: NextRequest, 
  { params }: { params: { taskId: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  await supabase
    .from('audit_tasks')
    .update({ 
      status: 'cancelled', 
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', params.taskId)
    .eq('user_id', user.id);
  
  return NextResponse.json({ success: true });
}
```

---

### 5. UI COMPONENTS

#### A. Run Audit Button

```tsx
// app/projects/[id]/components/RunAuditButton.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuditTask } from '@/hooks/useAuditTask';
import { AuditProgressDialog } from './AuditProgressDialog';

export function RunAuditButton({ projectId }: { projectId: string }) {
  const { activeTask, refetch } = useAuditTask(projectId);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isRunning = activeTask?.status === 'queued' || 
                   activeTask?.status === 'in_progress' || 
                   activeTask?.status === 'parsing';
  
  // Polling status saat running
  useEffect(() => {
    if (!isRunning || !activeTask) return;
    
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/audits/status/${activeTask.id}`);
        const data = await resp.json();
        if (data.status === 'completed' || data.status === 'failed') {
          refetch();
        }
      } catch (err) {
        console.error('Polling failed:', err);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isRunning, activeTask, refetch]);
  
  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`audit_tasks:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_tasks',
        filter: `project_id=eq.${projectId}`
      }, () => refetch())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [projectId, refetch]);
  
  const handleRun = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch('/api/audits/run', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, max_pages: 500 })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error);
        return;
      }
      setShowDialog(true);
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={handleRun}
        disabled={submitting || isRunning}
        size="lg"
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        {isRunning ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Audit in progress...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Run Technical Audit
          </>
        )}
      </Button>
      
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      
      <AuditProgressDialog 
        open={showDialog || isRunning} 
        onClose={() => setShowDialog(false)} 
        task={activeTask} 
      />
    </>
  );
}
```

#### ⭐ B. Error Detail Modal (NEW)

```tsx
// app/projects/[id]/components/ErrorDetailModal.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { getHowToFix } from '@/lib/dataforseo/how-to-fix';

interface AffectedURL {
  url: string;
  reason: string;
  status_code?: number;
  detected_at: string;
  additional_info?: any;
}

interface TechnicalError {
  id: string;
  source: string;
  error_type: string;
  error_count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  affected_urls: AffectedURL[];
}

interface Props {
  error: TechnicalError | null;
  open: boolean;
  onClose: () => void;
}

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertCircle },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
  medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Info },
  low: { color: 'bg-green-100 text-green-700 border-green-300', icon: Info }
};

export function ErrorDetailModal({ error, open, onClose }: Props) {
  if (!error) return null;
  
  const config = severityConfig[error.severity];
  const Icon = config.icon;
  const fixGuide = getHowToFix(error.error_type);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">{error.error_type}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={config.color}>{error.severity.toUpperCase()}</Badge>
                  <Badge variant="outline">{error.source}</Badge>
                  <Badge variant="outline">{error.error_count} issues</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="urls" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urls">
              Affected URLs ({error.affected_urls?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="how-to-fix">
              <Lightbulb className="w-4 h-4 mr-2" />
              How to Fix
            </TabsTrigger>
          </TabsList>
          
          {/* TAB 1: AFFECTED URLs */}
          <TabsContent value="urls" className="flex-1 overflow-y-auto">
            {!error.affected_urls || error.affected_urls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No affected URLs available</p>
                <p className="text-sm">Errors found but URL details not stored</p>
              </div>
            ) : (
              <div className="space-y-2">
                {error.affected_urls.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                        
                        {/* Additional info */}
                        {item.additional_info && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            {item.additional_info.chain && (
                              <div>
                                <strong>Redirect chain:</strong>
                                <ol className="ml-4 list-decimal">
                                  {item.additional_info.chain.map((u: string, i: number) => (
                                    <li key={i} className="truncate">{u}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {item.additional_info.canonical_url && (
                              <div className="mt-1">
                                <strong>Canonical:</strong> {item.additional_info.canonical_url}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {item.status_code && (
                        <Badge variant="outline" className="font-mono">
                          {item.status_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* TAB 2: HOW TO FIX */}
          <TabsContent value="how-to-fix" className="flex-1 overflow-y-auto">
            {!fixGuide ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Fix guide not available for this error type</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Problem */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Apa Masalahnya?
                  </h3>
                  <p className="text-sm text-red-800">{fixGuide.problem}</p>
                </div>
                
                {/* Why it matters */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Kenapa Penting?
                  </h3>
                  <p className="text-sm text-blue-800">{fixGuide.why_matters}</p>
                </div>
                
                {/* Steps */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Langkah Memperbaiki
                  </h3>
                  <ol className="space-y-2 text-sm text-green-800">
                    {fixGuide.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                
                {/* Example */}
                {fixGuide.example && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Contoh:</h3>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                      <code>{fixGuide.example}</code>
                    </pre>
                  </div>
                )}
                
                {/* Resources */}
                {fixGuide.resources && fixGuide.resources.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-medium text-purple-900 mb-2">Referensi</h3>
                    <ul className="space-y-1 text-sm">
                      {fixGuide.resources.map((res, idx) => (
                        <li key={idx}>
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-700 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### C. Updated Technical Errors Grid

```tsx
// app/projects/[id]/components/TechnicalErrorsGrid.tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorDetailModal } from './ErrorDetailModal';
import { AlertCircle, Info } from 'lucide-react';

const severityColors = {
  critical: 'bg-red-50 border-red-300 hover:bg-red-100',
  high: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
  medium: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100',
  low: 'bg-green-50 border-green-300 hover:bg-green-100'
};

export function TechnicalErrorsGrid({ projectId }: { projectId: string }) {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<any>(null);
  
  useEffect(() => {
    const supabase = createClient();
    
    const fetchErrors = async () => {
      const { data } = await supabase
        .from('technical_errors')
        .select('*')
        .eq('project_id', projectId)
        .order('severity', { ascending: false })
        .order('error_count', { ascending: false });
      
      setErrors(data || []);
      setLoading(false);
    };
    
    fetchErrors();
    
    // Realtime
    const channel = supabase
      .channel(`technical_errors:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'technical_errors',
        filter: `project_id=eq.${projectId}`
      }, () => fetchErrors())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (errors.length === 0) {
    return (
      <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
        <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="font-medium mb-1">Belum ada audit teknis</h3>
        <p className="text-sm text-muted-foreground">
          Klik "Run Technical Audit" untuk scan website Anda
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {errors.map(error => (
          <button
            key={error.id}
            onClick={() => setSelectedError(error)}
            className={`p-4 border-2 rounded-lg text-left transition cursor-pointer ${severityColors[error.severity]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs px-2 py-1 bg-white rounded font-medium">
                {error.source}
              </span>
              <span className="text-xs px-2 py-1 bg-white rounded font-medium uppercase">
                {error.severity}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">{error.error_count}</p>
            <p className="text-sm font-medium mb-2">{error.error_type}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {error.status === 'fixed' ? '✓ Fixed' : 'Open issue'}
              </span>
              {error.affected_urls?.length > 0 && (
                <span className="text-blue-600 font-medium hover:underline">
                  {error.affected_urls.length} URLs →
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <ErrorDetailModal 
        error={selectedError}
        open={!!selectedError}
        onClose={() => setSelectedError(null)}
      />
    </>
  );
}
```

#### D. Hook: `useAuditTask`

```typescript
// hooks/useAuditTask.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuditTask(projectId: string) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchTask = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('audit_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setActiveTask(data);
    setLoading(false);
  }, [projectId]);
  
  useEffect(() => { fetchTask(); }, [fetchTask]);
  
  return { activeTask, loading, refetch: fetchTask };
}
```

---

### 6. CLEANUP: REMOVE HARDCODED DATA

WAJIB cari & hapus hardcoded errors di FE:

```bash
# Search di codebase
grep -r "Redirect chain detected" app/ lib/ components/
grep -r "Canonical mismatch" app/ lib/ components/
grep -r "Mobile usability issue" app/ lib/ components/
```

Files yang kemungkinan hardcode:
- `app/projects/[id]/identify/components/WizardStep3.tsx`
- `lib/mocks/technical-errors.ts`

**Replace dengan**: import `TechnicalErrorsGrid` component (fetch dari DB).

---

## ✅ ACCEPTANCE CRITERIA

### Functional
- [ ] User bisa klik "Run Audit" → submit ke DataForSEO
- [ ] Polling status setiap 30 detik
- [ ] Saat ready, auto-fetch summary + pages + redirect_chains + non_indexable
- [ ] Aggregate ke `technical_errors` dengan `affected_urls` rich
- [ ] Error cards clickable → buka modal
- [ ] Modal show 2 tabs: Affected URLs + How to Fix
- [ ] Affected URLs list dengan reason per URL
- [ ] How to Fix tab tampilkan static recommendations
- [ ] Empty state proper
- [ ] Loading state proper
- [ ] Realtime updates via Supabase

### How to Fix Coverage
- [ ] Minimal 15 error types ada di `HOW_TO_FIX_GUIDES`
- [ ] Setiap guide ada: problem, why_matters, steps
- [ ] Optional: example, resources

### Cleanup
- [ ] Hardcoded mock data **DIHAPUS** dari FE
- [ ] TechnicalErrorsGrid fetch dari DB
- [ ] No fallback ke hardcoded data

### UI/UX
- [ ] Severity color-coded (red, orange, yellow, green)
- [ ] Click card visual feedback (hover)
- [ ] Modal scrollable untuk long URL list
- [ ] Mobile responsive
- [ ] Loading spinners proper
- [ ] Error messages user-friendly

---

## 🛠️ DELIVERABLE

1. Migration SQL: `audit_tasks` table + constraint update
2. DataForSEO client library (`lib/dataforseo/`)
3. Error mapper (`error-mapper.ts`)
4. ⭐ How to Fix guides (`how-to-fix.ts`) — minimal 15 error types
5. 3 API endpoints: run, status, cancel
6. UI components:
   - `RunAuditButton.tsx`
   - `AuditProgressDialog.tsx`
   - `TechnicalErrorsGrid.tsx` (updated)
   - ⭐ `ErrorDetailModal.tsx` (NEW)
7. Hook `useAuditTask`
8. **Remove hardcoded mock data dari FE**
9. End-to-end testing dengan Kaitech

---

## 🧪 TESTING SCENARIOS

### Test 1: Happy Path Kaitech

```
1. Login as user Kaitech
2. Buka project Kaitech → Diagnosis page
3. Klik "Run Technical Audit"
4. Dialog muncul (progress)
5. Wait 5-15 menit (polling jalan)
6. Dialog show "Complete! 25 issues found"
7. List error cards tampil dengan real data
8. Click card "404 Not Found"
9. Modal buka, tab "Affected URLs"
10. Verify: list URLs Kaitech yang 404
11. Click tab "How to Fix"
12. Verify: static recommendation muncul
```

### Test 2: Verify Database

```sql
-- audit_tasks
SELECT id, status, total_errors_found, errors_by_severity, duration_seconds
FROM audit_tasks 
WHERE project_id = 'f6682438-...' 
ORDER BY created_at DESC LIMIT 1;

-- technical_errors with affected_urls
SELECT error_type, error_count, severity,
  jsonb_array_length(affected_urls) as urls_count,
  affected_urls->0->>'url' as first_url
FROM technical_errors 
WHERE project_id = 'f6682438-...' 
  AND source = 'dataforseo';
```

Expected:
- `audit_tasks`: 1 row status='completed'
- `technical_errors`: 10-20 rows dengan affected_urls populated

### Test 3: Modal Interaction

```
1. Setelah audit complete, click error card
2. Modal buka smooth (no layout shift)
3. Tab "Affected URLs" default active
4. Show list URLs dengan reason
5. Click URL → buka di tab baru
6. Switch ke tab "How to Fix"
7. Recommendations muncul dengan format proper
8. Click External Link icon → buka resource
9. Close modal → grid masih intact
```

### Test 4: Empty State

```
1. New user, belum pernah audit
2. Buka Diagnosis page
3. Expected: Empty state "Belum ada audit teknis"
4. Tombol "Run Technical Audit" prominent
```

### Test 5: Cleanup Verification

```
1. Cari di codebase: grep "Redirect chain detected"
2. Expected: NO RESULTS (semua hardcoded sudah dihapus)
3. Refresh wizard Step 3 / Diagnosis page
4. Expected: data dari DB (atau empty state kalau belum audit)
```

---

## ⚠️ CRITICAL NOTES

### MUST DO

1. **Implement Modal Detail dengan 2 Tabs**
   - Tab 1: Affected URLs (dari database)
   - Tab 2: How to Fix (dari static guides)

2. **Static How to Fix Guides Minimum 15 Types**
   - 404, 5xx, broken links, missing title, duplicate title
   - Missing H1, missing description, duplicate description
   - Redirect chain, canonical issues, non-indexable
   - HTTP not HTTPS, duplicate content
   - Slow loading, missing image alt
   - Broken resources

3. **Rich Affected URLs Structure**
   - URL, reason, status_code, detected_at
   - additional_info (chain, canonical, etc) where applicable

4. **REMOVE HARDCODED MOCK DATA**
   - Cari di codebase dan hapus
   - Replace dengan fetch from DB

### DO NOT

- ❌ Skip implementasi modal detail
- ❌ Pakai mock affected_urls (harus dari DataForSEO real data)
- ❌ Skip static how-to-fix guides
- ❌ Hardcode credentials
- ❌ Keep hardcoded errors di FE

---

## 🎬 IMPLEMENTATION ORDER

**Day 1**: 
- Database migration (audit_tasks)
- DataForSEO client library + error mapper
- Test client functions

**Day 2**:
- API endpoint `/api/audits/run`
- API endpoint `/api/audits/status/[taskId]`
- Test dengan Postman

**Day 3**:
- ⭐ How to Fix guides (15+ error types)
- RunAuditButton + AuditProgressDialog

**Day 4**:
- ⭐ ErrorDetailModal (2 tabs)
- Updated TechnicalErrorsGrid (clickable)
- Hook useAuditTask

**Day 5**:
- REMOVE hardcoded mock data
- End-to-end testing Kaitech
- Polish + bug fixes

**Total**: 5 hari kerja

---

## 🎯 EXPECTED FINAL STATE

### User Experience Flow:

```
1. User di Diagnosis page Kaitech
2. Lihat tombol "Run Technical Audit"
3. Klik → modal progress muncul
4. Wait 5-15 menit
5. Modal show: "25 issues found, 5 critical"
6. Close modal → grid 8 error cards muncul
7. Click card "404 Not Found" (5 issues)
8. Modal buka dengan 2 tabs:

   Tab 1: Affected URLs
   ┌─────────────────────────────────┐
   │ https://kaitech.io/old-product  │
   │ Reason: Status code 404         │
   │ [404]                           │
   │─────────────────────────────────│
   │ https://kaitech.io/removed-page │
   │ Reason: Status code 404         │
   │ [404]                           │
   │ ...                             │
   └─────────────────────────────────┘
   
   Tab 2: How to Fix
   ┌─────────────────────────────────┐
   │ ⚠️  Apa Masalahnya?              │
   │ Halaman 404 (not found)         │
   │─────────────────────────────────│
   │ ℹ️  Kenapa Penting?              │
   │ Merusak UX dan SEO              │
   │─────────────────────────────────│
   │ ✓ Langkah Memperbaiki           │
   │ 1. Setup 301 redirect           │
   │ 2. Update internal links        │
   │ 3. Buat custom 404 page         │
   │ 4. Hapus dari sitemap.xml       │
   │ 5. Submit removal di GSC        │
   └─────────────────────────────────┘
```

---

**Test dengan Kaitech (https://kaitech.io). Expected: 10-30 real errors detected dengan affected URLs lengkap. Modal detail provide actionable guidance untuk setiap error type. Replace semua hardcoded mock data dengan real data dari DataForSEO.**

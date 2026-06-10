## CONTEXT SPESIFIK KAITECH

Project ID: f6682438-e267-4939-9ed8-aac730992315
GSC Property: https://kaitech.io/
GA4 Property ID: 490322736

CURRENT BUG (yang harus fix):

Bug 1 - Indexed Pages:
- Current: 100/120 (83%)
- Real GSC: 210/371 (56.6%)
- Target: ±5% dari real

Bug 2 - Engagement Rate:
- Current: value = 0.3932 (decimal), bounce_rate = 99.6 (salah)
- Target: value = 39.33 (percentage), bounce_rate = 60.67

Bug 3 - Duplicates:
- Current: ada 2 set data dengan timestamp beda di ga4_metrics
- Target: 1 set data terbaru saja

# 🚀 PROMPT: Fix GSC + GA4 Data Issues — 3 Bug Fix Comprehensive

## 🎭 PERSONA

Anda adalah **Senior Fullstack Engineer + SEO/Analytics Data Specialist** dengan 10 tahun pengalaman:
- Google Search Console API (Sitemap, Search Analytics, URL Inspection)
- Google Analytics 4 API (Data API, Admin API)
- Database optimization (avoid duplicates, proper upsert patterns)
- Data normalization (consistent format across DB)
- Trade-off antara accuracy vs performance

Anda menulis kode yang **production-ready, akurat, dan idempotent**. Anda paham bahwa **data format inconsistency** = bug di downstream consumer (AI Agent), jadi setiap data harus saved dalam format yang clear dan consistent.

---

## 📌 CONTEXT

**Project**: SEO Agent V2 — Technical-first SEO platform.

**Status**:
- ✅ GSC OAuth integration jalan (data_source = 'gsc_api')
- ✅ GA4 OAuth integration jalan (data_source = 'ga4_api')
- ✅ Wizard Step 2 UI display data dari kedua source
- ❌ 3 BUG ditemukan saat verify data dengan ground truth (UI GSC + GA4 asli)

**Database**: 
- Table `gsc_metrics`: menyimpan data dari GSC API
- Table `ga4_metrics`: menyimpan data dari GA4 API
- Both tables sudah punya kolom: `metric_type`, `metric_value` (JSONB), `data_source`, `date_range`, `measured_at`

---

## 🐛 BUG YANG DITEMUKAN

### BUG 1: `indexed_pages` Tidak Match dengan GSC UI

**Current behavior** (di `app/api/integrations/gsc/sync/route.ts`):
- Fetch indexed pages via Sitemap API (`/sites/{siteUrl}/sitemaps`)
- Return: submitted (120) dan indexed (100) dari sitemap.xml saja

**Expected (sesuai GSC UI > Pages)**:
- Total URLs discovered Google: 371 (tidak hanya yang ada di sitemap)
- Indexed: 210
- Not indexed: 161
- Coverage: 56.6%

**Real Example Kaitech**:
| Source | Indexed | Total | Coverage |
|--------|---------|-------|----------|
| Sitemap API (current) | 100 | 120 | 83% ❌ |
| GSC UI Real | 210 | 371 | 56.6% ✅ |

### BUG 2: `engagement_rate` Format Salah (Decimal vs Percentage)

**Current data** di Supabase:
```json
{
  "value": 0.3932806324110672,    ← decimal 0-1
  "benchmark": 50,
  "bounce_rate": 99.60671936758894 ← persentase 0-100, tapi salah hitung
}
```

**Issues**:
1. `value` saved sebagai decimal (0.39) padahal benchmark dalam percentage (50)
2. Inconsistent: `value` decimal, `benchmark` percentage = AI Agent bingung
3. `bounce_rate` calculation salah: harusnya `100 - (engagement_rate * 100)` = 60.7%, tapi current value 99.6% (kemungkinan pakai `100 - 0.39 = 99.61`)

**Expected**:
```json
{
  "value": 39.33,           ← percentage (sama unit dengan benchmark)
  "benchmark": 50,
  "bounce_rate": 60.67,     ← benar: 100 - 39.33
  "conversion_rate": 0
}
```

### BUG 3: Duplicate Records pada Setiap Sync

**Current behavior** di sync endpoint:
- Setiap klik "Sync Now", code INSERT new rows
- TIDAK delete data lama
- Hasil: setiap minggu sync = N kali data baru, bloat DB

**Real evidence dari query Supabase**:
```
2026-06-08 07:36:28 → 4 rows (sync ke-2)
2026-06-08 07:35:51 → 4 rows (sync ke-1)
```

Total: 8 rows untuk 4 metric types (harusnya 4 rows saja, latest data).

**Expected**:
- Setiap sync: DELETE existing rows untuk project_id + data_source, lalu INSERT new
- DB tetap clean, query `ORDER BY measured_at DESC LIMIT 1` gak perlu

---

## 🎯 TASK

Fix **3 bugs** secara comprehensive:

1. **Indexed pages accuracy**: Implement URL Inspection API + smart fallback strategy
2. **Engagement rate normalization**: Save semua percentage data dalam format percentage (0-100)
3. **Duplicate prevention**: DELETE old data sebelum INSERT (atau pakai UPSERT)

---

## 📋 DETAIL IMPLEMENTASI

### FIX 1: Indexed Pages via URL Inspection API

#### Strategi Multi-Tier

```
SITE KECIL (<100 URLs):
└─ Full URL Inspection (akurasi 100%)

SITE MEDIUM (100-2000 URLs):  ← KAITECH (~371 URLs)
└─ Strategic sampling 200 URLs + extrapolate

SITE BESAR (>2000 URLs):
└─ Background job (n8n) atau hybrid estimate

FALLBACK CHAIN:
URL Inspection → Hybrid Estimate → Sitemap Fallback
```

#### Add Helper Functions di `lib/gsc-client.ts`

```typescript
export interface URLInspectionResult {
  url: string;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL';
  indexStatus: string;
}

export async function inspectURL(
  accessToken: string,
  propertyUrl: string,
  inspectUrl: string
): Promise<URLInspectionResult | null> {
  try {
    const response = await fetch(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inspectionUrl: inspectUrl,
          siteUrl: propertyUrl,
          languageCode: 'en-US'
        }),
        signal: AbortSignal.timeout(15000)
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
      return null;
    }
    
    const data = await response.json();
    const indexStatus = data.inspectionResult?.indexStatusResult;
    
    return {
      url: inspectUrl,
      verdict: indexStatus?.verdict || 'NEUTRAL',
      indexStatus: indexStatus?.indexingState || 'UNKNOWN'
    };
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') throw error;
    return null;
  }
}

export async function getDiscoveredURLs(
  accessToken: string,
  propertyUrl: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const urls = new Set<string>();
  let startRow = 0;
  const rowLimit = 25000;
  
  while (true) {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['page'],
          rowLimit, startRow
        })
      }
    );
    
    if (!response.ok) break;
    
    const data = await response.json();
    const rows = data.rows || [];
    
    for (const row of rows) {
      if (row.keys?.[0]) urls.add(row.keys[0]);
    }
    
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    if (startRow > 100000) break;
  }
  
  return Array.from(urls);
}

export async function getSitemapData(
  accessToken: string,
  propertyUrl: string
): Promise<{ submitted: number; indexed: number; sitemapsCount: number }> {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (!response.ok) return { submitted: 0, indexed: 0, sitemapsCount: 0 };
  
  const data = await response.json();
  const sitemaps = data.sitemap || [];
  
  return {
    submitted: sitemaps.reduce((s: number, sm: any) => 
      s + parseInt(sm.contents?.[0]?.submitted || '0'), 0),
    indexed: sitemaps.reduce((s: number, sm: any) => 
      s + parseInt(sm.contents?.[0]?.indexed || '0'), 0),
    sitemapsCount: sitemaps.length
  };
}
```

#### Update Smart Logic di Sync Endpoint

```typescript
// Inside POST handler, after fetching analytics data

let indexedPagesResult: {
  method: 'url_inspection' | 'hybrid_estimate' | 'sitemap_fallback';
  total_pages: number;
  indexed_pages: number;
  not_indexed_pages: number;
  coverage_percent: number;
  sample_size?: number;
  confidence: 'high' | 'medium' | 'low';
  details?: any;
};

try {
  const discoveredURLs = await getDiscoveredURLs(accessToken, propertyUrl, startDate, endDate);
  const sitemapData = await getSitemapData(accessToken, propertyUrl);
  const totalKnownURLs = Math.max(discoveredURLs.length, sitemapData.submitted);
  
  if (totalKnownURLs === 0) {
    throw new Error('NO_URLS_FOUND');
  }
  
  if (totalKnownURLs <= 100) {
    // SMALL SITE: Full inspection
    const urlsToCheck = discoveredURLs.length > 0 ? discoveredURLs : [propertyUrl];
    const results = await batchInspectURLs(accessToken, propertyUrl, urlsToCheck);
    
    const indexed = results.filter(r => r?.verdict === 'PASS').length;
    const total = results.length;
    
    indexedPagesResult = {
      method: 'url_inspection',
      total_pages: total,
      indexed_pages: indexed,
      not_indexed_pages: total - indexed,
      coverage_percent: total > 0 ? Math.round((indexed / total) * 100) : 0,
      confidence: 'high'
    };
    
  } else if (totalKnownURLs <= 2000) {
    // MEDIUM SITE: Sample 200 URLs + extrapolate (KAITECH ada di sini)
    const sampleSize = Math.min(200, totalKnownURLs);
    const sampledURLs = sampleURLsStrategically(discoveredURLs, sampleSize);
    const results = await batchInspectURLs(accessToken, propertyUrl, sampledURLs);
    
    const indexed = results.filter(r => r?.verdict === 'PASS').length;
    const total = results.length;
    const indexedRatio = total > 0 ? indexed / total : 0;
    
    const estimatedTotal = totalKnownURLs;
    const estimatedIndexed = Math.round(estimatedTotal * indexedRatio);
    
    indexedPagesResult = {
      method: 'url_inspection',
      total_pages: estimatedTotal,
      indexed_pages: estimatedIndexed,
      not_indexed_pages: estimatedTotal - estimatedIndexed,
      coverage_percent: Math.round(indexedRatio * 100),
      sample_size: sampleSize,
      confidence: 'medium',
      details: {
        sampled: sampleSize,
        sampled_indexed: indexed,
        extrapolation_basis: `${sampleSize} URLs sampled from ${totalKnownURLs} total`
      }
    };
    
  } else {
    // LARGE SITE: Hybrid estimate
    throw new Error('SITE_TOO_LARGE_USE_HYBRID');
  }
  
} catch (error: any) {
  // FALLBACK: Hybrid Estimate
  try {
    const sitemapData = await getSitemapData(accessToken, propertyUrl);
    const discoveredURLs = await getDiscoveredURLs(accessToken, propertyUrl, startDate, endDate);
    
    const estimatedTotal = Math.max(sitemapData.submitted, discoveredURLs.length);
    const estimatedIndexed = Math.max(sitemapData.indexed, discoveredURLs.length);
    const indexedPercent = estimatedTotal > 0 
      ? Math.round((estimatedIndexed / estimatedTotal) * 100) 
      : 0;
    
    indexedPagesResult = {
      method: 'hybrid_estimate',
      total_pages: estimatedTotal,
      indexed_pages: estimatedIndexed,
      not_indexed_pages: Math.max(0, estimatedTotal - estimatedIndexed),
      coverage_percent: indexedPercent,
      confidence: 'medium',
      details: {
        sitemap_submitted: sitemapData.submitted,
        sitemap_indexed: sitemapData.indexed,
        urls_with_impressions: discoveredURLs.length
      }
    };
    
  } catch (fallbackError: any) {
    // ULTIMATE FALLBACK
    const sitemapData = await getSitemapData(accessToken, propertyUrl);
    indexedPagesResult = {
      method: 'sitemap_fallback',
      total_pages: sitemapData.submitted,
      indexed_pages: sitemapData.indexed,
      not_indexed_pages: Math.max(0, sitemapData.submitted - sitemapData.indexed),
      coverage_percent: sitemapData.submitted > 0 
        ? Math.round((sitemapData.indexed / sitemapData.submitted) * 100) 
        : 0,
      confidence: 'low'
    };
  }
}

// Helper functions
async function batchInspectURLs(
  accessToken: string,
  propertyUrl: string,
  urls: string[]
): Promise<(any | null)[]> {
  const CONCURRENCY = 5;
  const DELAY_MS = 200;
  const results: (any | null)[] = [];
  
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(url => inspectURL(accessToken, propertyUrl, url))
    );
    results.push(...batchResults);
    
    if (i + CONCURRENCY < urls.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  return results;
}

function sampleURLsStrategically(allURLs: string[], sampleSize: number): string[] {
  if (allURLs.length <= sampleSize) return allURLs;
  
  const byDepth: Record<number, string[]> = {};
  for (const url of allURLs) {
    try {
      const depth = new URL(url).pathname.split('/').filter(Boolean).length;
      if (!byDepth[depth]) byDepth[depth] = [];
      byDepth[depth].push(url);
    } catch { continue; }
  }
  
  const sampled: string[] = [];
  const depths = Object.keys(byDepth).map(Number).sort();
  const samplesPerGroup = Math.ceil(sampleSize / depths.length);
  
  for (const depth of depths) {
    const shuffled = [...byDepth[depth]].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, samplesPerGroup));
    if (sampled.length >= sampleSize) break;
  }
  
  return sampled.slice(0, sampleSize);
}
```

#### Save Record with Metadata

```typescript
const indexedPagesRecord = {
  project_id,
  data_source: 'gsc_api',
  metric_type: 'indexed_pages',
  metric_value: {
    total: indexedPagesResult.total_pages,
    indexed: indexedPagesResult.indexed_pages,
    not_indexed: indexedPagesResult.not_indexed_pages,
    percentage: indexedPagesResult.coverage_percent,
    // METADATA untuk transparency
    measurement_method: indexedPagesResult.method,
    confidence: indexedPagesResult.confidence,
    sample_size: indexedPagesResult.sample_size,
    details: indexedPagesResult.details
  },
  date_range: `${startDate}_to_${endDate}`,
  measured_at: new Date().toISOString()
};
```

---

### FIX 2: Engagement Rate Format Normalization

#### Issue Analysis

GA4 API return data dalam **decimal** (0-1 range untuk percentages). Tapi banyak place di code yang **inconsistent**:
- Sebagian save sebagai decimal
- Sebagian save sebagai percentage
- AI Agent bingung mana mana

#### Solution: Always Save as Percentage (0-100)

Update `app/api/integrations/ga4/sync/route.ts`:

```typescript
// Inside the GA4 sync handler
// After fetching report data:

const row = reportData.rows?.[0];
if (!row) throw new Error('No GA4 data');

// Parse metrics
const sessions = parseInt(row.metricValues[0].value);
const pageViews = parseInt(row.metricValues[1].value);

// CRITICAL FIX: engagementRate dari GA4 is decimal (0-1), convert to percentage
const engagementRateDecimal = parseFloat(row.metricValues[2].value); // 0.39
const engagementRatePercent = parseFloat((engagementRateDecimal * 100).toFixed(2)); // 39.33

const activeUsers = parseInt(row.metricValues[3].value);
const newUsers = parseInt(row.metricValues[4].value);
const returningUsers = activeUsers - newUsers;

// FIX: bounce_rate = 100 - engagement_rate (sebagai percentage)
const bounceRatePercent = parseFloat((100 - engagementRatePercent).toFixed(2)); // 60.67

// Save with consistent format (semua percentage 0-100)
const records = [
  {
    project_id,
    data_source: 'ga4_api',
    metric_type: 'session',
    metric_value: { 
      value: sessions, 
      trend_pct: 0  // future: implement trend comparison
    },
    date_range: dateRange,
    measured_at: new Date().toISOString()
  },
  {
    project_id,
    data_source: 'ga4_api',
    metric_type: 'page_view',
    metric_value: { 
      value: pageViews, 
      trend_pct: 0 
    },
    date_range: dateRange,
    measured_at: new Date().toISOString()
  },
  {
    project_id,
    data_source: 'ga4_api',
    metric_type: 'engagement_rate',
    metric_value: { 
      value: engagementRatePercent,        // 39.33 (BUKAN 0.39)
      benchmark: 50,                        // 50% benchmark
      bounce_rate: bounceRatePercent,       // 60.67 (BUKAN 99.6)
      conversion_rate: 0                    // future: fetch from GA4
    },
    date_range: dateRange,
    measured_at: new Date().toISOString()
  },
  {
    project_id,
    data_source: 'ga4_api',
    metric_type: 'visitor',
    metric_value: { 
      new: newUsers, 
      returning: returningUsers, 
      total: activeUsers 
    },
    date_range: dateRange,
    measured_at: new Date().toISOString()
  }
];
```

#### Update Frontend Display (Wizard Step 2)

Pastiin UI display **value as-is** (no extra multiplication):

```tsx
// BEFORE (kalau code FE pakai multiplication untuk fix bug):
<p>{(data.value * 100).toFixed(0)}%</p>

// AFTER (data sudah percentage, langsung display):
<p>{data.value.toFixed(0)}%</p>
```

**Check di codebase**: cari semua place yang display engagement_rate, pastiin gak ada `* 100` lagi.

---

### FIX 3: Prevent Duplicate Records (DELETE Before INSERT)

#### Update di GSC Sync Endpoint

```typescript
// app/api/integrations/gsc/sync/route.ts

// BEFORE saving new data, DELETE old data for this project + source
await supabase
  .from('gsc_metrics')
  .delete()
  .eq('project_id', project_id)
  .eq('data_source', 'gsc_api');

// THEN insert new records
await supabase.from('gsc_metrics').insert(records);
```

#### Update di GA4 Sync Endpoint

```typescript
// app/api/integrations/ga4/sync/route.ts

// Same pattern: DELETE before INSERT
await supabase
  .from('ga4_metrics')
  .delete()
  .eq('project_id', project_id)
  .eq('data_source', 'ga4_api');

await supabase.from('ga4_metrics').insert(records);
```

#### Optional: Database Cleanup Migration

Untuk clean up duplicate yang udah ada di DB, run migration:

```sql
-- Migration: Cleanup duplicate GSC metrics (keep latest per project + metric_type + data_source)
DELETE FROM gsc_metrics a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (project_id, metric_type, data_source) id
  FROM gsc_metrics
  ORDER BY project_id, metric_type, data_source, measured_at DESC
);

-- Same for GA4
DELETE FROM ga4_metrics a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (project_id, metric_type, data_source) id
  FROM ga4_metrics
  ORDER BY project_id, metric_type, data_source, measured_at DESC
);

-- (Optional) Add unique constraint to prevent future duplicates
-- ALTER TABLE gsc_metrics 
--   ADD CONSTRAINT gsc_metrics_unique UNIQUE (project_id, metric_type, data_source);
-- ALTER TABLE ga4_metrics 
--   ADD CONSTRAINT ga4_metrics_unique UNIQUE (project_id, metric_type, data_source);
```

**Note**: Jangan add unique constraint kalau lo butuh historical data (untuk trend analysis). Cukup DELETE before INSERT untuk MVP.

---

## ✅ ACCEPTANCE CRITERIA

### Functional - Fix 1 (Indexed Pages)
- [ ] Sync GSC untuk Kaitech (~371 URLs) return:
  - `indexed_pages`: 200-220 (match ±5% dengan GSC UI 210)
  - `total_pages`: 350-380 (match ±5% dengan 371)
  - `coverage_percent`: 55-60% (match ±5% dengan 56.6%)
- [ ] Metadata di metric_value: `measurement_method`, `confidence`, `sample_size`
- [ ] Fallback chain works: URL Inspection → Hybrid → Sitemap
- [ ] Total sync time ≤60 detik untuk Kaitech

### Functional - Fix 2 (Engagement Rate)
- [ ] `engagement_rate.value` saved as percentage (0-100), bukan decimal (0-1)
- [ ] `engagement_rate.bounce_rate` = `100 - value` (correct math)
- [ ] UI display percentage tanpa extra `* 100`
- [ ] AI Agent prompt updated untuk expect percentage format

### Functional - Fix 3 (Duplicates)
- [ ] Setiap sync: old data deleted, new data inserted
- [ ] Query `SELECT * FROM gsc_metrics WHERE project_id = X` return **maksimal 5 rows** (untuk 5 metric types)
- [ ] Query `SELECT * FROM ga4_metrics WHERE project_id = X` return **maksimal 4 rows**
- [ ] Migration script untuk cleanup existing duplicates

### Data Validation
- [ ] No more decimal/percentage confusion (semua percentage 0-100)
- [ ] No more duplicate rows
- [ ] All numeric fields validate (no NaN, no negative)

---

## 🛠️ DELIVERABLE

1. Updated `lib/gsc-client.ts` (add inspectURL, getDiscoveredURLs, getSitemapData)
2. Updated `app/api/integrations/gsc/sync/route.ts` (smart indexed_pages logic + DELETE before INSERT)
3. Updated `app/api/integrations/ga4/sync/route.ts` (fix percentage + DELETE before INSERT)
4. Helper functions: `batchInspectURLs`, `sampleURLsStrategically`
5. Migration SQL untuk cleanup existing duplicates
6. Updated FE (Wizard Step 2) untuk handle new data format
7. (Optional) Updated AI Agent prompt di n8n workflow untuk expect new format

---

## 🧪 TESTING SCENARIO

### Test 1: Kaitech GSC Sync

```
1. Klik "Sync Now" di GSC card
2. Wait ~30-60 detik
3. Query Supabase:
   SELECT metric_value FROM gsc_metrics 
   WHERE project_id = 'f6682438-e267-4939-9ed8-aac730992315' 
     AND metric_type = 'indexed_pages';
4. Expected (match dengan GSC UI):
   {
     "total": 371,
     "indexed": 210,
     "not_indexed": 161,
     "percentage": 57,
     "measurement_method": "url_inspection",
     "confidence": "medium",
     "sample_size": 200
   }
5. Tolerance: ±5%
```

### Test 2: Kaitech GA4 Sync

```
1. Klik "Sync Now" di GA4 card  
2. Wait 5-10 detik
3. Query Supabase:
   SELECT metric_value FROM ga4_metrics 
   WHERE project_id = 'f6682438-e267-4939-9ed8-aac730992315' 
     AND metric_type = 'engagement_rate';
4. Expected:
   {
     "value": 39.33,           ← PERCENTAGE bukan decimal!
     "benchmark": 50,
     "bounce_rate": 60.67,     ← 100 - 39.33
     "conversion_rate": 0
   }
5. Math check: value + bounce_rate ≈ 100
```

### Test 3: No Duplicates

```
1. Klik "Sync Now" 3 kali berturut-turut
2. Query:
   SELECT COUNT(*), metric_type FROM gsc_metrics 
   WHERE project_id = 'f6682438-e267-4939-9ed8-aac730992315'
   GROUP BY metric_type;
3. Expected: 1 row per metric_type (5 metric types = 5 rows total)
4. Same untuk ga4_metrics: 4 rows total
```

### Test 4: UI Display Consistency

```
1. Reload wizard Step 2
2. Check GA4 card:
   - Engagement Rate harus display 39% (bukan 0.39%, bukan 3933%)
3. Check GSC card:
   - Indexed pages harus 210/371 (~57%)
4. Tooltip muncul untuk indexed_pages dengan info "Estimasi berdasarkan sampling 200 URLs"
```

---

## ⚠️ CRITICAL NOTES

### Order of Implementation

**WAJIB urutannya begini** supaya gak break existing data:

```
Step 1: Run migration cleanup duplicates (SQL above)
Step 2: Update GA4 sync endpoint (Fix 2 + Fix 3)
Step 3: Test GA4 sync, verify percentage format
Step 4: Update FE untuk display percentage benar
Step 5: Update GSC sync endpoint (Fix 1 + Fix 3)
Step 6: Test GSC sync, verify match dengan GSC UI
Step 7: Update AI Agent prompt (jika perlu)
```

### Quota Awareness

- URL Inspection API: 2000 calls/day per property
- Strategy: Sample 200 URLs (medium site) = 200 calls per sync
- User bisa sync max 10x/day per property tanpa quota issue

### Backward Compatibility

- Existing data dengan `engagement_rate.value = 0.39` harus di-handle gracefully kalau ada yang miss update
- Tambah validation di FE: `value > 1 ? value : value * 100` sebagai safety
- (Optional) Add data migration to convert old format to new

### Don't Forget

- ❌ Don't forget DELETE before INSERT di kedua endpoint (GSC + GA4)
- ❌ Don't store decimal mixed dengan percentage (consistency)
- ❌ Don't skip metadata di indexed_pages (transparency penting)
- ❌ Don't inspect semua URLs untuk site >100 (quota habis)

---

## 📚 REFERENCES

- URL Inspection API: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
- GA4 Engagement Rate definition: https://support.google.com/analytics/answer/12195621
- Search Analytics API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query

---

## 🎬 IMPLEMENTATION ORDER

**Day 1**: Database cleanup migration + Fix 3 (DELETE before INSERT) untuk GSC + GA4
**Day 2**: Fix 2 (engagement_rate percentage) + update FE display
**Day 3-4**: Fix 1 (URL Inspection) + helper functions
**Day 5**: Testing dengan Kaitech, verify accuracy

**Total**: 5 hari kerja (~1 minggu)

---

## 🎯 EXPECTED FINAL STATE

Setelah selesai, query Supabase untuk Kaitech harus return data clean ini:

### gsc_metrics (Kaitech)
```
| metric_type     | metric_value                                                  |
|-----------------|---------------------------------------------------------------|
| indexed_pages   | {total: 371, indexed: 210, percentage: 57, method: "url_..."} |
| impressions     | {value: 28025, trend_30d: "stable"}                           |
| avg_ctr         | {value: 1.44, benchmark: 2.5}                                 |
| avg_position    | {value: 21.33, benchmark: 10}                                 |
| keyword_position| {avg_position: 21.33, keywords: [...30 items]}                |
```

### ga4_metrics (Kaitech)
```
| metric_type     | metric_value                                                  |
|-----------------|---------------------------------------------------------------|
| session         | {value: 506, trend_pct: 0}                                    |
| page_view       | {value: 723, trend_pct: 0}                                    |
| engagement_rate | {value: 39.33, benchmark: 50, bounce_rate: 60.67, conv: 0}    |
| visitor         | {new: 352, returning: 27, total: 379}                         |
```

5 rows GSC + 4 rows GA4 = **9 rows total** (no duplicates).

---

**Mulai dari Fix 3 (DELETE before INSERT), lalu Fix 2 (engagement_rate), terakhir Fix 1 (URL Inspection). Test dengan Kaitech setelah setiap fix.**
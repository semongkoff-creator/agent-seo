# 🚀 PHASE 2: Form & Wizard Updates (SEO Agent V2)

## 🎭 PERSONA
Anda adalah **Senior Frontend Engineer** dengan 10 tahun pengalaman di Next.js + TypeScript + Tailwind + shadcn/ui. Fokus: UX simplification, form validation, dan accessibility.

## 📌 CONTEXT
SEO Agent V2 pivot — kurangi friction user dengan auto-integration (mock dulu) dan ubah field manual jadi dropdown. Phase 1 (database) sudah selesai.

## 🎯 TASK
Update 3 area frontend:
1. Modal Create Project (Quick Create) — dropdown conversion
2. Wizard Step 2 (Website Snapshot) — remove fields, add GSC/GA4 mock cards
3. Wizard Step 3 (Technical Signals) — dual mode + clickable error cards

## 📋 DETAIL PER AREA

### A. Modal Create Project

**File**: `app/projects/components/QuickCreateModal.tsx` (atau path serupa)

**Perubahan**:

1. Field `industry` (Text → Dropdown):
```tsx
const INDUSTRY_OPTIONS = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'agency', label: 'Software Development Agency' },
  { value: 'consulting', label: 'Konsultan / Professional Services' },
  { value: 'fnb', label: 'Restoran / F&B' },
  { value: 'manufacturing', label: 'Manufaktur' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'fintech', label: 'Finance / Fintech' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'tourism', label: 'Tourism / Hospitality' },
  { value: 'local', label: 'Local Business' },
  { value: 'other', label: 'Other (specify)' },
];

<Select value={industry} onValueChange={setIndustry}>
  <SelectTrigger>
    <SelectValue placeholder="Pilih industri" />
  </SelectTrigger>
  <SelectContent>
    {INDUSTRY_OPTIONS.map(opt => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
{industry === 'other' && (
  <Input placeholder="Specify industry" value={otherIndustry} onChange={...} />
)}
```

2. Field `target_location`:
- Default value: `"Indonesia"`
- Tetap text input (editable jika user mau ganti)

3. Field `target_audience` (Text → Dropdown):
```tsx
const AUDIENCE_OPTIONS = [
  { value: 'b2b_enterprise', label: 'B2B Enterprise' },
  { value: 'b2b_midmarket', label: 'B2B Mid-Market' },
  { value: 'b2b_smb', label: 'B2B SMB' },
  { value: 'b2c_mass', label: 'B2C Mass Market' },
  { value: 'b2c_premium', label: 'B2C Premium' },
  { value: 'local', label: 'Local Community' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'mixed', label: 'Mixed (B2B + B2C)' },
  { value: 'other', label: 'Other (specify)' },
];
```

4. Field `main_product_or_service` (Text → Dropdown grouped by industry):
```tsx
const PRODUCT_OPTIONS = {
  agency: [
    { value: 'custom_software', label: 'Custom Software Development' },
    { value: 'web_dev', label: 'Web Development' },
    { value: 'mobile_dev', label: 'Mobile App Development' },
    { value: 'erp', label: 'ERP Implementation' },
  ],
  ecommerce: [
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'fnb', label: 'Food & Beverage' },
    { value: 'beauty', label: 'Health & Beauty' },
    { value: 'home', label: 'Home & Living' },
  ],
  // ... add for each industry
  default: [{ value: 'other', label: 'Other (specify)' }]
};

// Show options based on selected industry
const productOptions = PRODUCT_OPTIONS[industry] || PRODUCT_OPTIONS.default;
```

5. Field `main_business_goal` (Update enum):
```tsx
const GOAL_OPTIONS = [
  { value: 'leads', label: 'Generate Leads' },
  { value: 'traffic', label: 'Increase Traffic' },
  { value: 'keyword_position', label: 'Improve Keyword Position' }, // BARU
  // REMOVED: sales, awareness, local
];
```

**Backward compatibility**: Jika existing project punya value `sales`, `awareness`, atau `local`, map ke `leads` saat display.

### B. Wizard Step 2: Website Snapshot

**File**: `app/projects/[id]/identify/components/WizardStep2.tsx` (atau path serupa)

**HAPUS Field UI** (jangan delete dari database):
- Form input untuk: `indexed_pages`, `published_pages`, `main_seo_concern`

**Field yang Tetap**:
- `website_stage` → rename label ke "Staging Website", options jadi 2:
  - "New Website" (under 6 months)
  - "Existing Website" (over 6 months)
- HAPUS option: "From Scratch"

**Komponen Baru**: `<GSCConnectionStatus />`

```tsx
// app/components/wizard/GSCConnectionStatus.tsx
export function GSCConnectionStatus({ projectId }: { projectId: string }) {
  const { data, loading } = useGSCMockData(projectId); // fetch dari gsc_metrics table
  
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">Google Search Console Connected</span>
        </div>
        <Badge variant="secondary">Mock Data</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Indexed Pages</span>
            <span className="text-2xl font-bold">{data.indexed} / {data.total}</span>
          </div>
          <Progress value={data.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {data.percentage}% halaman terindex
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Komponen Baru**: `<GA4MetricsCard />`

```tsx
// app/components/wizard/GA4MetricsCard.tsx
export function GA4MetricsCard({ projectId }: { projectId: string }) {
  const { data } = useGA4MockData(projectId);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Traffic Trend (GA4)</h3>
          <Badge variant="secondary">Mock Data</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricBox label="Session" value={data.session.value} trend={data.session.trend_pct} />
          <MetricBox label="Page View" value={data.page_view.value} trend={data.page_view.trend_pct} />
          <MetricBox label="Engagement Rate" value={`${data.engagement_rate.value}%`} benchmark={data.engagement_rate.benchmark} />
          <MetricBox label="Total Visitor" value={data.visitor.total} subtitle={`${data.visitor.new} new + ${data.visitor.returning} returning`} />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, value, trend, benchmark, subtitle }) {
  return (
    <div className="p-3 border rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs 30d
        </p>
      )}
      {benchmark && (
        <p className="text-xs text-muted-foreground">Benchmark: {benchmark}%</p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
```

**Mock Data Helper**:
```tsx
// lib/mocks/gsc.ts
export async function useGSCMockData(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('gsc_metrics')
    .select('*')
    .eq('project_id', projectId)
    .eq('metric_type', 'indexed_pages')
    .single();
  
  return data?.metric_value || { indexed: 0, total: 0, percentage: 0 };
}

// lib/mocks/ga4.ts — similar pattern
```

### C. Wizard Step 3: Technical Signals

**File**: `app/projects/[id]/identify/components/WizardStep3.tsx`

**Perubahan 1**: Sitemap & Robots.txt Dual Mode

```tsx
const [sitemapMode, setSitemapMode] = useState<'auto' | 'manual'>('auto');
const [sitemapUrl, setSitemapUrl] = useState(`${websiteUrl}/sitemap.xml`);

<div>
  <label>Sitemap URL</label>
  <div className="flex items-center gap-2 mb-2">
    <ToggleGroup value={sitemapMode} onValueChange={setSitemapMode}>
      <ToggleGroupItem value="auto">
        <Refresh className="h-4 w-4 mr-1" /> Auto-detected
      </ToggleGroupItem>
      <ToggleGroupItem value="manual">
        <Edit className="h-4 w-4 mr-1" /> Edit manually
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
  <Input
    value={sitemapUrl}
    onChange={(e) => setSitemapUrl(e.target.value)}
    disabled={sitemapMode === 'auto'}
    placeholder="https://yourdomain.com/sitemap.xml"
  />
  {sitemapMode === 'auto' && (
    <p className="text-xs text-muted-foreground mt-1">
      Sistem akan otomatis crawl sitemap dari URL website Anda.
    </p>
  )}
</div>
```

Pattern sama untuk `robots.txt`.

**Perubahan 2**: Convert Toggle Errors → Clickable Error Cards

HAPUS toggle ON/OFF untuk:
- `mobile_usability_issues`, `redirect_errors`, `has_4xx_5xx_errors`, `canonical_issues`, `noindex_issues`

GANTI dengan grid cards yang fetch dari `technical_errors` table:

```tsx
// app/components/wizard/ErrorCardsGrid.tsx
export function ErrorCardsGrid({ projectId }: { projectId: string }) {
  const { data: errors } = useTechnicalErrors(projectId);
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {errors.map(error => (
        <ErrorCard
          key={error.id}
          source={error.source}
          errorType={error.error_type}
          count={error.error_count}
          severity={error.severity}
          status={error.status}
          onClick={() => openErrorDetailModal(error.id)}
        />
      ))}
    </div>
  );
}

function ErrorCard({ source, errorType, count, severity, status, onClick }) {
  const severityColor = {
    low: 'bg-green-50 text-green-700',
    medium: 'bg-yellow-50 text-yellow-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700'
  }[severity];
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition ${status === 'fixed' ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">{source}</Badge>
          <Badge className={severityColor}>{severity}</Badge>
        </div>
        <p className="text-3xl font-bold">{count}</p>
        <p className="text-sm text-muted-foreground">{errorType}</p>
        {status === 'fixed' && (
          <p className="text-xs text-green-600 mt-1">✓ Fixed</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Komponen Modal Detail**:

```tsx
// app/components/wizard/ErrorDetailModal.tsx
export function ErrorDetailModal({ errorId, onClose }) {
  const { data: error } = useTechnicalErrorDetail(errorId);
  
  return (
    <Dialog open={!!errorId} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{error.error_type}</DialogTitle>
          <DialogDescription>
            Source: {error.source} | Severity: {error.severity}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Affected URLs ({error.error_count})</h4>
            <ul className="space-y-1 text-sm">
              {error.affected_urls.map(url => (
                <li key={url} className="font-mono text-blue-600">{url}</li>
              ))}
            </ul>
          </div>
          
          {error.screenshots?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Screenshots</h4>
              <div className="grid grid-cols-2 gap-2">
                {error.screenshots.map((url, i) => (
                  <img key={i} src={url} alt="Error screenshot" className="rounded border" />
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-2">Recommended Fix</h4>
            <p className="text-sm text-muted-foreground">
              {getRecommendedFix(error.error_type)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## ✅ ACCEPTANCE CRITERIA

- [ ] Modal Create Project: semua dropdown berfungsi, "Other" option triggers text input
- [ ] Target location default "Indonesia"
- [ ] Main goal options cuma 3: Leads, Traffic, Keyword Position
- [ ] Wizard Step 2: tidak ada manual input untuk indexed_pages/published_pages/main_seo_concern
- [ ] Wizard Step 2: GSC card menampilkan "X / Y indexed (Z%)" dari mock data
- [ ] Wizard Step 2: GA4 card menampilkan 4 metrics dari mock data
- [ ] Wizard Step 3: sitemap & robots.txt punya toggle Auto/Manual
- [ ] Wizard Step 3: error cards clickable, buka modal dengan affected URLs
- [ ] Existing project tidak rusak (backward compatible)
- [ ] Draft auto-save tetap berfungsi
- [ ] Bilingual (ID/EN) tetap berfungsi

## 🛠️ DELIVERABLE

1. Updated components di folder yang sesuai
2. Mock data helpers di `lib/mocks/`
3. Types di `types/wizard.ts`
4. Test manual di localhost
5. Document di CHANGELOG.md

## ⚠️ IMPORTANT

- JANGAN ubah API endpoint atau payload structure dulu
- Backward compatible: existing project masih bisa di-load
- Pakai shadcn/ui components yang udah ada
- Konsisten dengan brand color indigo (#4F46E5)

Mulai dari area A (Modal Create Project), test, lalu lanjut B (Step 2), lalu C (Step 3).

# 🚀 PHASE 3: Diagnosis Page Restructure (SEO Agent V2)

## 🎭 PERSONA
Anda adalah **Senior Frontend Engineer + UX Designer** dengan 10 tahun pengalaman membangun dashboard analytics dan tools developer. Fokus: information hierarchy, actionable UI, dan data visualization.

## 📌 CONTEXT
SEO Agent V2 — halaman Diagnosis di-restructure menjadi 4 section utama (Technical Issue, Keyword Position, AI Overview, Business Impact). Tujuan: dari "report viewer" jadi "action dashboard".

Phase 1 (database) dan Phase 2 (wizard) sudah selesai. Tables `technical_errors`, `ai_visibility_metrics`, `gsc_metrics`, `ga4_metrics` sudah ada dengan mock data.

## 🎯 TASK
Restructure halaman `/diagnosis/[id]` menjadi 4 section + CTA ke Objective. HAPUS section lama yang tidak relevan.

## 📋 STRUKTUR HALAMAN BARU

```
┌─────────────────────────────────────────────────────────────┐
│ DIAGNOSIS HEADER                                              │
│ - Project name + diagnosis summary                            │
│ - Technical Health Score (NEW) + AI Visibility Score (NEW)    │
│ - Confidence + Severity + Problem Type tags                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🔧 SECTION 1: TECHNICAL ISSUE                                 │
│ - Technical Health Score: 65/100                              │
│ - Interactive Checklist (sync ke database)                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🔍 SECTION 2: KEYWORD POSITION                                │
│ - Table keyword dengan position, URL ranking, volume          │
│ - Filter: All / Top 10 / Opportunity (11-30) / Long-tail      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🤖 SECTION 3: AI OVERVIEW (DIFFERENTIATION)                   │
│ - 4 metric cards (Visibility, Detection Rate, Top 3, Avg Pos) │
│ - Engine tabs: Gemini (priority 1) + ChatGPT (priority 2)     │
│ - Per-keyword breakdown table                                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 💼 SECTION 4: BUSINESS IMPACT                                 │
│ - 5 metric cards dari GA4                                     │
│ - Visitor breakdown (new vs returning) donut chart            │
│ - Keyword owning counter                                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🎯 RECOMMENDATION CTA                                          │
│ - "Generate Objective dari rekomendasi ini" → button          │
└─────────────────────────────────────────────────────────────┘
```

**HAPUS** dari halaman lama:
- ❌ Section "Avoid These Actions"
- ❌ Section "Status" (Campaign Readiness sidebar)
- ❌ Old Evidence Cards (replaced dengan 4 new sections)
- ❌ Old Root Cause + Business Impact (merge ke section baru)

## 📋 DETAIL PER SECTION

### Section 1: 🔧 Technical Issue

**Component**: `<TechnicalIssueSection projectId={...} diagnosisId={...} />`

**File baru**: `app/diagnosis/[id]/sections/TechnicalIssueSection.tsx`

```tsx
export function TechnicalIssueSection({ projectId, diagnosisId }) {
  const { data: errors, mutate } = useTechnicalErrors(projectId);
  
  const healthScore = useMemo(() => {
    if (!errors?.length) return 100;
    const total = errors.length;
    const fixed = errors.filter(e => e.status === 'fixed').length;
    const weighted = errors.reduce((acc, e) => {
      const weight = { critical: 4, high: 3, medium: 2, low: 1 }[e.severity];
      const points = e.status === 'fixed' ? weight : 0;
      return acc + points;
    }, 0);
    const maxWeight = errors.reduce((acc, e) => {
      const weight = { critical: 4, high: 3, medium: 2, low: 1 }[e.severity];
      return acc + weight;
    }, 0);
    return Math.round((weighted / maxWeight) * 100);
  }, [errors]);
  
  const updateStatus = async (errorId: string, newStatus: string) => {
    await fetch(`/api/projects/${projectId}/technical-errors/${errorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    mutate(); // re-fetch
  };
  
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔧 Technical Issue</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm">Technical Health Score:</span>
          <Badge className={getHealthBadgeColor(healthScore)}>
            {healthScore}/100
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            {errors.map(error => (
              <div key={error.id} className="flex items-start gap-3 p-3 border rounded hover:bg-muted/50">
                <Checkbox
                  checked={error.status === 'fixed'}
                  onCheckedChange={(checked) => 
                    updateStatus(error.id, checked ? 'fixed' : 'open')
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={error.status === 'fixed' ? 'line-through opacity-50' : ''}>
                      {error.error_type}
                    </span>
                    <Badge variant="outline" className="text-xs">{error.source}</Badge>
                    <Badge className={getSeverityColor(error.severity)} variant="secondary">
                      {error.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {error.error_count} occurrences
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openDetailModal(error.id)}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

**API Endpoint Baru**:
```typescript
// app/api/projects/[id]/technical-errors/[errorId]/route.ts
export async function PATCH(req, { params }) {
  const { status } = await req.json();
  const supabase = createServerClient();
  
  const updates: any = { status };
  if (status === 'fixed') updates.fixed_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('technical_errors')
    .update(updates)
    .eq('id', params.errorId)
    .eq('project_id', params.id) // RLS check
    .select()
    .single();
  
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ data });
}
```

**Realtime sync**: Pakai Supabase Realtime subscription untuk update status secara real-time.

### Section 2: 🔍 Keyword Position

**Component**: `<KeywordPositionSection projectId={...} />`

**File baru**: `app/diagnosis/[id]/sections/KeywordPositionSection.tsx`

```tsx
const POSITION_FILTERS = [
  { value: 'all', label: 'All Keywords' },
  { value: 'top10', label: 'Top 10' },
  { value: 'opportunity', label: 'Opportunity (11-30)' },
  { value: 'longtail', label: 'Long-tail (31+)' },
];

export function KeywordPositionSection({ projectId }) {
  const [filter, setFilter] = useState('all');
  const { data: keywords } = useGSCKeywords(projectId, filter);
  
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔍 Keyword Position</h2>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {POSITION_FILTERS.map(f => (
              <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>URL Ranking</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map(k => (
              <TableRow key={k.keyword}>
                <TableCell className="font-medium">{k.keyword}</TableCell>
                <TableCell>
                  <Badge variant={getPositionBadge(k.position)}>
                    {k.position} (Page {Math.ceil(k.position / 10)})
                  </Badge>
                </TableCell>
                <TableCell className="text-blue-600 underline text-sm">
                  {k.url_ranking || '-'}
                </TableCell>
                <TableCell>{k.search_volume?.toLocaleString() || '-'}</TableCell>
                <TableCell>
                  <TrendArrow value={k.trend} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
```

**Mock data**: Buat di `lib/mocks/gsc-keywords.ts` dengan ~20-30 realistic keywords per project.

### Section 3: 🤖 AI Overview (DIFFERENTIATION)

**Component**: `<AIOverviewSection projectId={...} />`

**File baru**: `app/diagnosis/[id]/sections/AIOverviewSection.tsx`

```tsx
export function AIOverviewSection({ projectId }) {
  const [engine, setEngine] = useState<'gemini' | 'chatgpt'>('gemini');
  const { data: metrics } = useAIVisibilityMetrics(projectId, engine);
  
  const aggregates = useMemo(() => {
    if (!metrics?.length) return null;
    return {
      visibility_score: Math.round(metrics.reduce((acc, m) => acc + m.visibility_score, 0) / metrics.length),
      detection_rate: (metrics.reduce((acc, m) => acc + m.detection_rate, 0) / metrics.length).toFixed(1),
      top3_visibility: metrics.reduce((acc, m) => acc + m.top3_visibility, 0),
      avg_position: (metrics.reduce((acc, m) => acc + m.avg_position, 0) / metrics.length).toFixed(2),
    };
  }, [metrics]);
  
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🤖 AI Overview</h2>
          <p className="text-sm text-muted-foreground">
            Track visibility brand di Generative Search engines
          </p>
        </div>
        <Badge variant="outline">Geoptie Integration (Mock)</Badge>
      </div>
      
      {/* Engine Tabs */}
      <Tabs value={engine} onValueChange={(v) => setEngine(v as any)}>
        <TabsList>
          <TabsTrigger value="gemini">
            <Sparkles className="h-4 w-4 mr-1" />
            Gemini (Google SGE)
          </TabsTrigger>
          <TabsTrigger value="chatgpt">
            <MessageSquare className="h-4 w-4 mr-1" />
            ChatGPT Search
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Eye />}
          label="Visibility Score"
          value={`${aggregates?.visibility_score || 0}/100`}
          description="Overall presence di AI Overview"
        />
        <MetricCard
          icon={<Target />}
          label="Detection Rate"
          value={`${aggregates?.detection_rate || 0}%`}
          description="Query menghasilkan AI Overview yang mention brand"
        />
        <MetricCard
          icon={<Award />}
          label="Top 3 Visibility"
          value={aggregates?.top3_visibility || 0}
          description="Keywords di top 3 AI Overview citations"
        />
        <MetricCard
          icon={<BarChart3 />}
          label="Avg Position"
          value={aggregates?.avg_position || '-'}
          description="Rata-rata posisi citation"
        />
      </div>
      
      {/* Per-keyword breakdown */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">Per-Keyword Visibility</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>{engine === 'gemini' ? 'Gemini' : 'ChatGPT'} Visibility</TableHead>
                <TableHead>Citation Position</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.keyword}</TableCell>
                  <TableCell>
                    {m.visibility_score > 50 ? (
                      <Badge className="bg-green-100 text-green-700">Visible</Badge>
                    ) : (
                      <Badge variant="secondary">Not Visible</Badge>
                    )}
                  </TableCell>
                  <TableCell>#{m.avg_position}</TableCell>
                  <TableCell>{m.visibility_score}/100</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
```

### Section 4: 💼 Business Impact

**Component**: `<BusinessImpactSection projectId={...} />`

```tsx
export function BusinessImpactSection({ projectId }) {
  const { data: ga4 } = useGA4Metrics(projectId);
  const { data: keywordOwning } = useKeywordOwning(projectId);
  
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">💼 Business Impact</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visitor donut chart */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">Total Visitor</h3>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={[
                { name: 'New', value: ga4.visitor.new, color: '#4F46E5' },
                { name: 'Returning', value: ga4.visitor.returning, color: '#A78BFA' },
              ]}
            />
            <p className="text-3xl font-bold mt-2">{ga4.visitor.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        {/* Session + Page View */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">Traffic</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow label="Session" value={ga4.session.value} trend={ga4.session.trend_pct} />
            <MetricRow label="Page View" value={ga4.page_view.value} trend={ga4.page_view.trend_pct} />
            <MetricRow label="Engagement Rate" value={`${ga4.engagement_rate.value}%`} benchmark={ga4.engagement_rate.benchmark} />
          </CardContent>
        </Card>
        
        {/* Keyword Owning */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">Keyword Owning</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-3xl font-bold">{keywordOwning.top10}</p>
              <p className="text-sm text-muted-foreground">keywords ranking in Top 10</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{keywordOwning.top3}</p>
              <p className="text-sm text-muted-foreground">keywords ranking in Top 3</p>
            </div>
            <Progress value={(keywordOwning.top10 / keywordOwning.total) * 100} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
```

### Recommendation CTA

```tsx
<Card className="border-indigo-200 bg-indigo-50">
  <CardContent className="p-6 flex items-center justify-between">
    <div>
      <h3 className="font-bold text-lg">Berdasarkan diagnosa, kami rekomendasikan:</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {diagnosis.recommended_next_step}
      </p>
    </div>
    <Button size="lg" onClick={proceedToObjective}>
      Generate Objective <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  </CardContent>
</Card>
```

## ✅ ACCEPTANCE CRITERIA

- [ ] Halaman diagnosis show 4 section: Technical Issue, Keyword Position, AI Overview, Business Impact
- [ ] Technical checklist: checkbox bisa toggle, status tersimpan di database
- [ ] Realtime sync: jika di-update di tab lain, otomatis refresh
- [ ] Keyword Position table: filter berfungsi (All/Top 10/Opportunity/Long-tail)
- [ ] AI Overview: engine tabs (Gemini/ChatGPT) toggleable
- [ ] AI Overview: 4 metric cards menampilkan aggregate dari per-keyword data
- [ ] Business Impact: donut chart, metric cards, keyword owning counter
- [ ] CTA "Generate Objective" berfungsi dan redirect ke wizard objective
- [ ] HAPUS: section Avoid Actions, Status, Old Evidence Cards
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Loading states + empty states + error states ada
- [ ] Bilingual (ID/EN) tetap berfungsi

## 🛠️ DELIVERABLE

1. 4 component files baru di `app/diagnosis/[id]/sections/`
2. 1 API endpoint baru: `PATCH /api/projects/[id]/technical-errors/[errorId]`
3. Hook files: `useTechnicalErrors`, `useAIVisibilityMetrics`, `useGA4Metrics`, `useGSCKeywords`, `useKeywordOwning`
4. Mock data helpers
5. Updated main page: `app/diagnosis/[id]/page.tsx`

## ⚠️ IMPORTANT

- HAPUS section lama dari halaman diagnosis
- JANGAN ubah API endpoint diagnosis existing (POST /api/projects/[id]/identify/submit) — itu Phase 5
- Pakai shadcn/ui components yang udah ada
- Konsisten brand color indigo (#4F46E5)
- Existing diagnosis data harus tetap render (graceful degradation jika field baru null)

Mulai dari Section 1 (Technical Issue), test, lalu Section 2, 3, 4 berurutan.

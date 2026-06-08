# 🚀 PHASE 4: Objective Page Restructure (SEO Agent V2)

## 🎭 PERSONA
Anda adalah **Senior Frontend Engineer + Product Designer** dengan 10 tahun pengalaman building project management & strategy tools. Fokus: information density, action-orientation, dan cross-page state sync.

## 📌 CONTEXT
SEO Agent V2 — halaman Objective di-restructure menjadi 3-pillar (Technical, Content & Keyword, Business Impact). Technical pillar **sync** dengan checklist di Diagnosis page.

Phase 1, 2, dan 3 sudah selesai. Tabel database, wizard, dan diagnosis page sudah updated.

## 🎯 TASK
Restructure halaman `/objectives/[id]` menjadi 3-pillar structure. HAPUS section yang gak relevan. Implement bidirectional sync untuk Technical pillar.

## 📋 STRUKTUR HALAMAN BARU

```
┌─────────────────────────────────────────────────────────────┐
│ OBJECTIVE HEADER                                              │
│ - Project name + objective title                              │
│ - Diagnosis reference link                                    │
│ - Overall progress bar (%)                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ PILLAR 1: 🔧 TECHNICAL (Priority 1)                           │
│ - Sync dengan Diagnosis checklist                             │
│ - "Dikerjakan duluan"                                         │
│ - Progress bar + checklist                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ PILLAR 2: 📝 CONTENT & KEYWORD                                │
│ - SMART objective                                             │
│ - Action items (apa yg dikerjain tim)                         │
│ - Target metrics (keyword position, ranking)                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ PILLAR 3: 💰 BUSINESS IMPACT                                  │
│ - SMART objective business-oriented                           │
│ - Target metrics (leads, traffic, revenue)                    │
│ - ROI estimate                                                │
└─────────────────────────────────────────────────────────────┘
```

**HAPUS** dari halaman lama:
- ❌ "Achievability score" card di header (move ke metadata sidebar)
- ❌ "Avoid Actions" section
- ❌ Generic "Baseline + Target + Input/Output/Outcome Metrics" — restructure ke 3 pillar
- ❌ Verbose Risk Notes — minimize ke sidebar tooltip
- ❌ Old SMART Objective single statement (replaced dengan 3 pillar)

## 📋 DETAIL PER PILLAR

### Pillar 1: 🔧 Technical (Priority 1)

**Component**: `<TechnicalPillar projectId={...} objectiveId={...} />`

**File baru**: `app/objectives/[id]/pillars/TechnicalPillar.tsx`

**Penting**: Sync dengan `technical_errors` table (same source dengan Diagnosis page).

```tsx
export function TechnicalPillar({ projectId, objectiveId }) {
  const { data: errors, mutate } = useTechnicalErrors(projectId);
  
  // Same hook dengan Diagnosis page → Single source of truth
  
  const progress = useMemo(() => {
    if (!errors?.length) return { fixed: 0, total: 0, percent: 0 };
    const total = errors.length;
    const fixed = errors.filter(e => e.status === 'fixed').length;
    return {
      fixed,
      total,
      percent: Math.round((fixed / total) * 100)
    };
  }, [errors]);
  
  // Group by priority based on severity
  const grouped = useMemo(() => ({
    critical: errors.filter(e => e.severity === 'critical' && e.status !== 'fixed'),
    high: errors.filter(e => e.severity === 'high' && e.status !== 'fixed'),
    medium: errors.filter(e => e.severity === 'medium' && e.status !== 'fixed'),
    low: errors.filter(e => e.severity === 'low' && e.status !== 'fixed'),
    fixed: errors.filter(e => e.status === 'fixed'),
  }), [errors]);
  
  const updateStatus = async (errorId, newStatus) => {
    await fetch(`/api/projects/${projectId}/technical-errors/${errorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  };
  
  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700">Priority 1</Badge>
              <h2 className="text-xl font-bold">🔧 Technical</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dikerjakan duluan — sync dengan checklist di halaman Diagnosis
            </p>
          </div>
          <Link href={`/diagnosis/${diagnosisId}`} className="text-sm text-indigo-600 underline">
            View in Diagnosis →
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {progress.fixed} dari {progress.total} technical issues resolved
            </span>
            <span className="text-sm font-bold">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-3" />
        </div>
        
        {/* Grouped checklist */}
        {grouped.critical.length > 0 && (
          <PriorityGroup
            title="Critical"
            badge="bg-red-100 text-red-700"
            items={grouped.critical}
            onUpdateStatus={updateStatus}
          />
        )}
        {grouped.high.length > 0 && (
          <PriorityGroup
            title="High"
            badge="bg-orange-100 text-orange-700"
            items={grouped.high}
            onUpdateStatus={updateStatus}
          />
        )}
        {grouped.medium.length > 0 && (
          <PriorityGroup
            title="Medium"
            badge="bg-yellow-100 text-yellow-700"
            items={grouped.medium}
            onUpdateStatus={updateStatus}
          />
        )}
        {grouped.low.length > 0 && (
          <PriorityGroup
            title="Low"
            badge="bg-green-100 text-green-700"
            items={grouped.low}
            onUpdateStatus={updateStatus}
            collapsible // default collapsed kalau low
          />
        )}
        {grouped.fixed.length > 0 && (
          <PriorityGroup
            title="✓ Fixed"
            badge="bg-gray-100 text-gray-700"
            items={grouped.fixed}
            onUpdateStatus={updateStatus}
            collapsible
          />
        )}
      </CardContent>
    </Card>
  );
}

function PriorityGroup({ title, badge, items, onUpdateStatus, collapsible = false }) {
  const [open, setOpen] = useState(!collapsible);
  
  return (
    <div className="mb-4">
      <div 
        className="flex items-center gap-2 mb-2 cursor-pointer"
        onClick={() => collapsible && setOpen(!open)}
      >
        {collapsible && (
          <ChevronRight className={`h-4 w-4 transition ${open ? 'rotate-90' : ''}`} />
        )}
        <Badge className={badge}>{title}</Badge>
        <span className="text-sm text-muted-foreground">({items.length})</span>
      </div>
      
      {open && (
        <div className="space-y-1 ml-6">
          {items.map(error => (
            <ChecklistItem key={error.id} error={error} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ error, onUpdateStatus }) {
  const estimatedEffort = getEstimatedEffort(error.severity); // helper function
  
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
      <Checkbox
        checked={error.status === 'fixed'}
        onCheckedChange={(checked) => onUpdateStatus(error.id, checked ? 'fixed' : 'open')}
      />
      <div className="flex-1">
        <span className={error.status === 'fixed' ? 'line-through opacity-50' : ''}>
          {error.error_type}
        </span>
        <p className="text-xs text-muted-foreground">
          {error.error_count} occurrences · Est. {estimatedEffort}
        </p>
      </div>
      <Badge variant="outline" className="text-xs">{error.source}</Badge>
    </div>
  );
}
```

### Pillar 2: 📝 Content & Keyword

**Component**: `<ContentKeywordPillar objective={...} />`

```tsx
export function ContentKeywordPillar({ objective }) {
  // objective.pillar === 'content_keyword'
  // objective.smart_objective, objective.action_items, objective.target_metrics
  
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700">Priority 2</Badge>
          <h2 className="text-xl font-bold">📝 Content & Keyword</h2>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* SMART Objective */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">SMART Objective</h3>
          <p className="text-lg">{objective.smart_objective}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {objective.time_period}
          </div>
        </div>
        
        {/* Action Items */}
        <div>
          <h3 className="font-medium mb-3">Action Items (Apa yang dikerjakan tim)</h3>
          <div className="space-y-2">
            {objective.action_items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded">
                <Badge variant="outline">{i + 1}</Badge>
                <p className="flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Target Metrics */}
        <div>
          <h3 className="font-medium mb-3">Target Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(objective.target_metrics || {}).map(([key, value]) => (
              <div key={key} className="p-3 border rounded">
                <p className="text-sm text-muted-foreground">{formatLabel(key)}</p>
                <p className="text-xl font-bold mt-1">
                  {value.baseline} → {value.target}
                </p>
                {value.unit && <p className="text-xs text-muted-foreground">{value.unit}</p>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Pillar 3: 💰 Business Impact

**Component**: `<BusinessImpactPillar objective={...} />`

```tsx
export function BusinessImpactPillar({ objective }) {
  // objective.pillar === 'business_impact'
  // objective.smart_objective, objective.target_metrics, objective.roi_estimate
  
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700">Priority 3</Badge>
          <h2 className="text-xl font-bold">💰 Business Impact</h2>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* SMART Objective */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium mb-2">SMART Objective</h3>
          <p className="text-lg">{objective.smart_objective}</p>
        </div>
        
        {/* Target Metrics */}
        <div>
          <h3 className="font-medium mb-3">Target Metrics</h3>
          <div className="space-y-3">
            {Object.entries(objective.target_metrics || {}).map(([key, value]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{formatLabel(key)}</p>
                  <Badge variant="secondary">{value.unit}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Baseline</p>
                    <p className="text-2xl font-bold">{value.baseline}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-2xl font-bold text-green-600">{value.target}</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <p className="text-xl font-bold">+{calcGrowth(value.baseline, value.target)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ROI Estimate */}
        {objective.roi_estimate && (
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="font-medium mb-1">Projected ROI</h3>
            <p className="text-2xl font-bold text-green-700">{objective.roi_estimate}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 📋 PAGE STRUCTURE

```tsx
// app/objectives/[id]/page.tsx
export default async function ObjectivePage({ params }) {
  const supabase = createServerClient();
  
  // Fetch all 3 objectives (per pillar) untuk project ini
  const { data: objectives } = await supabase
    .from('seo_objectives')
    .select('*')
    .eq('id', params.id);
  
  const technical = objectives?.find(o => o.pillar === 'technical');
  const contentKeyword = objectives?.find(o => o.pillar === 'content_keyword');
  const businessImpact = objectives?.find(o => o.pillar === 'business_impact');
  
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <ObjectiveHeader projectId={projectId} diagnosisId={diagnosisId} />
      
      <TechnicalPillar projectId={projectId} objectiveId={technical?.id} />
      <ContentKeywordPillar objective={contentKeyword} />
      <BusinessImpactPillar objective={businessImpact} />
      
      {/* Sidebar minimized */}
      <div className="fixed right-4 top-20 w-64 hidden lg:block">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" size="sm">
              Regenerate Objective
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              View Diagnosis
            </Button>
            <Button variant="ghost" className="w-full" size="sm">
              <Info className="h-4 w-4 mr-1" /> Risk Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 📋 SYNC TECHNICAL PILLAR ↔ DIAGNOSIS

**Critical**: Technical pillar di Objective page **HARUS** sync dengan checklist di Diagnosis page.

**Implementation**:
1. Pakai same hook `useTechnicalErrors(projectId)` di kedua page
2. Update status via API endpoint yang sama: `PATCH /api/projects/[id]/technical-errors/[errorId]`
3. Supabase Realtime subscription: kalau ada update di `technical_errors`, kedua page auto re-render

```typescript
// hooks/useTechnicalErrors.ts
export function useTechnicalErrors(projectId: string) {
  const supabase = createClient();
  const { data, mutate } = useSWR(
    `technical_errors_${projectId}`,
    async () => {
      const { data } = await supabase
        .from('technical_errors')
        .select('*')
        .eq('project_id', projectId)
        .order('severity', { ascending: false });
      return data;
    }
  );
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`technical_errors:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'technical_errors',
        filter: `project_id=eq.${projectId}`
      }, () => mutate())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);
  
  return { data: data || [], mutate };
}
```

## ✅ ACCEPTANCE CRITERIA

- [ ] Halaman objective show 3 pillar yang clearly labeled
- [ ] Pillar 1 (Technical): show checklist + progress bar
- [ ] Pillar 1: status checkbox sync dengan Diagnosis page (test buka 2 tab)
- [ ] Pillar 1: items grouped by severity (Critical, High, Medium, Low, Fixed)
- [ ] Pillar 2 (Content & Keyword): show SMART objective + action items + target metrics
- [ ] Pillar 3 (Business Impact): show SMART objective + target metrics dengan baseline → target + ROI
- [ ] HAPUS: Achievability card di header, Avoid Actions, verbose Risk Notes
- [ ] Link "View in Diagnosis" berfungsi
- [ ] Loading states + empty states + error states
- [ ] Responsive design
- [ ] Bilingual (ID/EN)

## 🛠️ DELIVERABLE

1. 3 pillar component files di `app/objectives/[id]/pillars/`
2. Updated main page: `app/objectives/[id]/page.tsx`
3. Hook `useTechnicalErrors` shared dengan Diagnosis page
4. Realtime subscription setup
5. Helper functions: `getEstimatedEffort`, `formatLabel`, `calcGrowth`

## ⚠️ IMPORTANT

- Technical pillar items HARUS sync real-time dengan Diagnosis
- JANGAN duplicate data — single source of truth (`technical_errors` table)
- JANGAN ubah n8n workflow dulu — Phase 5
- Existing objective data harus tetap render (graceful degradation)

Mulai dari struktur page + Pillar 1 (Technical), test sync dengan Diagnosis, lalu Pillar 2 dan 3.

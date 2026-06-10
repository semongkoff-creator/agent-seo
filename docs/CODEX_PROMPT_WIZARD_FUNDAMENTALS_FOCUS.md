## CONTEXT SPESIFIK SAYA

Project: SEO Agent V2
Production URL: agent-seo-eight.vercel.app
Test Project: Kaitech (ID: f6682438-e267-4939-9ed8-aac730992315)
n8n Workflow: identify-problem di lab.hellobotkilat.my.id

Goal MVP:
- Wizard simplified jadi 3 steps (fundamentals)
- Submit di Step 3 → trigger AI diagnosis
- Step 4-6 di-hide tapi code tetap ada (future-proof)

n8n Workflow Update:
- AI prompt harus handle missing Step 4-6 data gracefully
- Output diagnosis fokus ke technical issues
- Don't crash dengan empty arrays

# 🚀 PROMPT: Wizard Scope Reduction — Focus Step 1-3 (Fundamentals)

## 🎭 PERSONA

Anda adalah **Senior Fullstack Engineer** dengan pengalaman:
- Next.js 14 App Router + TypeScript
- Feature flag implementation (toggle features tanpa code removal)
- Backward-compatible refactoring
- Database schema migration safe untuk production
- AI prompt engineering (n8n workflows)

Anda paham bahwa **"hide" ≠ "delete"**. Code Step 4-6 harus tetap utuh untuk re-enable di future, tapi tidak terlihat di UI dan tidak required untuk submission.

---

## 📌 CONTEXT

**Project**: SEO Agent V2 — AI-powered SEO diagnosis platform.

**Tech Stack**:
- Frontend: Next.js 14 App Router (TypeScript) di Vercel
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL
- AI: n8n workflow dengan OpenAI gpt-4o-mini
- Webhook: `lab.hellobotkilat.my.id/webhook/seo-agent/identify-problem`

**Current Wizard State**:
```
6-step wizard untuk identify problem:
1. Project Context     ✅ Keep
2. Website Snapshot    ✅ Keep
3. Technical Signals   ✅ Keep (final step)
4. Demand & Relevance  ⏸️ Hide (keywords)
5. Authority Profile   ⏸️ Hide (backlinks)
6. Conversion Signals  ⏸️ Hide (goals)
```

**Decision Context**:
- Hasil meeting hari minggu: **fokus ke fundamentals (Step 1-3) dulu**
- Step 4-6 (advanced) akan dibuka **nanti**, setelah Step 1-3 stable
- User MVP cukup dari data: project info + website snapshot + technical signals

**Important Constraints**:
- ❌ JANGAN hapus code Step 4-6 (akan dibalikin nanti)
- ❌ JANGAN hapus kolom DB yang related ke Step 4-6
- ✅ Hide via feature flag (toggle on/off)
- ✅ n8n workflow tetap handle missing data Step 4-6 gracefully
- ✅ Existing diagnoses (yang udah submit dengan 6 steps) tetap render

---

## 🎯 TASK

Implement **Wizard Scope Reduction** dengan approach feature flag:

1. Wizard sidebar show **3 steps only** (1, 2, 3)
2. Progress indicator: **"3/3"** instead of **"3/6"**
3. Submit button (Generate Diagnosis) muncul di **Step 3**
4. Step 4-6 components tetap ada di codebase tapi **inaccessible via UI**
5. n8n workflow handle missing data dari Step 4-6 dengan default values
6. Future toggle: bisa enable balik Step 4-6 dengan flip env var

---

## 📋 DETAIL IMPLEMENTASI

### 1. ENVIRONMENT VARIABLES

Tambah di Vercel + `.env.local`:

```bash
# Feature flag untuk wizard scope
NEXT_PUBLIC_WIZARD_EXTENDED_STEPS=false
# Set true kalau mau enable balik Step 4-6
```

### 2. FEATURE FLAG SYSTEM

#### File Baru: `lib/feature-flags.ts`

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  /**
   * Show extended wizard steps (4-6: Demand, Authority, Conversion)
   * Set to false untuk MVP focus fundamentals (Step 1-3 only)
   */
  wizardExtendedSteps: process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS === 'true',
} as const;

/**
 * Get list of visible wizard steps based on feature flags
 */
export function getVisibleWizardSteps(): number[] {
  if (FEATURES.wizardExtendedSteps) {
    return [1, 2, 3, 4, 5, 6];
  }
  return [1, 2, 3];
}

/**
 * Get final step number (last visible step where submit button appears)
 */
export function getFinalWizardStep(): number {
  const steps = getVisibleWizardSteps();
  return Math.max(...steps);
}

/**
 * Check if a specific step is visible
 */
export function isStepVisible(stepNumber: number): boolean {
  return getVisibleWizardSteps().includes(stepNumber);
}
```

### 3. WIZARD COMPONENT UPDATES

Identify file utama wizard. Kemungkinan path:
- `app/projects/[id]/identify/page.tsx`
- `app/projects/[id]/identify/components/WizardLayout.tsx`
- `app/projects/[id]/identify/components/WizardSidebar.tsx`

#### A. Update Wizard Sidebar (Steps Navigation)

```tsx
// app/projects/[id]/identify/components/WizardSidebar.tsx
'use client';
import { getVisibleWizardSteps } from '@/lib/feature-flags';

const ALL_STEPS = [
  { 
    number: 1, 
    title: 'Project Context', 
    description: 'Tell us what the site sells',
    path: 'step/1'
  },
  { 
    number: 2, 
    title: 'Website Snapshot', 
    description: 'Confirm the website stage',
    path: 'step/2'
  },
  { 
    number: 3, 
    title: 'Technical Signals', 
    description: 'Capture crawl and rendering health',
    path: 'step/3'
  },
  // Step 4-6 tetap ada di array, di-filter via feature flag
  { 
    number: 4, 
    title: 'Demand & Relevance', 
    description: 'Map keywords to intent and opportunity',
    path: 'step/4'
  },
  { 
    number: 5, 
    title: 'Authority Profile', 
    description: 'Tell us about the brand and backlink gap',
    path: 'step/5'
  },
  { 
    number: 6, 
    title: 'Conversion Signals', 
    description: 'Finish with conversion context',
    path: 'step/6'
  }
];

export function WizardSidebar({ projectId, currentStep }: Props) {
  const visibleSteps = getVisibleWizardSteps();
  const steps = ALL_STEPS.filter(step => visibleSteps.includes(step.number));
  
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <StepCard
          key={step.number}
          step={step}
          isActive={currentStep === step.number}
          isCompleted={currentStep > step.number}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
```

#### B. Update Progress Indicator

Find component yang display "Step X of Y" atau "Progress 3/6":

```tsx
// components/WizardProgress.tsx or wherever progress is shown
import { getVisibleWizardSteps } from '@/lib/feature-flags';

const totalSteps = getVisibleWizardSteps().length;  // 3 atau 6

return (
  <div className="text-sm">
    <span className="font-bold">{currentStep}</span> / {totalSteps}
  </div>
);
```

#### C. Update Step 3 Component (Add Submit Button)

Saat ini Step 3 punya tombol "Next". Update jadi conditional:
- Kalau Step 3 = final step → tombol "Generate Diagnosis" (submit)
- Kalau Step 3 ≠ final step (extended mode) → tombol "Next" (lanjut Step 4)

```tsx
// app/projects/[id]/identify/components/WizardStep3.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getFinalWizardStep } from '@/lib/feature-flags';
import { Sparkles, ArrowRight } from 'lucide-react';

export function WizardStep3Content({ projectId, formData }: Props) {
  const router = useRouter();
  const finalStep = getFinalWizardStep();
  const isFinalStep = finalStep === 3;
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Trigger diagnosis (existing logic untuk Step 6 submit)
      const response = await fetch(`/api/projects/${projectId}/diagnoses`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          // Default values untuk Step 4-6 (yang di-hide)
          target_keywords: formData.target_keywords || [],
          competitors: formData.competitors || [],
          conversion_goals: formData.conversion_goals || []
        })
      });
      
      if (!response.ok) throw new Error('Failed to create diagnosis');
      
      const { diagnosis_id } = await response.json();
      router.push(`/projects/${projectId}/diagnoses/${diagnosis_id}`);
    } catch (error) {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNext = () => {
    router.push(`/projects/${projectId}/identify/step/4`);
  };
  
  return (
    <div className="space-y-6">
      {/* Existing Step 3 content (sitemap, robots, technical errors) */}
      <Step3FormContent formData={formData} />
      
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        
        {isFinalStep ? (
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            {submitting ? 'Generating Diagnosis...' : 'Generate Diagnosis'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### D. Block Direct URL Access ke Step 4-6

Kalau user manual navigate ke `/projects/[id]/identify/step/4`, redirect ke Step 3.

```tsx
// app/projects/[id]/identify/step/[number]/page.tsx (atau wherever step routing handled)
import { redirect } from 'next/navigation';
import { isStepVisible, getFinalWizardStep } from '@/lib/feature-flags';

export default function StepPage({ params }: { params: { number: string } }) {
  const stepNumber = parseInt(params.number);
  
  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 6) {
    redirect(`/projects/${params.id}/identify/step/1`);
  }
  
  // Block access to hidden steps
  if (!isStepVisible(stepNumber)) {
    redirect(`/projects/${params.id}/identify/step/${getFinalWizardStep()}`);
  }
  
  // Render step component
  return <StepContent stepNumber={stepNumber} {...props} />;
}
```

### 4. DATABASE COMPATIBILITY

#### Verify Schema (No Migration Needed Kalau Sudah Nullable)

Cek schema `diagnoses` table:
```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' 
  AND column_name IN ('target_keywords', 'competitors', 'conversion_goals');
```

Expected: semua `is_nullable = YES`.

Kalau ada yang NOT NULL, run migration:
```sql
-- Hanya kalau perlu (kemungkinan udah nullable)
ALTER TABLE diagnoses ALTER COLUMN target_keywords DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN competitors DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN conversion_goals DROP NOT NULL;
```

#### Set Default Values di Backend

Update endpoint create diagnosis untuk auto-fill default kalau Step 4-6 data kosong:

```typescript
// app/api/projects/[id]/diagnoses/route.ts
import { FEATURES } from '@/lib/feature-flags';

export async function POST(req: NextRequest, { params }: Props) {
  const body = await req.json();
  
  const diagnosisData = {
    project_id: params.id,
    user_id: user.id,
    
    // Step 1-3 data (required)
    project_context: body.project_context,
    website_stage: body.website_stage,
    sitemap_url: body.sitemap_url,
    robots_url: body.robots_url,
    crawl_errors_count: body.crawl_errors_count,
    core_web_vitals_pass: body.core_web_vitals_pass,
    
    // Step 4-6 data (optional saat extended steps disabled)
    target_keywords: body.target_keywords || [],
    competitors: body.competitors || [],
    conversion_goals: body.conversion_goals || [],
    
    // Metadata
    wizard_version: FEATURES.wizardExtendedSteps ? 'extended' : 'fundamental',
    
    status: 'pending'
  };
  
  // Save to DB and trigger n8n
  // ...
}
```

### 5. N8N WORKFLOW UPDATE

#### Update AI Prompt untuk Handle Missing Data

Buka n8n workflow `identify-problem`. Cari node **AI Agent** yang punya prompt.

**Current prompt** kemungkinan butuh:
- target_keywords
- competitors  
- conversion_goals

**Update prompt** untuk handle gracefully:

```
You are an SEO diagnosis expert.

ANALYSIS CONTEXT:
- Project: {{ $json.project_name }}
- Website: {{ $json.website_url }}
- Website Stage: {{ $json.website_stage }}
- Sitemap URL: {{ $json.sitemap_url }}
- Robots URL: {{ $json.robots_url }}

TECHNICAL SIGNALS:
- Crawl errors: {{ $json.crawl_errors_count }}
- Core Web Vitals: {{ $json.core_web_vitals_pass ? 'PASS' : 'FAIL' }}
- Technical errors detected: {{ JSON.stringify($json.technical_errors) }}

OPTIONAL CONTEXT (mungkin kosong untuk MVP):
- Target keywords: {{ $json.target_keywords?.length > 0 ? JSON.stringify($json.target_keywords) : 'Not provided (skip keyword analysis)' }}
- Competitors: {{ $json.competitors?.length > 0 ? JSON.stringify($json.competitors) : 'Not provided (skip competitor analysis)' }}
- Conversion goals: {{ $json.conversion_goals?.length > 0 ? JSON.stringify($json.conversion_goals) : 'Not provided (focus on technical issues)' }}

INSTRUCTIONS:
1. Analyze the data above
2. If "Not provided" appears, skip that section and focus on what IS available
3. Prioritize: technical issues > content > authority > conversion
4. For MVP/fundamentals mode (when keywords/competitors/goals are empty), 
   focus 100% on technical diagnosis based on Step 1-3 data

OUTPUT FORMAT:
{
  "problem_summary": "...",
  "severity": "low|medium|high|critical",
  "technical_issues": [...],
  "content_issues": [...] // optional, kalau ada data
  "competitor_gaps": [...] // optional, kalau ada data
  "conversion_blockers": [...] // optional, kalau ada data
  "recommendations": [...]
}
```

#### Handle Empty Arrays di n8n

Di node **Function** atau **Code** sebelum AI Agent, validate input:

```javascript
// Function node: normalize input
const input = $input.item.json;

// Set defaults for missing fields
const normalized = {
  ...input,
  target_keywords: input.target_keywords || [],
  competitors: input.competitors || [],
  conversion_goals: input.conversion_goals || [],
  is_fundamentals_mode: !input.target_keywords?.length 
                    && !input.competitors?.length 
                    && !input.conversion_goals?.length
};

return [{ json: normalized }];
```

### 6. UI POLISH

#### A. Update Right Sidebar Info Card

Saat ini ada card "Flow Snapshot" dengan info "n8n runs in the background". Update text untuk reflect new flow:

```tsx
// components/InfoSidebar.tsx
<Card>
  <CardHeader>Flow Snapshot</CardHeader>
  <CardContent>
    <ol>
      <li>1. Draft autosaves to Supabase</li>
      <li>2. Final submit at <strong>Step 3</strong> creates diagnosis + job</li>
      <li>3. n8n runs in the background</li>
      <li>4. Results are written to Supabase and the diagnosis page reads them</li>
    </ol>
  </CardContent>
</Card>
```

#### B. Update "Generate Diagnosis" Button Style

Make it look final dan exciting:

```tsx
<Button 
  onClick={handleSubmit} 
  disabled={submitting}
  size="lg"
  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
>
  <Sparkles className="w-5 h-5 mr-2" />
  {submitting ? (
    <>
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      Generating Diagnosis...
    </>
  ) : (
    'Generate Diagnosis'
  )}
</Button>
```

#### C. Confirmation Dialog Sebelum Submit

Optional tapi recommended:

```tsx
<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Ready to Generate Diagnosis?</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      AI akan analyze data berikut:
      <ul className="mt-3 space-y-1 text-sm">
        <li>✅ Project context</li>
        <li>✅ Website snapshot</li>
        <li>✅ Technical signals ({errorsCount} issues detected)</li>
      </ul>
      <p className="mt-3 text-muted-foreground">
        Diagnosis akan available dalam 1-3 menit.
      </p>
    </DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Now
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 7. BACKWARDS COMPATIBILITY

#### Existing Diagnoses (Submitted dengan 6 Steps)

User mungkin punya diagnosis lama yang submit dengan data Step 4-6 lengkap. Saat lihat di Diagnosis page, harus tetap render dengan baik:

```tsx
// app/projects/[id]/diagnoses/[diagnosisId]/page.tsx
// Existing render logic should work as-is
// Step 4-6 data masih tersimpan di DB, masih bisa di-display

// Tambah indicator (optional):
{diagnosis.wizard_version === 'fundamental' && (
  <Alert>
    <Info className="w-4 h-4" />
    <AlertDescription>
      Diagnosis ini fokus ke technical fundamentals. 
      Advanced analysis (keywords, competitors, conversion) akan dibuka di update mendatang.
    </AlertDescription>
  </Alert>
)}
```

---

## ✅ ACCEPTANCE CRITERIA

### Functional
- [ ] Wizard sidebar hanya show 3 steps (1, 2, 3)
- [ ] Progress indicator: "3/3" (bukan "3/6")
- [ ] Step 3 punya tombol "Generate Diagnosis" (bukan "Next")
- [ ] Klik "Generate Diagnosis" submit form + redirect ke diagnosis page
- [ ] Manual URL `/identify/step/4` redirect ke `/identify/step/3`
- [ ] Manual URL `/identify/step/5` redirect ke `/identify/step/3`
- [ ] Manual URL `/identify/step/6` redirect ke `/identify/step/3`
- [ ] Existing diagnoses (lama) tetap render normal
- [ ] Feature flag `NEXT_PUBLIC_WIZARD_EXTENDED_STEPS=true` kembalikan 6 steps

### Database
- [ ] Step 4-6 fields di `diagnoses` table tetap ada (nullable)
- [ ] Saat submit dari Step 3: fields Step 4-6 di-set default (`[]` atau null)
- [ ] Kolom `wizard_version` tracked (fundamental vs extended)

### n8n Workflow
- [ ] AI prompt handle empty Step 4-6 data gracefully
- [ ] Diagnosis tetap generate (gak crash) meski tanpa keywords/competitors/goals
- [ ] Output diagnosis lebih fokus ke technical issues saat fundamentals mode

### UI/UX
- [ ] Step 3 sebagai "final step" feels natural (button styling, confirmation)
- [ ] Right sidebar info card update text
- [ ] Loading state saat generate diagnosis
- [ ] Error handling kalau diagnosis gagal
- [ ] Bilingual (ID/EN) consistent

### Code Quality
- [ ] No deleted code untuk Step 4-6 (tetap di repo, di-skip via feature flag)
- [ ] TypeScript types tetap support 6 steps
- [ ] Tests untuk feature flag logic (kalau ada test suite)

---

## 🛠️ DELIVERABLE

1. **Feature flag system** (`lib/feature-flags.ts`)
2. **Updated Wizard Sidebar** (filter steps by visibility)
3. **Updated Step 3 component** (conditional submit button)
4. **Route guard** untuk hidden steps (auto-redirect)
5. **API endpoint update** (default values untuk Step 4-6 fields)
6. **n8n workflow update** (handle empty data gracefully)
7. **UI polish** (button styling, confirmation dialog, info text)
8. **Backwards compatibility** (existing diagnoses tetap render)
9. **Env var documentation** (NEXT_PUBLIC_WIZARD_EXTENDED_STEPS)
10. **Testing**: E2E Kaitech submit dari Step 3

---

## 🧪 TESTING SCENARIOS

### Test 1: Default Behavior (Fundamentals Mode)

```
1. Set NEXT_PUBLIC_WIZARD_EXTENDED_STEPS=false
2. Restart dev server
3. Buka project Kaitech → Identify
4. Verify:
   ✅ Sidebar show 3 steps only
   ✅ Step 1 → 2 → 3 navigation works
   ✅ Step 3 show "Generate Diagnosis" button
   ✅ Progress "1/3", "2/3", "3/3"
5. Manual URL: /identify/step/4
   ✅ Redirect to /identify/step/3
6. Fill data Step 1-3, klik "Generate Diagnosis"
   ✅ Submit success
   ✅ Redirect ke diagnosis page
   ✅ AI generate output (mungkin lebih singkat tanpa keywords/competitors)
```

### Test 2: Extended Mode (Future-proofing)

```
1. Set NEXT_PUBLIC_WIZARD_EXTENDED_STEPS=true
2. Restart dev server
3. Buka project, verify:
   ✅ Sidebar show 6 steps
   ✅ Progress "1/6", "2/6"...
   ✅ Step 3 show "Next" button (bukan submit)
   ✅ Bisa navigate ke Step 4, 5, 6
   ✅ Submit di Step 6
```

### Test 3: n8n Handle Empty Data

```
1. Fundamentals mode, submit diagnosis
2. Check di n8n execution log
3. Verify AI prompt receive data dengan:
   - target_keywords: []
   - competitors: []
   - conversion_goals: []
4. Verify AI output:
   ✅ No error
   ✅ Focus on technical issues
   ✅ Skip keyword/competitor sections
```

### Test 4: Backwards Compatibility

```
1. Sebelum implement, submit diagnosis dengan 6 steps lengkap
2. Implement feature flag changes
3. Buka diagnosis lama
4. Verify:
   ✅ Diagnosis render normal
   ✅ Data Step 4-6 masih ada di DB
   ✅ Display lengkap (gak hilang section)
```

### Test 5: Database Integrity

```
1. Submit 5 diagnoses dengan fundamentals mode
2. Query DB:
   SELECT id, wizard_version, target_keywords, competitors 
   FROM diagnoses 
   ORDER BY created_at DESC LIMIT 5;
3. Verify:
   ✅ wizard_version = 'fundamental'
   ✅ target_keywords = []
   ✅ competitors = []
   ✅ Step 1-3 data lengkap
```

---

## ⚠️ CRITICAL NOTES

### MUST DO

1. **Feature Flag, NOT Code Removal**
   - Step 4-6 components TETAP ADA di repo
   - Cuma di-hide via UI
   - Lo bisa balikin dengan flip env var

2. **n8n Prompt Update Critical**
   - Tanpa update, AI mungkin crash karena expect data Step 4-6
   - Test dengan empty arrays sebelum production

3. **Backwards Compatibility**
   - Existing diagnoses harus tetap work
   - Database schema tetap support semua 6 steps fields

4. **Default Values**
   - Kosong/null/empty array untuk Step 4-6 fields
   - Konsistent across all submission paths

### DO NOT

- ❌ Hapus code Step 4-6 (akan dibalikin nanti)
- ❌ Drop kolom DB yang related ke Step 4-6
- ❌ Hardcode `totalSteps = 3` (pakai feature flag function)
- ❌ Skip n8n update (bisa break diagnosis generation)
- ❌ Force `wizard_extended_steps = false` di code (selalu pakai env var)

### COMMON ISSUES

1. **AI Diagnosis Output Empty**:
   - Cause: AI prompt expect data Step 4-6, tapi terima empty
   - Fix: Update prompt untuk handle empty gracefully (lihat section 5)

2. **Submit Button Tidak Muncul di Step 3**:
   - Cause: Logic `isFinalStep` salah
   - Fix: Verify `getFinalWizardStep()` return 3 saat flag false

3. **Redirect Loop**:
   - Cause: Step 4-6 redirect ke Step yang juga hidden
   - Fix: Selalu redirect ke `getFinalWizardStep()` (return visible step)

4. **Database Insert Error**:
   - Cause: NOT NULL constraint di kolom Step 4-6
   - Fix: ALTER TABLE drop NOT NULL atau provide defaults

---

## 📚 REFERENCES

- Feature Flag Pattern: https://martinfowler.com/articles/feature-toggles.html
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- Conditional Routing: https://nextjs.org/docs/app/building-your-application/routing/redirecting

---

## 🎬 IMPLEMENTATION ORDER

**Day 1**:
- Feature flag system (lib/feature-flags.ts)
- Update Wizard Sidebar (filter steps)
- Update Progress Indicator

**Day 2**:
- Update Step 3 (submit button conditional)
- Route guard untuk hidden steps
- Test navigation flow

**Day 3**:
- Update API endpoint (default values)
- Update n8n workflow (handle empty data)
- Test E2E dengan Kaitech

**Total**: 2-3 hari kerja

---

## 🎯 EXPECTED FINAL STATE

### UI After Implementation

```
SIDEBAR:
┌─────────────────────────────┐
│ ✅ STEP 1                    │
│    Project Context           │
├─────────────────────────────┤
│ ✅ STEP 2                    │
│    Website Snapshot          │
├─────────────────────────────┤
│ 🔵 STEP 3 (CURRENT)          │
│    Technical Signals         │
│    [Generate Diagnosis] →    │
└─────────────────────────────┘

PROGRESS: 3 / 3
```

### Database After Submit

```sql
SELECT 
  id, 
  wizard_version,
  jsonb_array_length(target_keywords::jsonb) as keyword_count,
  jsonb_array_length(competitors::jsonb) as competitor_count
FROM diagnoses 
WHERE project_id = 'f6682438-...';

-- Expected:
-- id        | wizard_version | keyword_count | competitor_count
-- ----------|----------------|---------------|------------------
-- 1df91...  | fundamental    | 0             | 0
```

### n8n Behavior

```
Input ke AI Agent:
- Step 1-3 data: LENGKAP
- Step 4-6 data: [] (empty arrays)

AI Output:
- Focus 100% pada technical issues
- Skip keyword & competitor analysis
- Recommendation actionable berdasarkan Step 1-3
```

---

**Implement dengan feature flag approach. Nanti saat ready expand ke 6 steps, tinggal flip env var `NEXT_PUBLIC_WIZARD_EXTENDED_STEPS=true`. Zero code rewrite needed.**

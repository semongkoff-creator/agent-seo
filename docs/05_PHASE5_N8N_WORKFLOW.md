# 🚀 PHASE 5: n8n Workflow Updates (SEO Agent V2)

## 🎭 PERSONA
Anda adalah **Senior AI Engineer + SEO Strategist** dengan 10 tahun pengalaman membangun AI orchestration di production. Expert di LangChain, n8n, OpenAI prompt engineering, dan domain SEO (technical, content, AI Overview).

## 📌 CONTEXT
SEO Agent V2 — workflow Identify Problem dan Define Objective perlu di-update untuk handle:
1. New input structure (technical_errors array, gsc_data, ga4_data, ai_visibility)
2. New output schema (technical_health_score, ai_visibility_score, 3 separate objectives per pillar)

Phase 1-4 sudah selesai. Database schema + FE updated. Sekarang AI workflow harus catch up.

## 🎯 TASK
Update 2 n8n workflow:
1. **Workflow Identify Problem** — terima new input, generate diagnosis dengan 4-section structure
2. **Workflow Define Objective** — generate 3 objectives (one per pillar)

## 📋 WORKFLOW 1: IDENTIFY PROBLEM

### Tambah Node Baru (Sebelum AI Agent)

**Node 1: Fetch Mock GSC Data**
- Type: `n8n-nodes-base.supabase`
- Operation: Get All Rows
- Table: `gsc_metrics`
- Filter: `project_id eq {{ $('Normalize Payload').first().json.project_id }}`

**Node 2: Fetch Mock GA4 Data**
- Sama, tapi table: `ga4_metrics`

**Node 3: Fetch Technical Errors**
- Sama, tapi table: `technical_errors`
- Filter: `project_id eq <id> AND status neq fixed`

**Node 4: Fetch AI Visibility Metrics**
- Sama, tapi table: `ai_visibility_metrics`

**Node 5: Merge Data**
- Type: `n8n-nodes-base.code`
- Purpose: Combine semua mock data jadi single payload untuk AI

```javascript
const flow = $('Verify HMAC (DEV)').first().json;
const gsc = $('Fetch Mock GSC Data').all();
const ga4 = $('Fetch Mock GA4 Data').all();
const errors = $('Fetch Technical Errors').all();
const aiVis = $('Fetch AI Visibility Metrics').all();

// Aggregate GSC metrics
const gscData = {};
for (const row of gsc) {
  gscData[row.json.metric_type] = row.json.metric_value;
}

// Aggregate GA4 metrics
const ga4Data = {};
for (const row of ga4) {
  ga4Data[row.json.metric_type] = row.json.metric_value;
}

// Group AI visibility by engine
const aiByEngine = { gemini: [], chatgpt: [] };
for (const row of aiVis) {
  if (aiByEngine[row.json.engine]) {
    aiByEngine[row.json.engine].push({
      keyword: row.json.keyword,
      visibility_score: row.json.visibility_score,
      detection_rate: row.json.detection_rate,
      top3_visibility: row.json.top3_visibility,
      avg_position: row.json.avg_position
    });
  }
}

// Aggregate AI visibility scores
const aiVisibilitySummary = {
  gemini: {
    avg_visibility: Math.round(aiByEngine.gemini.reduce((acc, x) => acc + x.visibility_score, 0) / (aiByEngine.gemini.length || 1)),
    keywords: aiByEngine.gemini
  },
  chatgpt: {
    avg_visibility: Math.round(aiByEngine.chatgpt.reduce((acc, x) => acc + x.visibility_score, 0) / (aiByEngine.chatgpt.length || 1)),
    keywords: aiByEngine.chatgpt
  }
};

// Technical errors summary
const technicalErrors = errors.map(r => ({
  source: r.json.source,
  error_type: r.json.error_type,
  error_count: r.json.error_count,
  severity: r.json.severity,
  affected_urls: r.json.affected_urls
}));

return [{
  json: {
    ...flow,
    enriched_data: {
      gsc: gscData,
      ga4: ga4Data,
      technical_errors: technicalErrors,
      ai_visibility: aiVisibilitySummary
    }
  }
}];
```

Node ini disambungkan ke AI Agent.

### Update AI Agent: System Prompt Baru

**New System Prompt untuk Identify Problem**:

```
You are an SEO diagnostic agent V2. Your job: analyze website signals INCLUDING 
auto-fetched data (GSC, GA4, technical errors, AI visibility) to produce a 
diagnosis structured into 4 sections.

INPUT STRUCTURE:
{
  "brief": { /* user-input wizard data */ },
  "enriched_data": {
    "gsc": { indexed_pages, impressions, avg_ctr },
    "ga4": { session, page_view, engagement_rate, visitor },
    "technical_errors": [{ source, error_type, error_count, severity, affected_urls }],
    "ai_visibility": {
      "gemini": { avg_visibility, keywords },
      "chatgpt": { avg_visibility, keywords }
    }
  }
}

Return ONLY valid JSON (no markdown fences, no prose).

REQUIRED JSON SCHEMA:
{
  "primary_problem_type": "<enum>",
  "severity": "<enum>",
  "confidence_score": <0-100>,
  "diagnosis_summary": "<1 sentence>",
  
  "technical_health_score": <0-100>,
  "ai_visibility_score": <0-100>,
  
  "technical_section": {
    "summary": "<1-2 sentences>",
    "critical_issues": ["<issue 1>", "<issue 2>"],
    "checklist_priority": ["<error_type 1>", "<error_type 2>"]
  },
  
  "keyword_section": {
    "summary": "<1-2 sentences>",
    "top_opportunities": [
      { "keyword": "...", "current_position": 25, "opportunity": "Move to top 10" }
    ]
  },
  
  "ai_overview_section": {
    "summary": "<1-2 sentences about AI Overview visibility>",
    "gemini_insights": "<text>",
    "chatgpt_insights": "<text>",
    "recommendation": "<action to improve AI visibility>"
  },
  
  "business_impact_section": {
    "summary": "<1 sentence>",
    "metrics": [
      { "label": "<metric>", "current_value": "<value>", "potential_value": "<value>", "gap": "<gap>" }
    ]
  },
  
  "recommended_next_step": "<action>",
  "objective_direction": "<enum>",
  "model_used": "gpt-4o-mini"
}

ENUMS (STRICT):
- primary_problem_type: technical_bottleneck | relevance_gap | authority_deficit | 
  conversion_pitfall | from_scratch | ai_visibility_gap | mixed
- severity: low | medium | high | critical
- objective_direction: technical_recovery | qualified_traffic | authority_growth | 
  conversion_improvement | foundation_building | ai_visibility_improvement | mixed

NEW: technical_bottleneck/ai_visibility_gap baru ditambah karena pivot V2

SCORING RULES:

technical_health_score (0-100):
- Start at 100
- For each error in technical_errors array:
  - Critical severity: -10 per occurrence
  - High severity: -5 per occurrence
  - Medium severity: -2 per occurrence
  - Low severity: -1 per occurrence
- Clamp to 0-100

ai_visibility_score (0-100):
- Average of (gemini.avg_visibility + chatgpt.avg_visibility) / 2
- Weight Gemini more (60%) karena Google SGE dominant
- Final = gemini.avg * 0.6 + chatgpt.avg * 0.4

CLASSIFICATION RULES UPDATED:
- technical_bottleneck: technical_health_score < 50
- ai_visibility_gap: ai_visibility_score < 40 (NEW)
- relevance_gap: indexed >= 30% BUT ranking brand-only
- authority_deficit: DR gap > 15 (legacy support)
- conversion_pitfall: traffic > 500 AND CR < 1%
- from_scratch: indexed=0 AND published=0
- mixed: 2+ categories strong

CRITICAL ISSUES RANKING:
For technical_section.critical_issues, list top 5 errors by severity*count.
Format: "<error_type> (<count> occurrences from <source>)"

KEYWORD OPPORTUNITIES:
For keyword_section.top_opportunities, list keywords currently at position 11-30 
(easy wins). Order by search volume descending. Max 10 items.

AI OVERVIEW INSIGHTS:
- If ai_visibility_score < 30: emphasize urgency
- If gemini better than chatgpt by 20+: note Google SGE strength
- If chatgpt better than gemini by 20+: note traditional search optimization needed
- Recommendation should be specific: "Build EEAT signals", "Get featured in Wikipedia", etc.

BUSINESS IMPACT METRICS:
Pick 3-5 metrics from ga4 data. Compute "gap" as the difference between current 
and benchmark (industry average).

Do NOT propose objectives/strategies — that's Step 2 workflow.
```

### Update Node: Normalize Diagnosis Result

Update untuk parse new schema:

```javascript
const flow = $('Verify HMAC (DEV)').first().json;
const aiOutput = $input.first().json;

let parsed;
try {
  parsed = JSON.parse(aiOutput.output);
} catch {
  // Fallback parsing
}

// Validate enums
const VALID_PROBLEMS = ['technical_bottleneck', 'relevance_gap', 'authority_deficit', 
                        'conversion_pitfall', 'from_scratch', 'ai_visibility_gap', 'mixed'];
if (!VALID_PROBLEMS.includes(parsed.primary_problem_type)) {
  parsed.primary_problem_type = 'mixed';
}

// Compute scores fallback
parsed.technical_health_score = Math.max(0, Math.min(100, parsed.technical_health_score || 50));
parsed.ai_visibility_score = Math.max(0, Math.min(100, parsed.ai_visibility_score || 50));

return [{
  json: {
    job_id: flow.job_id,
    project_id: flow.project_id,
    diagnosis_id: flow.diagnosis_id,
    
    // Core fields (legacy compatibility)
    primary_problem_type: parsed.primary_problem_type,
    severity: parsed.severity,
    confidence_score: parsed.confidence_score,
    diagnosis_summary: parsed.diagnosis_summary,
    recommended_next_step: parsed.recommended_next_step,
    objective_direction: parsed.objective_direction,
    
    // NEW V2 fields
    technical_health_score: parsed.technical_health_score,
    ai_visibility_score: parsed.ai_visibility_score,
    
    // Sections (stored as JSONB)
    technical_section: parsed.technical_section,
    keyword_section: parsed.keyword_section,
    ai_overview_section: parsed.ai_overview_section,
    business_impact_section: parsed.business_impact_section,
    
    // Legacy fields (deprecated, keep for backward compat)
    evidence: [],  // empty, replaced by sections
    business_impact: parsed.business_impact_section,
    root_cause: parsed.technical_section?.summary,
    
    raw_llm_output: parsed,
    model_used: 'gpt-4o-mini',
    completed_at: new Date().toISOString()
  }
}];
```

### Update Node: Update seo_diagnoses

Add new fields ke mapping:
- `technical_health_score`
- `ai_visibility_score`
- `technical_section` (JSONB)
- `keyword_section` (JSONB)
- `ai_overview_section` (JSONB)
- `business_impact_section` (JSONB)

## 📋 WORKFLOW 2: DEFINE OBJECTIVE

### Update AI Agent: System Prompt Baru

**Penting**: Output sekarang HARUS generate **3 separate objectives** (satu per pillar).

```
You are an SEO strategy agent V2. Your job: generate 3 SMART objectives based on 
diagnosis result + business goal + constraints, organized by pillar:
1. Technical (priority 1 — dikerjakan duluan)
2. Content & Keyword
3. Business Impact

INPUT STRUCTURE:
{
  "diagnosis_snapshot": { /* including new V2 fields */ },
  "business_goal": { main_business_goal, business_target_value, target_period, ... },
  "seo_baseline": { /* from GA4/GSC mock */ },
  "constraints": { budget_level, content_capacity, ... },
  "technical_errors": [...]  // from technical_errors table
}

Return ONLY valid JSON (no markdown fences).

REQUIRED JSON SCHEMA:
{
  "objectives": [
    {
      "pillar": "technical",
      "smart_objective": "...",
      "checklist_summary": "Fix X critical and Y high priority issues within Z months",
      "estimated_completion": "<date>",
      "linked_technical_errors": ["<error_id>", "<error_id>"]
    },
    {
      "pillar": "content_keyword",
      "smart_objective": "...",
      "action_items": ["<action 1>", "<action 2>"],
      "target_metrics": {
        "keywords_top_20": { "baseline": 3, "target": 8, "unit": "keywords" },
        "indexed_pages": { "baseline": 45, "target": 60, "unit": "pages" }
      }
    },
    {
      "pillar": "business_impact",
      "smart_objective": "...",
      "target_metrics": {
        "monthly_organic_leads": { "baseline": 20, "target": 40, "unit": "leads/month" },
        "monthly_organic_traffic": { "baseline": 1500, "target": 2500, "unit": "visitors" },
        "engagement_rate": { "baseline": 45, "target": 55, "unit": "%" }
      },
      "roi_estimate": "Projected additional revenue: $5,000/month"
    }
  ],
  "raw_llm_output": { "reasoning": "..." },
  "model_used": "gpt-4o-mini"
}

PILLAR 1 (Technical):
- SMART formula: "Resolve <X> technical SEO issues (<critical/high count>) within <duration>"
- estimated_completion: based on capacity (assume 2-3 issues fixed per week)
- linked_technical_errors: reference IDs from technical_errors input

PILLAR 2 (Content & Keyword):
- SMART formula: must include keyword count + position movement + time
- action_items: MIN 3, MAX 5 — specific content/SEO actions
  Examples:
  • "Publish 4 SEO articles per month targeting [keyword cluster]"
  • "Optimize 6 existing pages for primary commercial keywords"
  • "Build internal linking structure across blog posts"
- target_metrics: 3-5 keyword-related metrics with baseline → target

PILLAR 3 (Business Impact):
- SMART formula: business-oriented, mention revenue/leads/conversion
- target_metrics: 3-4 business metrics with baseline → target
- roi_estimate: calculate based on (target leads - baseline leads) × average deal size
  Assume average B2B deal: $500-2000 depending on industry

CALIBRATION RULES (Realism):
Use constraints.budget_level + capacity to scale ambition:
- low budget + low capacity: +10-20% growth
- medium: +30-50% growth
- high: +50-100% growth

DA growth ceiling: max +8-12 points per 6 months (regardless of budget)
Keyword ranking: realistic 5-15 new top 20 keywords per 6 months

OUTPUT QUALITY:
Each pillar must have unique, specific content. Don't repeat generic SEO advice.
Reference specific keywords, URLs, errors from input data.
```

### Update Node: Normalize Objective Result

```javascript
const flow = $('Verify HMAC (DEV)').first().json;
const aiOutput = $input.first().json;

let parsed = JSON.parse(aiOutput.output);

// Validate: must have 3 objectives, one per pillar
const REQUIRED_PILLARS = ['technical', 'content_keyword', 'business_impact'];
if (!parsed.objectives || parsed.objectives.length !== 3) {
  throw new Error('AI must generate exactly 3 objectives (one per pillar)');
}

const objectivesByPillar = {};
for (const obj of parsed.objectives) {
  if (!REQUIRED_PILLARS.includes(obj.pillar)) {
    throw new Error(`Invalid pillar: ${obj.pillar}`);
  }
  objectivesByPillar[obj.pillar] = obj;
}

// Validate all 3 pillars present
for (const pillar of REQUIRED_PILLARS) {
  if (!objectivesByPillar[pillar]) {
    throw new Error(`Missing pillar: ${pillar}`);
  }
}

// Return for batch insert (3 rows, one per pillar)
return REQUIRED_PILLARS.map(pillar => ({
  json: {
    project_id: flow.project_id,
    diagnosis_id: flow.diagnosis_id,
    pillar,
    smart_objective: objectivesByPillar[pillar].smart_objective,
    action_items: objectivesByPillar[pillar].action_items || [],
    target_metrics: objectivesByPillar[pillar].target_metrics || {},
    checklist_summary: objectivesByPillar[pillar].checklist_summary,
    estimated_completion: objectivesByPillar[pillar].estimated_completion,
    linked_technical_errors: objectivesByPillar[pillar].linked_technical_errors,
    roi_estimate: objectivesByPillar[pillar].roi_estimate,
    raw_llm_output: parsed.raw_llm_output,
    model_used: 'gpt-4o-mini',
    completed_at: new Date().toISOString()
  }
}));
```

### Update Node: Insert seo_objectives

Operation: **Create Row** (multiple rows, satu per pillar)

Field mapping pakai field-field baru: `pillar`, `smart_objective`, `action_items` (JSONB), `target_metrics` (JSONB), dst.

## ✅ ACCEPTANCE CRITERIA

### Workflow Identify Problem
- [ ] 4 fetch nodes baru terhubung (GSC, GA4, errors, AI visibility)
- [ ] Merge Data node correctly combine semua mock data
- [ ] AI Agent terima new input structure
- [ ] Output diagnosis include: technical_health_score, ai_visibility_score, 4 sections
- [ ] seo_diagnoses table di-update dengan new fields
- [ ] Existing FE page diagnosis bisa render new output
- [ ] Test end-to-end dengan project KaitechSEO

### Workflow Define Objective
- [ ] AI Agent generate exactly 3 objectives (one per pillar)
- [ ] Validation throw error kalau pillar gak lengkap
- [ ] Insert 3 rows ke seo_objectives table (atau 1 row dengan JSONB array)
- [ ] Existing FE page objective bisa render 3 pillar
- [ ] Test end-to-end dengan project KaitechSEO

## 🛠️ DELIVERABLE

1. 2 file workflow JSON updated:
   - `workflow_identify_v2.json`
   - `workflow_define_objective_v2.json`
2. Updated AI Agent system prompts (di workflow JSON)
3. Test execution screenshots
4. Document changes di CHANGELOG.md

## ⚠️ IMPORTANT

- Backward compatibility: existing diagnosis records (yang udah ada di DB) tetap valid
- Mock data harus realistic untuk demo
- Test dengan project KaitechSEO sebelum production
- Update env var kalau ada (sebelumnya udah ada N8N_WEBHOOK_SECRET)
- JANGAN ubah webhook URL — frontend masih pakai URL yang sama

## 🧪 TESTING SCENARIO

### Test 1: Submit Identify dari FE
1. Buka /projects/[id]/identify dan isi wizard
2. Submit Step 6
3. Check n8n executions: harus jalan tanpa error
4. Check Supabase seo_diagnoses: technical_health_score, ai_visibility_score, sections terisi
5. Check FE /diagnosis/[id]: 4 section render dengan data

### Test 2: Submit Define Objective dari FE
1. Klik "Proceed to Define Objective"
2. Isi wizard 3 step
3. Submit
4. Check n8n executions: harus jalan tanpa error
5. Check Supabase seo_objectives: 3 row terisi (atau 1 row dengan JSONB pillars)
6. Check FE /objectives/[id]: 3 pillar render dengan data

### Test 3: Sync Technical Checklist
1. Buka /diagnosis/[id] di tab 1
2. Buka /objectives/[id] di tab 2
3. Di tab 1, toggle checklist item ke "fixed"
4. Di tab 2: Technical pillar harus auto-update via Realtime

Mulai dari Workflow Identify Problem (test end-to-end), lalu Workflow Define Objective.

import fs from 'node:fs';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function getNode(workflow, name) {
  const node = workflow.nodes.find((entry) => entry.name === name);
  if (!node) {
    throw new Error(`Missing node: ${name}`);
  }
  return node;
}

function upsertField(fields, fieldId, fieldValue) {
  const existing = fields.find((field) => field.fieldId === fieldId);
  if (existing) {
    existing.fieldValue = fieldValue;
    return;
  }

  fields.push({ fieldId, fieldValue });
}

const identifyPath = 'docs/n8n-identify-workflow.json';
const objectivePath = 'docs/n8n-objective-workflow.json';

const identify = readJson(identifyPath);
const identifyAgent = getNode(identify, 'AI Agent');
identifyAgent.parameters.text = '={{ JSON.stringify({\n  job_id: $json.job_id,\n  project_id: $json.project_id,\n  diagnosis_id: $json.diagnosis_id,\n  brief: $json.identify_merged,\n  enriched_data: {\n    gsc: $json.gsc_data ?? {},\n    ga4: $json.ga4_data ?? {},\n    technical_errors: $json.technical_errors ?? [],\n    ai_visibility: $json.ai_visibility ?? {}\n  }\n}, null, 2) }}';
identifyAgent.parameters.options.systemMessage = [
  'You are an SEO diagnostic agent V2. Analyze the website brief plus any auto-fetched signals from GSC, GA4, technical errors, and AI visibility.',
  '',
  'Return ONLY valid JSON (no markdown fences, no prose).',
  '',
  'REQUIRED JSON SCHEMA:',
  '{',
  '  "primary_problem_type": "<enum>",',
  '  "severity": "<enum>",',
  '  "confidence_score": <0-100>,',
  '  "diagnosis_summary": "<1 sentence>",',
  '  "technical_health_score": <0-100>,',
  '  "ai_visibility_score": <0-100>,',
  '  "technical_section": {',
  '    "summary": "<1-2 sentences>",',
  '    "critical_issues": ["<issue 1>", "<issue 2>"],',
  '    "checklist_priority": ["<error_type 1>", "<error_type 2>"]',
  '  },',
  '  "keyword_section": {',
  '    "summary": "<1-2 sentences>",',
  '    "top_opportunities": [{ "keyword": "...", "current_position": 25, "opportunity": "Move to top 10" }]',
  '  },',
  '  "ai_overview_section": {',
  '    "summary": "<1-2 sentences>",',
  '    "gemini_insights": "<text>",',
  '    "chatgpt_insights": "<text>",',
  '    "recommendation": "<action>"',
  '  },',
  '  "business_impact_section": {',
  '    "summary": "<1 sentence>",',
  '    "metrics": [{ "label": "<metric>", "current_value": "<value>", "potential_value": "<value>", "gap": "<gap>" }]',
  '  },',
  '  "recommended_next_step": "<action>",',
  '  "objective_direction": "<enum>",',
  '  "model_used": "gpt-4o-mini"',
  '}',
  '',
  'ENUMS (STRICT):',
  '- primary_problem_type: technical_bottleneck | relevance_gap | authority_deficit | conversion_pitfall | from_scratch | ai_visibility_gap | mixed',
  '- severity: low | medium | high | critical',
  '- objective_direction: technical_recovery | qualified_traffic | authority_growth | conversion_improvement | foundation_building | ai_visibility_improvement | mixed',
  '',
  'SCORING RULES:',
  '- technical_health_score: start at 100 and subtract by severity * occurrences, clamp to 0-100',
  '- ai_visibility_score: weighted average of Gemini 60% and ChatGPT 40%',
  '',
  'CLASSIFICATION:',
  '- technical_bottleneck: technical_health_score < 50',
  '- ai_visibility_gap: ai_visibility_score < 40',
  '- relevance_gap: indexed >= 30% but rankings are brand-only',
  '- authority_deficit: DR gap > 15',
  '- conversion_pitfall: traffic > 500 and CR < 1%',
  '- from_scratch: indexed=0 and published=0',
  '- mixed: 2+ categories strong',
  '',
  'Keep warnings and output concise. Do NOT propose objectives or campaign plans.'
].join('\n');

const identifyNormalize = getNode(identify, 'Normalize Diagnosis Result');
identifyNormalize.parameters.jsCode = [
  "// Extract flow data from before AI Agent (because AI Agent overwrites json)",
  "const flow = $('Verify HMAC (DEV)').first().json;",
  'const aiOutput = $input.first().json;',
  '',
  'let raw = aiOutput.output ?? aiOutput.text ?? aiOutput.response ?? aiOutput.result ?? aiOutput;',
  'let parsed = raw;',
  '',
  "if (typeof raw === 'string') {",
  "  const cleaned = raw.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '').replace(/\\s*```$/i, '').trim();",
  '  try { parsed = JSON.parse(cleaned); } catch { parsed = null; }',
  '}',
  '',
  "const VALID_PROBLEMS = ['technical_bottleneck', 'relevance_gap', 'authority_deficit', 'conversion_pitfall', 'from_scratch', 'ai_visibility_gap', 'mixed'];",
  "const VALID_SEVERITY = ['low', 'medium', 'high', 'critical'];",
  "const VALID_DIRECTIONS = ['technical_recovery', 'qualified_traffic', 'authority_growth', 'conversion_improvement', 'foundation_building', 'ai_visibility_improvement', 'mixed'];",
  '',
  'if (!parsed || typeof parsed !== \'object\') {',
  '  parsed = {',
  "    primary_problem_type: 'mixed',",
  "    severity: 'medium',",
  '    confidence_score: 50,',
  "    diagnosis_summary: 'AI output could not be parsed.',",
  "    technical_health_score: 50,",
  "    ai_visibility_score: 50,",
  "    technical_section: { summary: '', critical_issues: [], checklist_priority: [] },",
  "    keyword_section: { summary: '', top_opportunities: [] },",
  "    ai_overview_section: { summary: '', gemini_insights: '', chatgpt_insights: '', recommendation: '' },",
  "    business_impact_section: { summary: '', metrics: [] },",
  "    recommended_next_step: 'Retry diagnosis.',",
  "    objective_direction: 'mixed',",
  "    raw_llm_output: { text: String(raw).slice(0, 2000) },",
  "    model_used: 'gpt-4o-mini'",
  '  };',
  '} else {',
  "  if (!VALID_PROBLEMS.includes(parsed.primary_problem_type)) parsed.primary_problem_type = 'mixed';",
  "  if (typeof parsed.severity !== 'string' || !VALID_SEVERITY.includes(parsed.severity)) parsed.severity = 'medium';",
  "  if (typeof parsed.objective_direction !== 'string' || !VALID_DIRECTIONS.includes(parsed.objective_direction)) parsed.objective_direction = 'mixed';",
  '  if (typeof parsed.confidence_score !== \'number\') parsed.confidence_score = 60;',
  '  if (typeof parsed.technical_health_score !== \'number\') parsed.technical_health_score = 50;',
  '  if (typeof parsed.ai_visibility_score !== \'number\') parsed.ai_visibility_score = 50;',
  "  if (!parsed.technical_section || typeof parsed.technical_section !== 'object') parsed.technical_section = { summary: '', critical_issues: [], checklist_priority: [] };",
  "  if (!parsed.keyword_section || typeof parsed.keyword_section !== 'object') parsed.keyword_section = { summary: '', top_opportunities: [] };",
  "  if (!parsed.ai_overview_section || typeof parsed.ai_overview_section !== 'object') parsed.ai_overview_section = { summary: '', gemini_insights: '', chatgpt_insights: '', recommendation: '' };",
  "  if (!parsed.business_impact_section || typeof parsed.business_impact_section !== 'object') parsed.business_impact_section = { summary: '', metrics: [] };",
  '  if (!parsed.raw_llm_output) parsed.raw_llm_output = {};',
  '  if (!parsed.model_used) parsed.model_used = \'gpt-4o-mini\';',
  '}',
  '',
  'const technical = objectivesByPillar.technical;',
  'const content = objectivesByPillar.content_keyword;',
  'const business = objectivesByPillar.business_impact;',
  'const now = new Date().toISOString();',
  '',
  'return [{',
  '  json: {',
  '    project_id: flow.project_id,',
  '    diagnosis_id: flow.diagnosis_id,',
  '    objective_id: flow.objective_id,',
  "    pillar: 'mixed',",
  "    objective_type: technical?.objective_type ?? 'mixed',",
  "    smart_objective: technical?.smart_objective ?? content?.smart_objective ?? business?.smart_objective ?? 'Objective generated from three pillars.',",
  '    checklist_summary: technical?.checklist_summary ?? null,',
  '    estimated_completion: technical?.estimated_completion ?? null,',
  '    linked_technical_errors: technical?.linked_technical_errors ?? [],',
  '    action_items: content?.action_items ?? [],',
  '    target_metrics: {',
  '      ...(content?.target_metrics ?? {}),',
  '      ...(business?.target_metrics ?? {})',
  '    },',
  '    roi_estimate: business?.roi_estimate ?? null,',
  '    raw_llm_output: parsed.raw_llm_output ?? {},',
  "    model_used: parsed.model_used ?? 'gpt-4o-mini',",
  '    completed_at: now,',
  '    objective_result: parsed',
  '  }',
  '}];'
].join('\n');

const objective = readJson(objectivePath);
const objectiveUpdate = getNode(objective, 'Update seo_objectives');
const objectiveFields = objectiveUpdate.parameters.fieldsUi.fieldValues;
upsertField(objectiveFields, 'objective_type', "={{ $('Normalize Objective Result').first().json.objective_type }}");
upsertField(objectiveFields, 'smart_objective', "={{ $('Normalize Objective Result').first().json.smart_objective }}");
upsertField(objectiveFields, 'pillar', "={{ $('Normalize Objective Result').first().json.pillar }}");
upsertField(objectiveFields, 'checklist_summary', "={{ $('Normalize Objective Result').first().json.checklist_summary }}");
upsertField(objectiveFields, 'estimated_completion', "={{ $('Normalize Objective Result').first().json.estimated_completion }}");
upsertField(objectiveFields, 'linked_technical_errors', "={{ $('Normalize Objective Result').first().json.linked_technical_errors }}");
upsertField(objectiveFields, 'action_items', "={{ $('Normalize Objective Result').first().json.action_items }}");
upsertField(objectiveFields, 'target_metrics', "={{ $('Normalize Objective Result').first().json.target_metrics }}");
upsertField(objectiveFields, 'roi_estimate', "={{ $('Normalize Objective Result').first().json.roi_estimate }}");
upsertField(objectiveFields, 'raw_llm_output', "={{ $('Normalize Objective Result').first().json.raw_llm_output }}");

writeJson(objectivePath, objective);

console.log('Updated phase 5 workflow JSON files.');


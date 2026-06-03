import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const userId = randomUUID();

  await client.from('users').upsert({
    id: userId,
    email: 'demo@seo-agent.test',
    full_name: 'Demo User',
    role: 'owner',
    plan: 'growth',
    timezone: 'Asia/Jakarta'
  });

  const { data: project1 } = await client
    .from('projects')
    .insert({
      user_id: userId,
      name: 'Alpha Commerce',
      website_url: 'https://alpha.example',
      industry: 'E-commerce',
      target_location: 'Indonesia',
      website_stage: 'existing',
      main_business_goal: 'sales'
    })
    .select()
    .single();

  const { data: project2 } = await client
    .from('projects')
    .insert({
      user_id: userId,
      name: 'Nimbus Studio',
      website_url: 'https://nimbus.example',
      industry: 'SaaS',
      target_location: 'Global',
      website_stage: 'new',
      main_business_goal: 'traffic'
    })
    .select()
    .single();

  if (project1) {
    await client.from('seo_diagnoses').insert({
      project_id: project1.id,
      primary_problem_type: 'relevance_gap',
      severity: 'high',
      confidence_score: 87.5,
      diagnosis_summary: 'Content is not aligned with search intent.',
      root_cause: 'Category pages target broad keywords without intent matching.',
      evidence: [],
      business_impact: { summary: 'Organic growth is capped', metrics: [] },
      campaign_readiness: 'partially_ready',
      recommended_next_step: 'Create intent-matched landing pages',
      objective_direction: 'qualified_traffic',
      not_recommended_actions: [],
      warnings: [],
      raw_llm_output: {},
      model_used: 'demo'
    });
  }

  if (project2) {
    await client.from('seo_objectives').insert({
      project_id: project2.id,
      objective_type: 'foundation_building',
      smart_objective: 'Launch a technically sound website foundation within 60 days.',
      input_metrics: {},
      output_metrics: {},
      outcome_metrics: {},
      baseline: {},
      target: {},
      raw_llm_output: {},
      model_used: 'demo',
      status: 'pending'
    });
  }

  console.log('Seeded demo data for', userId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

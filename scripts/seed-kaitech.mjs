import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(filePath) {
  const result = {};

  try {
    const raw = readFileSync(filePath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    });
  } catch {
    // Ignore missing env file; runtime env takes priority.
  }

  return result;
}

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const fileEnv = parseEnvFile(envPath);

  return {
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY,
    KAITECH_SEED_EMAIL: process.env.KAITECH_SEED_EMAIL ?? fileEnv.KAITECH_SEED_EMAIL ?? 'admin@agent.seo'
  };
}

const KAITECH_PAYLOAD = {
  1: {
    website_url: 'https://kaitech.io/id',
    business_name: 'Kaitech',
    industry: 'Software Development Agency',
    target_location: 'Indonesia',
    target_audience: 'Mid-market companies in Indonesia',
    main_product_or_service: 'Custom software development, web & mobile apps'
  },
  2: {
    website_stage: 'existing',
    is_indexed: true,
    monthly_organic_traffic: 1500,
    organic_traffic_trend: 'flat',
    indexed_pages: 45,
    published_pages: 60,
    main_seo_concern: 'Stuck di brand keyword, sulit ranking commercial term'
  },
  3: {
    sitemap_url: 'https://kaitech.io/sitemap.xml',
    robots_txt: 'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://kaitech.io/sitemap.xml',
    crawl_errors_count: 2,
    core_web_vitals_pass: true,
    mobile_usability_issues: false,
    has_redirect_errors: false,
    has_4xx_5xx_errors: false,
    canonical_issues: false,
    noindex_issues: false
  },
  4: {
    current_ranking_keywords: ['kaitech', 'kaitech indonesia', 'kaitech software house'],
    target_keywords: [
      'custom software development indonesia',
      'web development jakarta',
      'mobile app developer indonesia',
      'enterprise software solutions',
      'digital transformation services'
    ],
    monthly_impressions: 25000,
    monthly_ctr: 1.5,
    competitor_domains: ['softwareseni.com', 'mitrais.com', 'suitmedia.com']
  },
  5: {
    domain_rating: 28,
    referring_domains: 35,
    backlink_count: 220,
    competitor_dr_avg: 45,
    brand_mentions_estimate: 'low',
    has_case_studies: true,
    has_author_pages: false
  },
  6: {
    current_conversion_rate: 1.5,
    monthly_organic_leads: 20,
    monthly_organic_sales: 3,
    bounce_rate: 60,
    avg_session_duration: 120,
    top_landing_pages: ['/id', '/id/services', '/id/case-studies'],
    cta_quality_self_rating: 'medium'
  }
};

function projectPayload() {
  return {
    user_id: null,
    name: 'Kaitech',
    website_url: 'https://kaitech.io/id',
    industry: 'Software Development Agency',
    target_location: 'Indonesia',
    target_audience: 'Mid-market companies in Indonesia',
    main_product_or_service: 'Custom software development, web & mobile apps',
    website_stage: 'existing',
    main_business_goal: 'leads',
    status: 'active',
    current_step: 1
  };
}

function buildDrafts(projectId) {
  return Object.entries(KAITECH_PAYLOAD).map(([step, payload]) => ({
    project_id: projectId,
    step_number: Number(step),
    sub_step: Number(step),
    payload,
    is_draft: true
  }));
}

async function main() {
  const env = loadEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.');
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) {
    throw authError;
  }

  const user = authUsers.users.find((item) => item.email?.toLowerCase() === env.KAITECH_SEED_EMAIL.toLowerCase());
  if (!user) {
    throw new Error(`User not found: ${env.KAITECH_SEED_EMAIL}. Login/register dulu sebelum seed.`);
  }

  const userId = user.id;

  await supabase.from('projects').delete().eq('user_id', userId).eq('website_url', 'https://kaitech.io/id');

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...projectPayload(),
      user_id: userId
    })
    .select('*')
    .single();

  if (projectError) {
    throw projectError;
  }

  const drafts = buildDrafts(project.id);
  const { error: draftsError } = await supabase.from('seo_inputs').insert(drafts);
  if (draftsError) {
    throw draftsError;
  }

  console.log(`Seeded Kaitech project for ${env.KAITECH_SEED_EMAIL}`);
  console.log(`Project ID: ${project.id}`);
  console.log(`Identify drafts: ${drafts.length}`);
  console.log(`Open: /projects/${project.id}/identify/step/1`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

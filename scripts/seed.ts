import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth/local-auth';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Admin';

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

  if (adminEmail && adminPassword) {
    const { data: userPage, error: listError } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (listError) {
      throw listError;
    }

    const existingAdmin = userPage.users.find((user) => user.email?.toLowerCase() === adminEmail.toLowerCase());
    const { data: existingProfile, error: profileLookupError } = await client
      .from('users')
      .select('id, email')
      .eq('email', adminEmail.toLowerCase())
      .maybeSingle();

    if (profileLookupError) {
      throw profileLookupError;
    }

    if (existingAdmin) {
      if (existingProfile && existingProfile.id !== existingAdmin.id) {
        const { error: cleanupError } = await client.from('users').delete().eq('email', adminEmail.toLowerCase());
        if (cleanupError) {
          throw cleanupError;
        }
      }

      const { error: updateError } = await client.auth.admin.updateUserById(existingAdmin.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminFullName
        }
      });

      if (updateError) {
        throw updateError;
      }

      const { error: localAccountUpsertError } = await client.from('auth_accounts').upsert({
        id: existingAdmin.id,
        email: adminEmail,
        password_hash: hashPassword(adminPassword),
        status: 'active',
        full_name: adminFullName,
        avatar_url: null,
        role: 'admin',
        email_verified_at: new Date().toISOString(),
        password_updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      });

      if (localAccountUpsertError) {
        throw localAccountUpsertError;
      }

      await client.from('users').upsert({
        id: existingAdmin.id,
        email: adminEmail,
        full_name: adminFullName,
        role: 'admin',
        timezone: 'Asia/Jakarta'
      });

      console.log('Updated admin auth user and profile for', adminEmail);
    } else {
      if (existingProfile) {
        const { error: cleanupError } = await client.from('users').delete().eq('email', adminEmail.toLowerCase());
        if (cleanupError) {
          throw cleanupError;
        }
      }

      const { data: createdUser, error: createError } = await client.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminFullName
        }
      });

      if (createError) {
        throw createError;
      }

      if (!createdUser.user) {
        throw new Error('Failed to create admin auth user');
      }

      const { error: localAccountUpsertError } = await client.from('auth_accounts').upsert({
        id: createdUser.user.id,
        email: adminEmail,
        password_hash: hashPassword(adminPassword),
        status: 'active',
        full_name: adminFullName,
        avatar_url: null,
        role: 'admin',
        email_verified_at: new Date().toISOString(),
        password_updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      });

      if (localAccountUpsertError) {
        throw localAccountUpsertError;
      }

      await client.from('users').upsert({
        id: createdUser.user.id,
        email: adminEmail,
        full_name: adminFullName,
        role: 'admin',
        timezone: 'Asia/Jakarta'
      });

      console.log('Created admin auth user and profile for', adminEmail);
    }
  }

  const userId = randomUUID();

  await client.from('users').upsert({
    id: userId,
    email: 'demo@seo-agent.test',
    full_name: 'Demo User',
    role: 'owner',
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

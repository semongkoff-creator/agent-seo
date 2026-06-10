import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { buildIdentifyWorkflowPayload } from '@/lib/n8n/contracts';
import { triggerJob } from '@/lib/n8n/client';
import { getGA4MockData } from '@/lib/mocks/ga4';
import { getGSCMockData } from '@/lib/mocks/gsc';
import { getLatestTechnicalSignals } from '@/lib/services/technical-signals';
import type { IdentifyStepDraftInput, IdentifyStepNumber } from '@/lib/validators/identify';

function sanitizeTrafficTrend(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  const legacyMap: Record<string, 'increasing' | 'flat' | 'decreasing'> = {
    growing: 'increasing',
    increasing: 'increasing',
    stagnant: 'flat',
    flat: 'flat',
    zero: 'flat',
    declining: 'decreasing',
    decreasing: 'decreasing'
  };

  return legacyMap[normalized];
}

function sanitizeIdentifyPayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }

      cleaned[key] = trimmed;
      return;
    }

    if (Array.isArray(value)) {
      cleaned[key] = value.filter((item) => typeof item === 'string' ? item.trim().length > 0 : item != null);
      return;
    }

    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  const trend = sanitizeTrafficTrend(cleaned.organic_traffic_trend);
  if (trend) {
    cleaned.organic_traffic_trend = trend;
  } else {
    delete cleaned.organic_traffic_trend;
  }

  return cleaned;
}

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

function conflict(message: string) {
  throw new AppError('CONFLICT', message, 409);
}

async function loadAutoIdentifySignals(projectId: string) {
  const [gscData, ga4Data, technicalSignals] = await Promise.all([
    getGSCMockData(projectId),
    getGA4MockData(projectId),
    getLatestTechnicalSignals(projectId)
  ]);

  return {
    is_indexed: Boolean(gscData.indexed > 0),
    indexed_pages: Math.max(0, Math.round(gscData.indexed)),
    published_pages: Math.max(0, Math.round(gscData.total)),
    monthly_organic_traffic: Math.max(0, Math.round(ga4Data.session.value)),
    organic_traffic_trend:
      ga4Data.session.trendPct > 0 ? 'increasing' : ga4Data.session.trendPct < 0 ? 'decreasing' : 'flat',
    crawl_errors_count: technicalSignals.crawl_errors_count,
    core_web_vitals_pass: technicalSignals.core_web_vitals_pass,
    mobile_usability_count: technicalSignals.mobile_usability_count,
    crawl_errors_data: technicalSignals.technical_signals.gsc ?? {},
    core_web_vitals_data: technicalSignals.technical_signals.psi ?? {},
    mobile_usability_data: technicalSignals.technical_signals.gsc ?? {},
    data_sources_status: {
      gsc: Boolean(technicalSignals.technical_signals.gsc),
      psi: Boolean(technicalSignals.technical_signals.psi),
      dataforseo: true
    }
  };
}

export async function getIdentifyDraft(userId: string, projectId: string) {
  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Project not found');
  }

  const { data, error } = await db
    .from('seo_inputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_draft', true)
    .order('step_number', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load identify draft', 500, { cause: error.message });
  }

  return {
    items: data ?? []
  };
}

export async function getLatestIdentifyResult(userId: string, projectId: string) {
  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Project not found');
  }

  const { data, error } = await db
    .from('seo_inputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('step_number', 1)
    .eq('sub_step', 0)
    .eq('is_draft', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load latest identify result', 500, { cause: error.message });
  }

  return data ?? null;
}

export async function saveIdentifyStep(
  userId: string,
  projectId: string,
  stepNumber: IdentifyStepNumber,
  input: IdentifyStepDraftInput['payload']
) {
  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Project not found');
  }

  await db.from('seo_inputs').delete().eq('project_id', projectId).eq('step_number', stepNumber).eq('sub_step', stepNumber).eq('is_draft', true);

  const { data, error } = await db
    .from('seo_inputs')
    .insert({
      project_id: projectId,
      step_number: stepNumber,
      sub_step: stepNumber,
      payload: input,
      is_draft: true
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to save identify step', 500, { cause: error.message });
  }

  return data;
}

export async function submitIdentify(userId: string, projectId: string) {
  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Project not found');
  }

  const { data: drafts, error } = await db
    .from('seo_inputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_draft', true)
    .order('step_number', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load identify drafts', 500, { cause: error.message });
  }

  if (!drafts || drafts.length === 0) {
    conflict('Save identify steps first');
  }

  const mergedPayload = drafts.reduce<Record<string, unknown>>((acc, row) => {
    Object.assign(acc, row.payload ?? {});
    return acc;
  }, {});
  const autoSignals = await loadAutoIdentifySignals(projectId);
  const sanitizedMergedPayload = sanitizeIdentifyPayload({
    ...mergedPayload,
    ...autoSignals
  });
  const technicalSignalsData = {
    crawl_errors_data: sanitizedMergedPayload.crawl_errors_data ?? {},
    core_web_vitals_data: sanitizedMergedPayload.core_web_vitals_data ?? {},
    mobile_usability_data: sanitizedMergedPayload.mobile_usability_data ?? {},
    data_sources_status: sanitizedMergedPayload.data_sources_status ?? {}
  };

  const structuredDrafts = drafts.map((row) => ({
    id: row.id,
    stepNumber: row.stepNumber,
    subStep: row.subStep,
    payload: sanitizeIdentifyPayload((row.payload ?? {}) as Record<string, unknown>)
  }));

  const { data: inputRow, error: inputError } = await db
    .from('seo_inputs')
      .insert({
        project_id: projectId,
        step_number: 1,
        sub_step: 0,
        payload: sanitizedMergedPayload,
        is_draft: false
      })
    .select('*')
    .single();

  if (inputError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to finalize identify input', 500, {
      cause: inputError.message
    });
  }

  const { data: diagnosis, error: diagnosisError } = await db
    .from('seo_diagnoses')
    .insert({
      project_id: projectId,
      input_id: inputRow.id,
      primary_problem_type: 'mixed',
      severity: 'medium',
      confidence_score: 0,
      diagnosis_summary: 'Queued for analysis',
      root_cause: 'Pending n8n result',
      evidence: [],
      business_impact: { summary: 'Pending analysis', metrics: [] },
      campaign_readiness: 'not_ready',
      recommended_next_step: 'Wait for diagnosis',
      objective_direction: 'mixed',
      crawl_errors_data: technicalSignalsData.crawl_errors_data,
      core_web_vitals_data: technicalSignalsData.core_web_vitals_data,
      mobile_usability_data: technicalSignalsData.mobile_usability_data,
      data_sources_status: technicalSignalsData.data_sources_status,
      not_recommended_actions: [],
      warnings: [],
      raw_llm_output: {},
      model_used: 'n8n',
      status: 'pending'
    })
    .select('*')
    .single();

  if (diagnosisError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create diagnosis', 500, {
      cause: diagnosisError.message
    });
  }

  const { data: job, error: jobError } = await db
    .from('jobs')
    .insert({
      user_id: userId,
      project_id: projectId,
      type: 'identify_problem',
      status: 'queued',
      request_payload: {
        projectId,
        inputId: inputRow.id,
        diagnosisId: diagnosis.id,
        payload: sanitizedMergedPayload
      },
      response_payload: {}
    })
    .select('*')
    .single();

  if (jobError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create identify job', 500, { cause: jobError.message });
  }

  const { error: progressError } = await db
    .from('campaign_progress')
    .upsert(
      [
        { project_id: projectId, step_number: 1, status: 'completed', completed_at: new Date().toISOString() },
        { project_id: projectId, step_number: 2, status: 'in_progress', started_at: new Date().toISOString() }
      ],
      { onConflict: 'project_id,step_number' }
    );

  if (progressError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update campaign progress', 500, {
      cause: progressError.message
    });
  }

  try {
    await triggerJob({
      jobId: job.id,
      projectId,
      userId,
      action: 'identify_problem',
      payload: buildIdentifyWorkflowPayload({
        jobId: job.id,
        projectId,
        diagnosisId: diagnosis.id,
        drafts: structuredDrafts,
        merged: sanitizedMergedPayload
      })
    });
  } catch (error) {
    await db
      .from('jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Failed to trigger n8n',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    await db
      .from('seo_diagnoses')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Failed to trigger n8n'
      })
      .eq('id', diagnosis.id);

    throw error;
  }

  return {
    jobId: job.id,
    diagnosisId: diagnosis.id,
    status: 'queued' as const
  };
}

export async function getIdentifyStatus(userId: string, projectId: string) {
  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Project not found');
  }

  const { data, error } = await db
    .from('jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', 'identify_problem')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load identify status', 500, { cause: error.message });
  }

  return data ?? null;
}

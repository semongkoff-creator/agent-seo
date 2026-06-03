import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import type {
  DiagnosisCompleteWebhookInput,
  JobFailedWebhookInput,
  ObjectiveCompleteWebhookInput
} from '@/lib/validators/webhooks';

async function getJob(jobId: string) {
  const { data, error } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle();
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load job', 500, { cause: error.message });
  }
  return data;
}

export async function processDiagnosisComplete(payload: DiagnosisCompleteWebhookInput) {
  const job = await getJob(payload.job_id);
  if (!job) {
    throw new AppError('NOT_FOUND', 'Job not found', 404);
  }

  if (job.status === 'completed') {
    return { ok: true, alreadyProcessed: true };
  }

  const { error: diagnosisError } = await db
    .from('seo_diagnoses')
    .update({
      primary_problem_type: payload.result.primary_problem_type,
      secondary_problem_type: payload.result.secondary_problem_type ?? null,
      severity: payload.result.severity,
      confidence_score: payload.result.confidence_score,
      diagnosis_summary: payload.result.diagnosis_summary,
      root_cause: payload.result.root_cause,
      evidence: payload.result.evidence,
      business_impact: payload.result.business_impact,
      campaign_readiness: payload.result.campaign_readiness,
      recommended_next_step: payload.result.recommended_next_step,
      objective_direction: payload.result.objective_direction,
      not_recommended_actions: payload.result.not_recommended_actions,
      warnings: payload.result.warnings,
      raw_llm_output: payload.result.raw_llm_output ?? {},
      model_used: payload.result.model_used,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', payload.diagnosis_id);

  if (diagnosisError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update diagnosis', 500, {
      cause: diagnosisError.message
    });
  }

  const { error: jobError } = await db
    .from('jobs')
    .update({
      status: 'completed',
      response_payload: payload.result,
      completed_at: new Date().toISOString()
    })
    .eq('id', payload.job_id);

  if (jobError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update job', 500, { cause: jobError.message });
  }

  await db.from('usage_events').insert({
    user_id: job.user_id,
    event_type: 'diagnosis_run',
    metadata: { jobId: payload.job_id, projectId: payload.project_id, diagnosisId: payload.diagnosis_id }
  });

  const { error: progressError } = await db
    .from('campaign_progress')
    .upsert(
      [
        { project_id: payload.project_id, step_number: 1, status: 'completed', completed_at: new Date().toISOString() },
        { project_id: payload.project_id, step_number: 2, status: 'in_progress', started_at: new Date().toISOString() }
      ],
      { onConflict: 'project_id,step_number' }
    );

  if (progressError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update campaign progress', 500, {
      cause: progressError.message
    });
  }

  return { ok: true };
}

export async function processObjectiveComplete(payload: ObjectiveCompleteWebhookInput) {
  const job = await getJob(payload.job_id);
  if (!job) {
    throw new AppError('NOT_FOUND', 'Job not found', 404);
  }

  if (job.status === 'completed') {
    return { ok: true, alreadyProcessed: true };
  }

  const { error: objectiveError } = await db
    .from('seo_objectives')
    .update({
      objective_type: payload.result.objective_type,
      smart_objective: payload.result.smart_objective,
      business_goal_alignment: payload.result.business_goal_alignment ?? null,
      input_metrics: payload.result.input_metrics ?? {},
      output_metrics: payload.result.output_metrics ?? {},
      outcome_metrics: payload.result.outcome_metrics ?? {},
      baseline: payload.result.baseline ?? {},
      target: payload.result.target ?? {},
      time_period: payload.result.time_period ?? null,
      achievability_score: payload.result.achievability_score ?? null,
      achievability_percent: payload.result.achievability_percent ?? null,
      risk_notes: payload.result.risk_notes,
      reasoning: payload.result.reasoning ?? null,
      next_step: payload.result.next_step ?? null,
      raw_llm_output: payload.result.raw_llm_output ?? {},
      model_used: payload.result.model_used,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', payload.objective_id);

  if (objectiveError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update objective', 500, {
      cause: objectiveError.message
    });
  }

  const { error: jobError } = await db
    .from('jobs')
    .update({
      status: 'completed',
      response_payload: payload.result,
      completed_at: new Date().toISOString()
    })
    .eq('id', payload.job_id);

  if (jobError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update job', 500, { cause: jobError.message });
  }

  await db.from('usage_events').insert({
    user_id: job.user_id,
    event_type: 'objective_generated',
    metadata: { jobId: payload.job_id, projectId: payload.project_id, objectiveId: payload.objective_id }
  });

  return { ok: true };
}

export async function processJobFailed(payload: JobFailedWebhookInput) {
  const job = await getJob(payload.job_id);
  if (!job) {
    throw new AppError('NOT_FOUND', 'Job not found', 404);
  }

  if (job.status === 'completed') {
    return { ok: true, alreadyProcessed: true };
  }

  const { error } = await db
    .from('jobs')
    .update({
      status: 'failed',
      error_message: payload.error_message,
      response_payload: payload.details ?? {},
      completed_at: new Date().toISOString()
    })
    .eq('id', payload.job_id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to mark job failed', 500, { cause: error.message });
  }

  return { ok: true };
}

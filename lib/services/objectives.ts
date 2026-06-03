import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { buildObjectiveWorkflowPayload } from '@/lib/n8n/contracts';
import { triggerJob } from '@/lib/n8n/client';
import type {
  ObjectiveInput,
  ObjectiveListQuery,
  RegenerateObjectiveInput
} from '@/lib/validators/objectives';

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

function conflict(message: string) {
  throw new AppError('CONFLICT', message, 409);
}

export async function listObjectives(userId: string, query: ObjectiveListQuery) {
  const { data: projects, error: projectsError } = await db
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (projectsError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to list objectives', 500, {
      cause: projectsError.message
    });
  }

  const projectIds = (projects ?? []).map((project) => project.id);
  if (projectIds.length === 0) {
    return { items: [], page: query.page, limit: query.limit, total: 0 };
  }

  let request = db
    .from('seo_objectives')
    .select('*', { count: 'exact' })
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1);

  if (query.projectId) {
    request = request.eq('project_id', query.projectId);
  }

  const { data, error, count } = await request;
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to list objectives', 500, { cause: error.message });
  }

  return {
    items: data ?? [],
    page: query.page,
    limit: query.limit,
    total: count ?? 0
  };
}

export async function getObjective(userId: string, objectiveId: string) {
  const { data, error } = await db.from('seo_objectives').select('*').eq('id', objectiveId).maybeSingle();
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load objective', 500, { cause: error.message });
  }
  if (!data) {
    notFound('Objective not found');
  }

  const { data: project } = await db
    .from('projects')
    .select('id')
    .eq('id', data.project_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) {
    notFound('Objective not found');
  }

  return data;
}

export async function getObjectiveDraft(userId: string, projectId: string) {
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
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load objective draft', 500, { cause: error.message });
  }

  return { items: data ?? [] };
}

export async function saveObjectiveInputs(userId: string, projectId: string, input: ObjectiveInput) {
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
    .insert({
      project_id: projectId,
      step_number: 2,
      sub_step: 'objective',
      payload: input,
      is_draft: true
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to save objective inputs', 500, { cause: error.message });
  }

  return data;
}

export async function generateObjective(userId: string, projectId: string, input: ObjectiveInput) {
  const { data: diagnosis } = await db
    .from('seo_diagnoses')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!diagnosis) {
    conflict('Run diagnosis first');
  }

  const { data: objective, error: objectiveError } = await db
    .from('seo_objectives')
    .insert({
      project_id: projectId,
      diagnosis_id: diagnosis.id,
      objective_type: 'mixed',
      smart_objective: 'Pending objective generation',
      input_metrics: input,
      output_metrics: {},
      outcome_metrics: {},
      baseline: {},
      target: {},
      raw_llm_output: {},
      model_used: 'n8n',
      status: 'pending'
    })
    .select('*')
    .single();

  if (objectiveError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create objective', 500, {
      cause: objectiveError.message
    });
  }

  const { data: job, error: jobError } = await db
    .from('jobs')
    .insert({
      user_id: userId,
      project_id: projectId,
      type: 'define_objective',
      status: 'queued',
      request_payload: { projectId, objectiveId: objective.id, diagnosisId: diagnosis.id, input },
      response_payload: {}
    })
    .select('*')
    .single();

  if (jobError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create objective job', 500, { cause: jobError.message });
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
      action: 'define_objective',
      payload: buildObjectiveWorkflowPayload({
        jobId: job.id,
        projectId,
        diagnosisId: diagnosis.id,
        objectiveId: objective.id,
        objectiveInput: input
      }),
      callbackUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/api/webhooks/n8n/objective-complete`
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
      .from('seo_objectives')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Failed to trigger n8n'
      })
      .eq('id', objective.id);

    throw error;
  }

  return {
    jobId: job.id,
    objectiveId: objective.id,
    status: 'queued' as const
  };
}

export async function regenerateObjective(userId: string, objectiveId: string, input: RegenerateObjectiveInput) {
  const objective = await getObjective(userId, objectiveId);

  const { data, error } = await db
    .from('jobs')
    .insert({
      user_id: userId,
      project_id: objective.project_id,
      type: 'define_objective',
      status: 'queued',
      request_payload: { objectiveId, reason: input.reason ?? null },
      response_payload: {}
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to enqueue objective regeneration', 500, {
      cause: error.message
    });
  }

  return {
    jobId: data.id,
    objectiveId,
    status: 'queued' as const
  };
}

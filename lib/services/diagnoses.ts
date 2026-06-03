import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import type { ListDiagnosesQuery, RerunDiagnosisInput } from '@/lib/validators/diagnoses';

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

export async function listDiagnoses(userId: string, query: ListDiagnosesQuery) {
  const { data: projects, error: projectsError } = await db
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (projectsError) {
    if (isMissingRelationError(projectsError)) {
      return { items: [], page: query.page, limit: query.limit, total: 0 };
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to list diagnoses', 500, {
      cause: projectsError.message
    });
  }

  const projectIds = (projects ?? []).map((project) => project.id);
  if (projectIds.length === 0) {
    return { items: [], page: query.page, limit: query.limit, total: 0 };
  }

  let request = db
    .from('seo_diagnoses')
    .select('*', { count: 'exact' })
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1);

  const { data, error, count } = await request;
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to list diagnoses', 500, { cause: error.message });
  }

  return {
    items: data ?? [],
    page: query.page,
    limit: query.limit,
    total: count ?? 0
  };
}

export async function getDiagnosis(userId: string, diagnosisId: string) {
  const { data, error } = await db.from('seo_diagnoses').select('*').eq('id', diagnosisId).maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) {
      throw new AppError('NOT_FOUND', 'Diagnosis not found', 404);
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load diagnosis', 500, { cause: error.message });
  }
  if (!data) {
    notFound('Diagnosis not found');
  }

  const { data: project, error: projectError } = await db
    .from('projects')
    .select('id, user_id')
    .eq('id', data.project_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (projectError) {
    if (isMissingRelationError(projectError)) {
      throw new AppError('NOT_FOUND', 'Diagnosis not found', 404);
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to validate diagnosis access', 500, {
      cause: projectError.message
    });
  }

  if (!project) {
    notFound('Diagnosis not found');
  }

  return data;
}

export async function rerunDiagnosis(userId: string, diagnosisId: string, input: RerunDiagnosisInput) {
  const diagnosis = await getDiagnosis(userId, diagnosisId);

  const { data, error } = await db
    .from('jobs')
    .insert({
      user_id: userId,
      project_id: diagnosis.project_id,
      type: 'identify_problem',
      status: 'queued',
      request_payload: { diagnosisId, reason: input.reason ?? null },
      response_payload: {}
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to enqueue diagnosis rerun', 500, {
      cause: error.message
    });
  }

  return {
    jobId: data.id,
    diagnosisId,
    status: 'queued' as const
  };
}

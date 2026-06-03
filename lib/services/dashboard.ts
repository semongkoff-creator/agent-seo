import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';

export async function getDashboardOverview(userId: string) {
  const { data: projectRows, error: projectError } = await db.from('projects').select('id, status').eq('user_id', userId);
  if (projectError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load dashboard overview', 500, {
      cause: projectError.message
    });
  }

  const projectIds = projectRows?.map((project) => project.id) ?? [];
  const diagnosisRequest = projectIds.length
    ? db.from('seo_diagnoses').select('id, status, severity, created_at').in('project_id', projectIds)
    : null;
  const objectiveRequest = projectIds.length
    ? db.from('seo_objectives').select('id, status').in('project_id', projectIds)
    : null;
  const eventsRequest = db.from('usage_events').select('event_type').eq('user_id', userId);

  const [diagnoses, objectives, events] = await Promise.all([
    diagnosisRequest ?? Promise.resolve({ data: [], error: null }),
    objectiveRequest ?? Promise.resolve({ data: [], error: null }),
    eventsRequest
  ]);

  if (diagnoses.error || objectives.error || events.error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load dashboard overview', 500, {
      cause:
        diagnoses.error?.message ??
        objectives.error?.message ??
        events.error?.message
    });
  }

  return {
    projectCount: projectRows?.length ?? 0,
    activeProjectCount: projectRows?.filter((project) => project.status === 'active').length ?? 0,
    completedDiagnoses: diagnoses.data?.filter((item) => item.status === 'completed').length ?? 0,
    completedObjectives: objectives.data?.filter((item) => item.status === 'completed').length ?? 0,
    recentEvents: events.data ?? []
  };
}

export async function listDashboardInsights(userId: string) {
  const { data, error } = await db
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load dashboard insights', 500, { cause: error.message });
  }

  return { items: data ?? [] };
}

export async function dismissDashboardInsight(userId: string, insightId: string) {
  const { data, error } = await db
    .from('ai_insights')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', insightId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to dismiss insight', 500, { cause: error.message });
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Insight not found', 404);
  }

  return data;
}

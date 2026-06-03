import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '@/lib/validators/tasks';

async function ensureProjectAccess(userId: string, projectId: string) {
  const { data, error } = await db.from('projects').select('id').eq('id', projectId).eq('user_id', userId).maybeSingle();
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to validate project access', 500, { cause: error.message });
  }
  if (!data) {
    throw new AppError('NOT_FOUND', 'Project not found', 404);
  }
}

export async function getCampaignOverview(userId: string, projectId: string) {
  await ensureProjectAccess(userId, projectId);

  const [progress, tasks, objective] = await Promise.all([
    db.from('campaign_progress').select('*').eq('project_id', projectId).order('step_number', { ascending: true }),
    db.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    db
      .from('seo_objectives')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
  ]);

  if (progress.error || tasks.error || objective.error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load campaign overview', 500, {
      cause: progress.error?.message ?? tasks.error?.message ?? objective.error?.message
    });
  }

  return {
    campaignProgress: progress.data ?? [],
    tasks: tasks.data ?? [],
    latestObjective: objective.data?.[0] ?? null
  };
}

export async function listTasks(userId: string, projectId: string, query: ListTasksQuery) {
  await ensureProjectAccess(userId, projectId);

  let request = db
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1);

  if (query.status) {
    request = request.eq('status', query.status);
  }

  if (query.stepNumber) {
    request = request.eq('step_number', query.stepNumber);
  }

  const { data, error, count } = await request;
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to list tasks', 500, { cause: error.message });
  }

  return {
    items: data ?? [],
    page: query.page,
    limit: query.limit,
    total: count ?? 0
  };
}

export async function createTask(userId: string, projectId: string, input: CreateTaskInput) {
  await ensureProjectAccess(userId, projectId);

  const { data, error } = await db
    .from('tasks')
    .insert({
      project_id: projectId,
      step_number: input.stepNumber,
      title: input.title,
      description: input.description ?? null,
      impact: input.impact,
      due_at: input.dueAt ?? null
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create task', 500, { cause: error.message });
  }

  return data;
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const { data: task } = await db.from('tasks').select('id, project_id').eq('id', taskId).maybeSingle();
  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  await ensureProjectAccess(userId, task.project_id);

  const payload: Record<string, unknown> = {};
  if (input.stepNumber !== undefined) payload.step_number = input.stepNumber;
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.impact !== undefined) payload.impact = input.impact;
  if (input.dueAt !== undefined) payload.due_at = input.dueAt;

  const { data, error } = await db.from('tasks').update(payload).eq('id', taskId).select('*').maybeSingle();
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update task', 500, { cause: error.message });
  }
  if (!data) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  return data;
}

export async function deleteTask(userId: string, taskId: string) {
  const { data: task } = await db.from('tasks').select('id, project_id').eq('id', taskId).maybeSingle();
  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  await ensureProjectAccess(userId, task.project_id);

  const { error } = await db.from('tasks').delete().eq('id', taskId);
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete task', 500, { cause: error.message });
  }

  return { ok: true };
}

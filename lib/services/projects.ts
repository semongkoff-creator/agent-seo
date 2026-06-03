import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput
} from '@/lib/validators/projects';

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

async function ensureCampaignProgress(projectId: string) {
  const rows = Array.from({ length: 7 }, (_, index) => ({
    project_id: projectId,
    step_number: index + 1,
    status: index === 0 ? 'in_progress' : 'locked'
  }));

  const { error } = await db.from('campaign_progress').upsert(rows, {
    onConflict: 'project_id,step_number'
  });

  if (error) {
    if (isMissingRelationError(error)) {
      return;
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to initialize campaign progress', 500, {
      cause: error.message
    });
  }
}

export async function listProjects(userId: string, query: ListProjectsQuery) {
  let request = db
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1);

  if (query.status) {
    request = request.eq('status', query.status);
  }

  const { data, error, count } = await request;
  if (error) {
    if (isMissingRelationError(error)) {
      return {
        items: [],
        page: query.page,
        limit: query.limit,
        total: 0
      };
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to list projects', 500, { cause: error.message });
  }

  return {
    items: data ?? [],
    page: query.page,
    limit: query.limit,
    total: count ?? 0
  };
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const { data, error } = await db
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name,
      website_url: input.websiteUrl,
      industry: input.industry ?? null,
      target_location: input.targetLocation ?? null,
      target_audience: input.targetAudience ?? null,
      main_product_or_service: input.mainProductOrService ?? null,
      website_stage: input.websiteStage ?? null,
      main_business_goal: input.mainBusinessGoal ?? null
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create project', 500, { cause: error.message });
  }

  await ensureCampaignProgress(data.id);

  return data;
}

export async function getProject(userId: string, projectId: string) {
  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load project', 500, { cause: error.message });
  }

  if (!data) {
    notFound('Project not found');
  }

  const { data: progress, error: progressError } = await db
    .from('campaign_progress')
    .select('*')
    .eq('project_id', projectId)
    .order('step_number', { ascending: true });

  if (progressError) {
    if (isMissingRelationError(progressError)) {
      return {
        ...data,
        campaignProgress: []
      };
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load campaign progress', 500, {
      cause: progressError.message
    });
  }

  return {
    ...data,
    campaignProgress: progress ?? []
  };
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.websiteUrl !== undefined) payload.website_url = input.websiteUrl;
  if (input.industry !== undefined) payload.industry = input.industry;
  if (input.targetLocation !== undefined) payload.target_location = input.targetLocation;
  if (input.targetAudience !== undefined) payload.target_audience = input.targetAudience;
  if (input.mainProductOrService !== undefined) payload.main_product_or_service = input.mainProductOrService;
  if (input.websiteStage !== undefined) payload.website_stage = input.websiteStage;
  if (input.mainBusinessGoal !== undefined) payload.main_business_goal = input.mainBusinessGoal;

  const { data, error } = await db
    .from('projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to update project', 500, { cause: error.message });
  }

  if (!data) {
    notFound('Project not found');
  }

  return data;
}

export async function archiveProject(userId: string, projectId: string) {
  const { data, error } = await db
    .from('projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to archive project', 500, { cause: error.message });
  }

  if (!data) {
    notFound('Project not found');
  }

  return data;
}

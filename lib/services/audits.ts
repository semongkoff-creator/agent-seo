import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import { getAuditPages, getDataForSEOPageLimit, submitOnPageAudit } from '@/lib/dataforseo/client';
import { parseDataForSEOOnPageResult, summarizeDataForSEOIssues } from '@/lib/dataforseo/parser';
import type { DataForSEOOnPageAuditResult } from '@/lib/dataforseo/types';
import type { TechnicalErrorRecord, TechnicalErrorUrlDetail } from '@/types/wizard';

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

function relationErrorMessage(relation: string, migrationFile: string) {
  return `Missing ${relation} table. Apply ${migrationFile} in Supabase, then retry.`;
}

function toTechnicalErrorUrls(urls: DataForSEOOnPageAuditResult['pages']): TechnicalErrorUrlDetail[] {
  return urls.map((item) => ({
    url: item.url,
    reason: item.reason,
    statusCode: item.statusCode,
    detectedAt: item.detectedAt,
    additionalInfo: item.additionalInfo
  }));
}

async function verifyProjectAccess(userId: string, projectId: string) {
  const { data: project, error } = await db
    .from('projects')
    .select('id, website_url')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      notFound('Project not found');
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to verify project access', 500, { cause: error.message });
  }

  if (!project) {
    notFound('Project not found');
  }

  return project as Record<string, unknown>;
}

async function replaceDataForSEOErrors(projectId: string, issues: DataForSEOOnPageAuditResult['issues'], rawSummary: Record<string, unknown>) {
  await db.from('technical_errors').delete().eq('project_id', projectId).eq('source', 'dataforseo');

  if (issues.length === 0) {
    return [];
  }

  const rows = issues.map((issue) => ({
    project_id: projectId,
    source: 'dataforseo',
    error_type: issue.label,
    error_count: issue.count,
    severity: issue.severity,
    status: 'open',
    affected_urls: issue.affectedUrls.map((affected) => ({
      url: affected.url,
      reason: affected.reason,
      status_code: affected.statusCode ?? null,
      detected_at: affected.detectedAt,
      additional_info: affected.additionalInfo ?? {}
    })),
    screenshots: []
  }));

  const { data, error } = await db.from('technical_errors').insert(rows).select('*');
  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('technical_errors')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('technical_errors', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to persist technical errors', 500, { cause: error.message });
  }

  return (data ?? []) as Array<Record<string, unknown>>;
}

function mapTaskRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ''),
    projectId: String(row.project_id ?? ''),
    userId: String(row.user_id ?? ''),
    provider: typeof row.provider === 'string' ? row.provider : 'dataforseo',
    externalTaskId: typeof row.external_task_id === 'string' ? row.external_task_id : null,
    targetUrl: typeof row.target_url === 'string' ? row.target_url : '',
    maxCrawlPages: typeof row.max_crawl_pages === 'number' ? row.max_crawl_pages : getDataForSEOPageLimit(),
    status: typeof row.status === 'string' ? row.status : 'queued',
    pagesCrawled: typeof row.pages_crawled === 'number' ? row.pages_crawled : 0,
    pagesTotal: typeof row.pages_total === 'number' ? row.pages_total : null,
    progressPercent: typeof row.progress_percent === 'number' ? row.progress_percent : 0,
    totalErrorsFound: typeof row.total_errors_found === 'number' ? row.total_errors_found : 0,
    errorsBySeverity: (row.errors_by_severity ?? {}) as Record<string, number>,
    estimatedCostUsd: typeof row.estimated_cost_usd === 'number' ? row.estimated_cost_usd : null,
    actualCostUsd: typeof row.actual_cost_usd === 'number' ? row.actual_cost_usd : null,
    submittedAt: typeof row.submitted_at === 'string' ? row.submitted_at : null,
    startedAt: typeof row.started_at === 'string' ? row.started_at : null,
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
    durationSeconds: typeof row.duration_seconds === 'number' ? row.duration_seconds : null,
    errorMessage: typeof row.error_message === 'string' ? row.error_message : null,
    retryCount: typeof row.retry_count === 'number' ? row.retry_count : 0,
    rawSummary: (row.raw_summary ?? {}) as Record<string, unknown>,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null
  };
}

export async function createAuditTask(userId: string, projectId: string) {
  const project = await verifyProjectAccess(userId, projectId);
  const targetUrl = typeof project.website_url === 'string' ? project.website_url : '';
  if (!targetUrl) {
    throw new AppError('VALIDATION_ERROR', 'Project website URL is missing.', 422);
  }

  const estimatedCostUsd = Number((getDataForSEOPageLimit() * 0.000125).toFixed(4));
  const { data: row, error } = await db
    .from('audit_tasks')
    .insert({
      project_id: projectId,
      user_id: userId,
      provider: 'dataforseo',
      target_url: targetUrl,
      max_crawl_pages: getDataForSEOPageLimit(),
      status: 'queued',
      estimated_cost_usd: estimatedCostUsd
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to create audit task', 500, { cause: error.message });
  }

  const task = mapTaskRow(row as Record<string, unknown>);
  let external;
  try {
    external = await submitOnPageAudit(targetUrl);
  } catch (integrationError) {
    const message =
      integrationError instanceof AppError
        ? integrationError.message
        : integrationError instanceof Error
          ? integrationError.message
          : 'Failed to submit DataForSEO audit.';

    await db
      .from('audit_tasks')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    throw integrationError;
  }
  const externalTask = external.tasks?.[0];

  if (!externalTask?.id) {
    throw new AppError('INTEGRATION_ERROR', 'DataForSEO did not return a task id.', 502);
  }

  const { data: updated, error: updateError } = await db
    .from('audit_tasks')
    .update({
      external_task_id: externalTask.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      actual_cost_usd: typeof externalTask.cost === 'number' ? externalTask.cost : task.estimatedCostUsd,
      updated_at: new Date().toISOString(),
      raw_summary: {
        ...task.rawSummary,
        dataforseo_task: externalTask
      }
    })
    .eq('id', task.id)
    .select('*')
    .single();

  if (updateError) {
    if (isMissingRelationError(updateError) || String(updateError.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: updateError.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to update audit task', 500, { cause: updateError.message });
  }

  return mapTaskRow(updated as Record<string, unknown>);
}

export async function getAuditTask(userId: string, taskId: string) {
  const { data, error } = await db
    .from('audit_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load audit task', 500, { cause: error.message });
  }

  if (!data) {
    notFound('Audit task not found');
  }

  return mapTaskRow(data as Record<string, unknown>);
}

export async function cancelAuditTask(userId: string, taskId: string) {
  const task = await getAuditTask(userId, taskId);

  const { data, error } = await db
    .from('audit_tasks')
    .update({
      status: 'cancelled',
      error_message: 'Cancelled by user',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to cancel audit task', 500, { cause: error.message });
  }

  return mapTaskRow(data as Record<string, unknown>);
}

export async function pollAuditTask(userId: string, taskId: string) {
  const task = await getAuditTask(userId, taskId);

  if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
    return {
      task,
      auditResult: null
    };
  }

  if (!task.externalTaskId) {
    throw new AppError('INTEGRATION_ERROR', 'Audit task is missing the external DataForSEO task id.', 502);
  }

  const rawAudit = await getAuditPages(task.externalTaskId);
  const dataforseoResult = parseDataForSEOOnPageResult(rawAudit);

  const rawResponse = rawAudit.rawSummary?.result as Record<string, unknown> | undefined;
  const pages = dataforseoResult.pages;
  const issues = dataforseoResult.issues;
  const summary = summarizeDataForSEOIssues(issues);
  const progress =
    rawAudit.progress === 'finished'
      ? 'completed'
      : rawAudit.progress === 'failed'
        ? 'failed'
        : 'in_progress';

  const actualCost = typeof rawAudit.actualCostUsd === 'number' ? rawAudit.actualCostUsd : task.actualCostUsd;
  const pagesTotal = typeof dataforseoResult.pagesTotal === 'number' ? dataforseoResult.pagesTotal : null;
  const pagesCrawled = dataforseoResult.pagesCrawled || pages.length;
  const progressPercent = dataforseoResult.progressPercent || (pagesTotal ? Math.min(100, Math.round((pagesCrawled / pagesTotal) * 100)) : 0);

  if (progress === 'completed') {
    const rows = await replaceDataForSEOErrors(task.projectId, issues, {
      ...dataforseoResult.rawSummary,
      dataforseo: rawResponse
    });
    const { data, error } = await db
      .from('audit_tasks')
      .update({
        status: 'completed',
        pages_crawled: pagesCrawled,
        pages_total: pagesTotal,
        progress_percent: progressPercent,
        total_errors_found: summary.totalErrorsFound,
        errors_by_severity: summary.bySeverity,
        actual_cost_usd: actualCost,
        completed_at: new Date().toISOString(),
        duration_seconds: task.submittedAt ? Math.max(0, Math.round((Date.now() - new Date(task.submittedAt).getTime()) / 1000)) : null,
        raw_summary: {
          ...task.rawSummary,
          dataforseo: rawResponse,
          processed_at: new Date().toISOString(),
          error_rows: rows.length
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select('*')
      .single();

    if (error) {
      if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
        throw new AppError(
          'INTERNAL_ERROR',
          relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
          500,
          { cause: error.message }
        );
      }

      throw new AppError('INTERNAL_ERROR', 'Failed to finalize audit task', 500, { cause: error.message });
    }

    return {
      task: mapTaskRow(data as Record<string, unknown>),
      auditResult: {
        ...dataforseoResult,
        issues,
        pages,
        progress: 'finished' as const,
        progressPercent,
        actualCostUsd: actualCost,
        rawSummary: {
          ...dataforseoResult.rawSummary,
          summary
        }
      }
    };
  }

  const { data, error } = await db
    .from('audit_tasks')
    .update({
      status: 'in_progress',
      pages_crawled: pagesCrawled,
      pages_total: pagesTotal,
      progress_percent: progressPercent,
      actual_cost_usd: actualCost,
      updated_at: new Date().toISOString(),
      raw_summary: {
        ...task.rawSummary,
        dataforseo: rawResponse
      }
    })
    .eq('id', task.id)
    .select('*')
    .single();

  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to update audit task progress', 500, { cause: error.message });
  }

  return {
    task: mapTaskRow(data as Record<string, unknown>),
    auditResult: {
      ...dataforseoResult,
      issues,
      pages,
      progress: 'in_progress' as const,
      progressPercent,
      actualCostUsd: actualCost,
      rawSummary: {
        ...dataforseoResult.rawSummary,
        summary
      }
    }
  };
}

export async function listAuditTasks(projectId: string) {
  const { data, error } = await db
    .from('audit_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingRelationError(error) || String(error.message).toLowerCase().includes('audit_tasks')) {
      throw new AppError(
        'INTERNAL_ERROR',
        relationErrorMessage('audit_tasks', 'lib/db/migrations/0005_dataforseo_audit_tasks.sql'),
        500,
        { cause: error.message }
      );
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to list audit tasks', 500, { cause: error.message });
  }

  return (data ?? []).map((row) => mapTaskRow(row as Record<string, unknown>));
}

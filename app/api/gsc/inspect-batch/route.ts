import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getDiscoveredURLs } from '@/lib/gsc-client';
import { extractFromInspections } from '@/lib/gsc/inspection-extractor';
import { getGoogleAccessToken, getGoogleConnection } from '@/lib/services/google-integrations';
import { getLatestGSCInspection } from '@/lib/services/technical-signals';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

const inspectBatchSchema = z.object({
  projectId: z.string().min(1)
});

async function loadProject(userId: string, projectId: string) {
  const { data: project, error } = await db
    .from('projects')
    .select('id, user_id, website_url')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load project', 500, { cause: error.message });
  }

  if (!project) {
    throw new AppError('NOT_FOUND', 'Project not found', 404);
  }

  return project as { id: string; user_id: string; website_url: string };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, inspectBatchSchema);
    const project = await loadProject(user.id, input.projectId);
    const connection = await getGoogleConnection(user.id, 'gsc');
    if (!connection) {
      throw new AppError('CONFLICT', 'GSC is not connected', 400);
    }

    const propertyUrl = String(connection.connected_resource?.siteUrl ?? connection.connected_resource?.property_url ?? '').trim();
    if (!propertyUrl) {
      throw new AppError('VALIDATION_ERROR', 'GSC property has not been selected', 400);
    }

    const accessToken = await getGoogleAccessToken(user.id, 'gsc');
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 28);
    const discoveredUrls = await getDiscoveredURLs(accessToken, propertyUrl, startDate.toISOString().slice(0, 10), today);
    const maxUrls = Math.max(1, Math.min(200, Number(process.env.GSC_URL_INSPECTION_MAX_URLS ?? '200') || 200));
    const urls = Array.from(new Set([project.website_url, ...discoveredUrls])).slice(0, maxUrls);

    const summary = await extractFromInspections({
      accessToken,
      propertyUrl,
      urls
    });

    const { error: deleteError } = await db.from('gsc_inspection_results').delete().eq('project_id', project.id);
    if (deleteError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to clear previous GSC inspection results', 500, { cause: deleteError.message });
    }

    const { error } = await db.from('gsc_inspection_results').insert({
      project_id: project.id,
      user_id: user.id,
      total_urls_inspected: summary.inspectedUrls,
      crawl_errors_total: summary.crawlErrorsTotal,
      crawl_errors_breakdown: summary.crawlErrorsBreakdown,
      mobile_usability_issues_total: summary.mobileUsabilityIssuesTotal,
      mobile_usability_breakdown: summary.mobileUsabilityBreakdown,
      robots_blocked_count: summary.robotsBlockedCount,
      affected_urls: summary.affectedUrls,
      raw_response: summary.rawResponse,
      inspected_at: summary.inspectedAt
    });

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to save GSC inspection results', 500, { cause: error.message });
    }

    const latest = await getLatestGSCInspection(project.id);
    return ok({
      summary: latest,
      urls
    });
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getDiscoveredURLs } from '@/lib/gsc-client';
import { runPSIBatchWithDiagnostics } from '@/lib/psi/client';
import { getGoogleAccessToken, getGoogleConnection } from '@/lib/services/google-integrations';
import { getLatestPSIAudits } from '@/lib/services/technical-signals';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

const runPsiSchema = z.object({
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
    const input = await parseJsonBody(request, runPsiSchema);
    const project = await loadProject(user.id, input.projectId);
    const baseUrl = project.website_url;
    const urls = new Set<string>([baseUrl]);

    try {
      const gscConnection = await getGoogleConnection(user.id, 'gsc');
      const selectedProperty = String(gscConnection?.connected_resource?.siteUrl ?? gscConnection?.connected_resource?.property_url ?? '').trim();
      if (selectedProperty) {
        const accessToken = await getGoogleAccessToken(user.id, 'gsc');
        const today = new Date().toISOString().slice(0, 10);
        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - 28);
        const urlsFromGSC = await getDiscoveredURLs(accessToken, selectedProperty, startDate.toISOString().slice(0, 10), today);
        const maxUrls = Math.max(1, Math.min(10, Number(process.env.PAGESPEED_INSIGHTS_MAX_URLS_PER_AUDIT ?? '10') || 10));
        urlsFromGSC.slice(0, Math.max(0, maxUrls - 1)).forEach((item) => urls.add(item));
      }
    } catch {
      // Fallback to homepage-only PSI when GSC access is unavailable.
    }

    const urlsToAudit = Array.from(urls).filter(Boolean).slice(0, Math.max(1, Math.min(10, Number(process.env.PAGESPEED_INSIGHTS_MAX_URLS_PER_AUDIT ?? '10') || 10)));
    const { results, failures } = await runPSIBatchWithDiagnostics(urlsToAudit, 'mobile');
    const fetchedAt = new Date().toISOString();
    const rows = results
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        project_id: project.id,
        user_id: user.id,
        audited_url: item.url,
        strategy: item.strategy,
        lcp_value: item.lcp.value,
        lcp_score: item.lcp.score,
        cls_value: item.cls.value,
        cls_score: item.cls.score,
        inp_value: item.inp.value,
        inp_score: item.inp.score,
        performance_score: item.performanceScore,
        accessibility_score: item.accessibilityScore,
        best_practices_score: item.bestPracticesScore,
        seo_score: item.seoScore,
        overall_pass: item.overallPass,
        audits_failed: item.auditsFailed,
        raw_response: item.rawResponse,
        fetched_at: fetchedAt
      }));

    if (rows.length > 0) {
      const { error: deleteError } = await db.from('psi_audits').delete().eq('project_id', project.id);
      if (deleteError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to clear previous PSI audits', 500, { cause: deleteError.message });
      }

      const { error } = await db.from('psi_audits').insert(rows);
      if (error) {
        throw new AppError('INTERNAL_ERROR', 'Failed to save PSI audits', 500, { cause: error.message });
      }
    }

    const summary = await getLatestPSIAudits(project.id);
    return ok({
      summary,
      urls: urlsToAudit,
      count: rows.length,
      message:
        rows.length === 0
          ? 'PSI refresh did not return new data. Showing the last saved audit, if available.'
          : null,
      failures: failures.slice(0, 10)
    });
  } catch (error) {
    return fail(error);
  }
}

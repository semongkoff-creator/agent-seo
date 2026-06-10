import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import type { PSIAuditRecord } from '@/lib/psi/types';
import type { GSCInspectionSummary } from '@/lib/gsc/inspection-extractor';

type PsiAuditRow = Record<string, unknown>;
type GscInspectionRow = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, item]) => {
    acc[key] = asNumber(item);
    return acc;
  }, {});
}

export async function getLatestGSCInspection(projectId: string): Promise<GSCInspectionSummary | null> {
  const { data, error } = await db
    .from('gsc_inspection_results')
    .select('*')
    .eq('project_id', projectId)
    .order('inspected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (String(error.message ?? '').toLowerCase().includes('relation')) {
      return null;
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to load latest GSC inspection', 500, { cause: error.message });
  }

  if (!data) {
    return null;
  }

  const row = data as GscInspectionRow;
  return {
    sourceLabel: 'GSC URL Inspection',
    inspectedUrls: asNumber(row.total_urls_inspected),
    crawlErrorsTotal: asNumber(row.crawl_errors_total),
    crawlErrorsBreakdown: asNumberRecord(row.crawl_errors_breakdown),
    mobileUsabilityIssuesTotal: asNumber(row.mobile_usability_issues_total),
    mobileUsabilityBreakdown: asNumberRecord(row.mobile_usability_breakdown),
    robotsBlockedCount: asNumber(row.robots_blocked_count),
    affectedUrls: Array.isArray(row.affected_urls)
      ? (row.affected_urls as Array<Record<string, unknown>>).map((item) => ({
          url: typeof item.url === 'string' ? item.url : '',
          detail: typeof item.detail === 'string' ? item.detail : typeof item.message === 'string' ? item.message : 'Inspection result'
        }))
      : [],
    rawResponse: asRecord(row.raw_response),
    inspectedAt: typeof row.inspected_at === 'string' ? row.inspected_at : new Date().toISOString()
  };
}

function scoreValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function getLatestPSIAudits(projectId: string) {
  const { data, error } = await db
    .from('psi_audits')
    .select('*')
    .eq('project_id', projectId)
    .order('fetched_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    if (String(error.message ?? '').toLowerCase().includes('relation')) {
      return null;
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to load latest PSI audits', 500, { cause: error.message });
  }

  const rows = (data ?? []) as PsiAuditRow[];
  if (rows.length === 0) {
    return null;
  }

  const records: PSIAuditRecord[] = rows.map((row) => ({
    url: String(row.audited_url ?? ''),
    strategy: row.strategy === 'desktop' ? 'desktop' : 'mobile',
    lcp: {
      value: scoreValue(row.lcp_value),
      score: row.lcp_score === 'good' || row.lcp_score === 'needs_improvement' || row.lcp_score === 'poor' ? row.lcp_score : 'needs_improvement'
    },
    cls: {
      value: scoreValue(row.cls_value),
      score: row.cls_score === 'good' || row.cls_score === 'needs_improvement' || row.cls_score === 'poor' ? row.cls_score : 'needs_improvement'
    },
    inp: {
      value: scoreValue(row.inp_value),
      score: row.inp_score === 'good' || row.inp_score === 'needs_improvement' || row.inp_score === 'poor' ? row.inp_score : 'needs_improvement'
    },
    performanceScore: scoreValue(row.performance_score),
    accessibilityScore: scoreValue(row.accessibility_score),
    bestPracticesScore: scoreValue(row.best_practices_score),
    seoScore: scoreValue(row.seo_score),
    auditsFailed: Array.isArray(row.audits_failed)
      ? (row.audits_failed as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? ''),
          score: typeof item.score === 'number' ? item.score : null,
          displayValue: typeof item.displayValue === 'string' ? item.displayValue : undefined
        }))
      : [],
    overallPass:
      asBoolean(row.overall_pass) ||
      [row.performance_score, row.accessibility_score, row.best_practices_score, row.seo_score].every((value) => scoreValue(value) >= 90),
    rawResponse: asRecord(row.raw_response),
    fetchedAt: typeof row.fetched_at === 'string' ? row.fetched_at : new Date().toISOString()
  }));

  const homepage = records.find((item) => item.url === rows[0]?.audited_url) ?? records[0];
  const overallPass = records.every((item) => item.overallPass);

  return {
    sourceLabel: 'PageSpeed Insights',
    auditedUrls: records.length,
    overallPass,
    primary: homepage,
    records
  };
}

export async function getLatestTechnicalSignals(projectId: string) {
  const [gscInspection, psiAudits] = await Promise.all([getLatestGSCInspection(projectId), getLatestPSIAudits(projectId)]);

  return {
    crawl_errors_count: gscInspection?.crawlErrorsTotal ?? 0,
    core_web_vitals_pass: psiAudits?.overallPass ?? false,
    mobile_usability_count: gscInspection?.mobileUsabilityIssuesTotal ?? 0,
    technical_signals: {
      gsc: gscInspection,
      psi: psiAudits
    }
  };
}

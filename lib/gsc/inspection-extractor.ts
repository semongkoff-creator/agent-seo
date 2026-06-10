import { inspectURLDetailed } from '@/lib/gsc-client';

type CrawlErrorType = 'soft_404' | 'not_found' | 'server_error' | 'access_denied' | 'redirect_error';

type GSCInspectionSample = {
  url: string;
  errorType?: CrawlErrorType;
  detail: string;
};

export type GSCInspectionSummary = {
  sourceLabel: 'GSC URL Inspection';
  inspectedUrls: number;
  crawlErrorsTotal: number;
  crawlErrorsBreakdown: Record<string, number>;
  mobileUsabilityIssuesTotal: number;
  mobileUsabilityBreakdown: Record<string, number>;
  robotsBlockedCount: number;
  affectedUrls: GSCInspectionSample[];
  rawResponse: Record<string, unknown>;
  inspectedAt: string;
};

function normalizePageFetchState(value: unknown): CrawlErrorType | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (value === 'SUCCESSFUL' || value === 'PAGE_FETCH_STATE_UNSPECIFIED' || value === 'UNKNOWN') {
    return null;
  }

  if (value === 'SOFT_404') return 'soft_404';
  if (value === 'NOT_FOUND') return 'not_found';
  if (value === 'ACCESS_DENIED') return 'access_denied';
  if (value === 'REDIRECT_ERROR') return 'redirect_error';
  if (value === 'SERVER_ERROR') return 'server_error';

  if (/404/i.test(value)) return 'not_found';
  if (/redirect/i.test(value)) return 'redirect_error';
  if (/denied|forbidden|blocked/i.test(value)) return 'access_denied';
  if (/server|fetch/i.test(value)) return 'server_error';
  return null;
}

export async function extractFromInspections(input: {
  accessToken: string;
  propertyUrl: string;
  urls: string[];
}): Promise<GSCInspectionSummary> {
  const crawlErrorsBreakdown: Record<string, number> = {};
  const mobileUsabilityBreakdown: Record<string, number> = {};
  const affectedUrls: GSCInspectionSample[] = [];
  let crawlErrorsTotal = 0;
  let mobileUsabilityIssuesTotal = 0;
  let robotsBlockedCount = 0;

  const concurrency = 5;
  for (let index = 0; index < input.urls.length; index += concurrency) {
    const batch = input.urls.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => ({
        url,
        inspection: await inspectURLDetailed(input.accessToken, input.propertyUrl, url)
      }))
    );

    for (const { url, inspection } of batchResults) {
      if (!inspection) {
        continue;
      }

      const indexStatusResult = inspection.indexStatusResult ?? {};
      const pageFetchState = indexStatusResult.pageFetchState;
      const errorType = normalizePageFetchState(pageFetchState);

      if (errorType) {
        crawlErrorsTotal += 1;
        crawlErrorsBreakdown[errorType] = (crawlErrorsBreakdown[errorType] ?? 0) + 1;
        if (affectedUrls.length < 50) {
          affectedUrls.push({
            url,
            errorType,
            detail: `Page fetch state: ${String(pageFetchState ?? 'UNKNOWN')}`
          });
        }
      }

      if (indexStatusResult.robotsTxtState === 'DISALLOWED') {
        robotsBlockedCount += 1;
      }

      const mobileUsabilityResult = inspection.mobileUsabilityResult ?? {};
      const issues = Array.isArray(mobileUsabilityResult.issues) ? mobileUsabilityResult.issues : [];
      if (issues.length > 0) {
        mobileUsabilityIssuesTotal += issues.length;
        for (const issue of issues as Array<Record<string, unknown>>) {
          const issueType = typeof issue.issueType === 'string' && issue.issueType ? issue.issueType : 'UNKNOWN_ISSUE';
          mobileUsabilityBreakdown[issueType] = (mobileUsabilityBreakdown[issueType] ?? 0) + 1;
          if (affectedUrls.length < 50) {
            affectedUrls.push({
              url,
              detail: typeof issue.message === 'string' ? issue.message : issueType
            });
          }
        }
      }
    }

    if (index + concurrency < input.urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return {
    sourceLabel: 'GSC URL Inspection',
    inspectedUrls: input.urls.length,
    crawlErrorsTotal,
    crawlErrorsBreakdown,
    mobileUsabilityIssuesTotal,
    mobileUsabilityBreakdown,
    robotsBlockedCount,
    affectedUrls,
    rawResponse: {},
    inspectedAt: new Date().toISOString()
  };
}

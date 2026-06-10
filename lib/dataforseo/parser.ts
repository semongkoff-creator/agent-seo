import { aggregatePageIssues, mapPageToIssues } from './error-mapper';
import type { DataForSEOAggregateIssue, DataForSEOOnPageAuditResult, DataForSEOPageDetail } from './types';

function getPageUrl(page: Record<string, unknown>) {
  return typeof page.url === 'string' && page.url ? page.url : typeof page.location === 'string' ? page.location : '';
}

function normalizePage(page: Record<string, unknown>) {
  const normalized = { ...page } as Record<string, unknown>;
  if (!normalized.url) {
    const url = getPageUrl(page);
    if (url) {
      normalized.url = url;
    }
  }

  return normalized;
}

export function parseDataForSEOOnPageResult(input: DataForSEOOnPageAuditResult): DataForSEOOnPageAuditResult {
  const detectedAt = new Date().toISOString();
  const normalizedPages: DataForSEOPageDetail[] = [];

  for (const page of input.pages) {
    const matches = mapPageToIssues(
      normalizePage({
        ...page.additionalInfo,
        url: page.url,
        status_code: page.statusCode,
        crawl_progress: page.crawlProgress,
        onpage_score: page.onpageScore
      }),
      page.detectedAt ?? detectedAt
    );

    if (matches.length === 0) {
      continue;
    }

    normalizedPages.push(...matches);
  }

  const issues = aggregatePageIssues(normalizedPages);

  return {
    ...input,
    pages: normalizedPages,
    issues,
    rawSummary: {
      ...input.rawSummary,
      detectedAt
    }
  };
}

export function summarizeDataForSEOIssues(issues: DataForSEOAggregateIssue[]) {
  return issues.reduce(
    (acc, issue) => {
      acc.totalErrorsFound += issue.count;
      acc.bySeverity[issue.severity] += issue.count;
      return acc;
    },
    {
      totalErrorsFound: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    }
  );
}

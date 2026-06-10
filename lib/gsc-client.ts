import { AppError } from '@/lib/errors';
import type { GSCMockData } from '@/types/wizard';
import type { GSCProperty } from '@/lib/validators/google-integrations';

type GSCSearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export type URLInspectionResult = {
  url: string;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL';
  indexStatus: string;
};

export type URLInspectionDetailedResult = URLInspectionResult & {
  raw: Record<string, unknown>;
  indexStatusResult: Record<string, unknown>;
  mobileUsabilityResult: Record<string, unknown>;
};

type SitemapSummary = {
  submitted: number;
  indexed: number;
  sitemapsCount: number;
};

type IndexedPagesSummary = {
  method: 'url_inspection' | 'hybrid_estimate' | 'sitemap_fallback';
  total_pages: number;
  indexed_pages: number;
  not_indexed_pages: number;
  coverage_percent: number;
  sample_size?: number;
  confidence: 'high' | 'medium' | 'low';
  details?: Record<string, unknown>;
};

function parseDateRange(dateRange?: string) {
  const today = new Date();
  const toDateString = (date: Date) => date.toISOString().slice(0, 10);
  const start = (daysAgo: number) => {
    const next = new Date(today);
    next.setUTCDate(today.getUTCDate() - daysAgo);
    return toDateString(next);
  };

  if (!dateRange || dateRange === 'last_28_days' || dateRange === '28d') {
    return { startDate: start(28), endDate: toDateString(today) };
  }

  if (dateRange === 'last_7_days' || dateRange === '7d') {
    return { startDate: start(7), endDate: toDateString(today) };
  }

  return { startDate: start(28), endDate: toDateString(today) };
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError('INTEGRATION_ERROR', 'Google Search Console request failed', response.status, { body });
  }
  return body;
}

function normalizeUrlCandidate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listGSCProperties(accessToken: string): Promise<GSCProperty[]> {
  const body = await fetchJson('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { authorization: `Bearer ${accessToken}` }
  });

  const entries = Array.isArray(body?.siteEntry) ? body.siteEntry : [];
  return entries.map((entry: Record<string, unknown>) => ({
    siteUrl: String(entry.siteUrl ?? ''),
    permissionLevel: typeof entry.permissionLevel === 'string' ? entry.permissionLevel : undefined,
    verified: Boolean(entry.verified)
  }));
}

export async function getDiscoveredURLs(accessToken: string, propertyUrl: string, startDate: string, endDate: string) {
  const urls = new Set<string>();
  let startRow = 0;
  const rowLimit = 25000;

  while (true) {
    const body = await fetchJson(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit,
          startRow
        })
      }
    );

    const rows = Array.isArray(body?.rows) ? (body.rows as GSCSearchRow[]) : [];
    rows.forEach((row) => {
      const url = normalizeUrlCandidate(row.keys?.[0]);
      if (url) {
        urls.add(url);
      }
    });

    if (rows.length < rowLimit) {
      break;
    }

    startRow += rowLimit;
    if (startRow > 100000) {
      break;
    }
  }

  return Array.from(urls);
}

export async function getSitemapData(accessToken: string, propertyUrl: string): Promise<SitemapSummary> {
  const body = await fetchJson(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });

  const sitemaps = Array.isArray(body?.sitemap) ? body.sitemap : [];
  const summary: SitemapSummary = { submitted: 0, indexed: 0, sitemapsCount: 0 };

  for (const sitemap of sitemaps as Array<Record<string, unknown>>) {
    const contents = Array.isArray(sitemap.contents) ? sitemap.contents : [];
    const content = (contents[0] as Record<string, unknown> | undefined) ?? {};
    const submitted = Number(content.submitted ?? 0) || 0;
    const indexed = Number(content.indexed ?? 0) || 0;

    summary.submitted += submitted;
    summary.indexed += indexed;
    summary.sitemapsCount += 1;
  }

  return summary;
}

export async function inspectURL(accessToken: string, propertyUrl: string, inspectUrl: string): Promise<URLInspectionResult | null> {
  const detailed = await inspectURLDetailed(accessToken, propertyUrl, inspectUrl);
  if (!detailed) {
    return null;
  }

  return {
    url: detailed.url,
    verdict: detailed.verdict,
    indexStatus: detailed.indexStatus
  };
}

export async function inspectURLDetailed(accessToken: string, propertyUrl: string, inspectUrl: string): Promise<URLInspectionDetailedResult | null> {
  try {
    const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inspectionUrl: inspectUrl,
        siteUrl: propertyUrl,
        languageCode: 'en-US'
      }),
      signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(15000)
        : undefined
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
      }
      return null;
    }

    const data = await response.json();
    const indexStatus = data?.inspectionResult?.indexStatusResult ?? {};
    const mobileUsabilityResult = data?.inspectionResult?.mobileUsabilityResult ?? {};

    return {
      url: inspectUrl,
      verdict: indexStatus.verdict ?? 'NEUTRAL',
      indexStatus: indexStatus.indexingState ?? 'UNKNOWN',
      raw: data,
      indexStatusResult: indexStatus,
      mobileUsabilityResult
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
      throw error;
    }
    return null;
  }
}

async function batchInspectURLs(accessToken: string, propertyUrl: string, urls: string[]) {
  const CONCURRENCY = 5;
  const DELAY_MS = 200;
  const results: Array<URLInspectionResult | null> = [];

  for (let index = 0; index < urls.length; index += CONCURRENCY) {
    const batch = urls.slice(index, index + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((url) => inspectURL(accessToken, propertyUrl, url)));
    results.push(...batchResults);

    if (index + CONCURRENCY < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}

function sampleURLsStrategically(allURLs: string[], sampleSize: number): string[] {
  if (allURLs.length <= sampleSize) {
    return [...allURLs];
  }

  const byDepth: Record<number, string[]> = {};
  allURLs.forEach((url) => {
    try {
      const depth = new URL(url).pathname.split('/').filter(Boolean).length;
      byDepth[depth] ??= [];
      byDepth[depth].push(url);
    } catch {
      byDepth[0] ??= [];
      byDepth[0].push(url);
    }
  });

  const sampled: string[] = [];
  const depths = Object.keys(byDepth)
    .map(Number)
    .sort((a, b) => a - b);
  const samplesPerGroup = Math.max(1, Math.ceil(sampleSize / Math.max(1, depths.length)));

  for (const depth of depths) {
    const shuffled = [...byDepth[depth]].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, samplesPerGroup));
    if (sampled.length >= sampleSize) {
      break;
    }
  }

  return sampled.slice(0, sampleSize);
}

function summarizeIndexCoverage(
  method: IndexedPagesSummary['method'],
  total: number,
  indexed: number,
  confidence: IndexedPagesSummary['confidence'],
  details?: Record<string, unknown>,
  sampleSize?: number
): IndexedPagesSummary {
  return {
    method,
    total_pages: total,
    indexed_pages: indexed,
    not_indexed_pages: Math.max(0, total - indexed),
    coverage_percent: total > 0 ? Math.round((indexed / total) * 100) : 0,
    confidence,
    sample_size: sampleSize,
    details
  };
}

async function resolveIndexedPagesSummary(accessToken: string, propertyUrl: string, startDate: string, endDate: string) {
  const discoveredURLs = await getDiscoveredURLs(accessToken, propertyUrl, startDate, endDate);
  const sitemapData = await getSitemapData(accessToken, propertyUrl);
  const totalKnownURLs = Math.max(discoveredURLs.length, sitemapData.submitted);

  if (totalKnownURLs === 0) {
    return summarizeIndexCoverage('sitemap_fallback', 0, 0, 'low', {
      discovered_urls: discoveredURLs.length,
      sitemap_submitted: sitemapData.submitted,
      sitemap_indexed: sitemapData.indexed
    });
  }

  if (totalKnownURLs <= 100) {
    const urlsToCheck = discoveredURLs.length > 0 ? discoveredURLs : [propertyUrl];
    const results = await batchInspectURLs(accessToken, propertyUrl, urlsToCheck);
    const indexed = results.filter((result) => result?.verdict === 'PASS').length;
    return summarizeIndexCoverage(
      'url_inspection',
      results.length,
      indexed,
      'high',
      {
        discovered_urls: discoveredURLs.length,
        sitemap_submitted: sitemapData.submitted,
        sitemap_indexed: sitemapData.indexed,
        inspected_urls: results.length
      },
      results.length
    );
  }

  if (totalKnownURLs <= 2000) {
    const sampleSize = Math.min(200, totalKnownURLs);
    const sampledURLs = sampleURLsStrategically(discoveredURLs.length > 0 ? discoveredURLs : [propertyUrl], sampleSize);
    const results = await batchInspectURLs(accessToken, propertyUrl, sampledURLs);
    const inspected = results.filter((result): result is URLInspectionResult => Boolean(result));
    const indexedRatio = inspected.length > 0 ? inspected.filter((result) => result.verdict === 'PASS').length / inspected.length : 0;
    const estimatedIndexed = Math.round(totalKnownURLs * indexedRatio);

    return summarizeIndexCoverage(
      'url_inspection',
      totalKnownURLs,
      estimatedIndexed,
      'medium',
      {
        discovered_urls: discoveredURLs.length,
        sitemap_submitted: sitemapData.submitted,
        sitemap_indexed: sitemapData.indexed,
        sampled_urls: sampledURLs.length,
        sampled_indexed: inspected.filter((result) => result.verdict === 'PASS').length,
        extrapolation_basis: `${sampledURLs.length} URLs sampled from ${totalKnownURLs} total`
      },
      sampledURLs.length
    );
  }

  throw new Error('SITE_TOO_LARGE_USE_HYBRID');
}

async function resolveHybridIndexedPagesSummary(
  accessToken: string,
  propertyUrl: string,
  startDate: string,
  endDate: string
) {
  const sitemapData = await getSitemapData(accessToken, propertyUrl);
  const discoveredURLs = await getDiscoveredURLs(accessToken, propertyUrl, startDate, endDate);
  const estimatedTotal = Math.max(sitemapData.submitted, discoveredURLs.length);
  const sitemapCoverage = sitemapData.submitted > 0 ? sitemapData.indexed / sitemapData.submitted : 0;
  const estimatedIndexed = Math.max(
    sitemapData.indexed,
    Math.round(estimatedTotal * (sitemapCoverage > 0 ? sitemapCoverage : 0.5))
  );

  return summarizeIndexCoverage('hybrid_estimate', estimatedTotal, estimatedIndexed, 'medium', {
    discovered_urls: discoveredURLs.length,
    sitemap_submitted: sitemapData.submitted,
    sitemap_indexed: sitemapData.indexed
  });
}

async function resolveSitemapFallbackIndexedPagesSummary(accessToken: string, propertyUrl: string) {
  const sitemapData = await getSitemapData(accessToken, propertyUrl);
  return summarizeIndexCoverage(
    'sitemap_fallback',
    sitemapData.submitted,
    sitemapData.indexed,
    'low',
    {
      sitemap_submitted: sitemapData.submitted,
      sitemap_indexed: sitemapData.indexed,
      sitemaps_count: sitemapData.sitemapsCount
    }
  );
}

async function resolveKeywordPositionSummary(accessToken: string, propertyUrl: string, startDate: string, endDate: string) {
  const body = await fetchJson(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 30,
        aggregationType: 'auto'
      })
    }
  );

  const rows = (Array.isArray(body?.rows) ? body.rows : []) as GSCSearchRow[];
  const keywords = rows
    .map((row) => normalizeUrlCandidate(row.keys?.[0]))
    .filter((value): value is string => Boolean(value));
  const averagePosition =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + (Number(row.position ?? 0) || 0), 0) / rows.length
      : 0;

  return {
    metricType: 'keyword_position',
    metricValue: {
      avg_position: Number(averagePosition.toFixed(2)),
      keywords,
      sample_size: keywords.length
    }
  };
}

export async function syncGSCMetrics(input: {
  accessToken: string;
  propertyUrl: string;
  dateRange?: string;
}): Promise<Array<{ metricType: string; metricValue: Record<string, unknown> }>> {
  const range = parseDateRange(input.dateRange);
  const analyticsBody = await fetchJson(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(input.propertyUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        ...range,
        dimensions: ['page'],
        rowLimit: 100,
        aggregationType: 'auto'
      })
    }
  );

  const rows = (Array.isArray(analyticsBody?.rows) ? analyticsBody.rows : []) as GSCSearchRow[];
  const impressions = rows.reduce((sum, row) => sum + (Number(row.impressions ?? 0) || 0), 0);
  const ctr =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + (Number(row.ctr ?? 0) || 0), 0) / rows.length
      : 0;
  const position =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + (Number(row.position ?? 0) || 0), 0) / rows.length
      : 0;

  let indexedPagesSummary: IndexedPagesSummary;
  try {
    indexedPagesSummary = await resolveIndexedPagesSummary(input.accessToken, input.propertyUrl, range.startDate, range.endDate);
  } catch (error) {
    if (error instanceof Error && error.message === 'SITE_TOO_LARGE_USE_HYBRID') {
      indexedPagesSummary = await resolveHybridIndexedPagesSummary(
        input.accessToken,
        input.propertyUrl,
        range.startDate,
        range.endDate
      );
    } else {
      indexedPagesSummary = await resolveSitemapFallbackIndexedPagesSummary(input.accessToken, input.propertyUrl);
    }
  }

  const keywordPosition = await resolveKeywordPositionSummary(
    input.accessToken,
    input.propertyUrl,
    range.startDate,
    range.endDate
  );

  return [
    {
      metricType: 'indexed_pages',
      metricValue: {
        total: indexedPagesSummary.total_pages,
        indexed: indexedPagesSummary.indexed_pages,
        not_indexed: indexedPagesSummary.not_indexed_pages,
        percentage: indexedPagesSummary.coverage_percent,
        measurement_method: indexedPagesSummary.method,
        confidence: indexedPagesSummary.confidence,
        sample_size: indexedPagesSummary.sample_size,
        details: indexedPagesSummary.details ?? {}
      }
    },
    {
      metricType: 'impressions',
      metricValue: {
        value: impressions,
        trend_30d: impressions >= 0 ? 'stable' : 'unknown'
      }
    },
    {
      metricType: 'avg_ctr',
      metricValue: {
        value: Number((ctr * 100).toFixed(2)),
        benchmark: 2.5
      }
    },
    {
      metricType: 'avg_position',
      metricValue: {
        value: Number(position.toFixed(2)),
        benchmark: 10
      }
    },
    keywordPosition
  ];
}

export function gscMetricsToMockData(rows: Array<{ metricType?: string; metricValue?: Record<string, unknown> }>): GSCMockData | null {
  const indexedRow = rows.find((row) => row.metricType === 'indexed_pages' && row.metricValue);
  if (!indexedRow?.metricValue) {
    return null;
  }

  const indexed = Number(indexedRow.metricValue.indexed ?? 0);
  const total = Number(indexedRow.metricValue.total ?? 0);
  const percentage = Number(indexedRow.metricValue.percentage ?? 0);

  if (!Number.isFinite(indexed) || !Number.isFinite(total) || !Number.isFinite(percentage)) {
    return null;
  }

  const measurementMethod =
    indexedRow.metricValue.measurement_method === 'url_inspection' ||
    indexedRow.metricValue.measurement_method === 'hybrid_estimate' ||
    indexedRow.metricValue.measurement_method === 'sitemap_fallback'
      ? indexedRow.metricValue.measurement_method
      : undefined;
  const confidence =
    indexedRow.metricValue.confidence === 'high' ||
    indexedRow.metricValue.confidence === 'medium' ||
    indexedRow.metricValue.confidence === 'low'
      ? indexedRow.metricValue.confidence
      : undefined;
  const sampleSize = Number.isFinite(Number(indexedRow.metricValue.sample_size))
    ? Number(indexedRow.metricValue.sample_size)
    : undefined;
  const details =
    indexedRow.metricValue.details && typeof indexedRow.metricValue.details === 'object'
      ? (indexedRow.metricValue.details as Record<string, unknown>)
      : undefined;

  return {
    indexed,
    total,
    percentage,
    measurementMethod,
    confidence,
    sampleSize,
    details
  };
}

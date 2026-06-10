import { AppError } from '@/lib/errors';
import type { PSIAuditRecord, PSIAuditScore, PSIStrategy } from './types';

const PSI_BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function getApiKey() {
  const apiKey = process.env.PAGESPEED_INSIGHTS_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AppError('INTEGRATION_ERROR', 'PageSpeed Insights API key is not configured.', 502);
  }

  return apiKey.trim();
}

function toScore(value: number, thresholds: [number, number]): PSIAuditScore {
  if (value <= thresholds[0]) {
    return 'good';
  }
  if (value <= thresholds[1]) {
    return 'needs_improvement';
  }
  return 'poor';
}

function normalizeAuditScore(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parsePSIResponse(data: Record<string, unknown>, url: string, strategy: PSIStrategy): PSIAuditRecord {
  const lighthouse = (data.lighthouseResult ?? {}) as Record<string, unknown>;
  const audits = (lighthouse.audits ?? {}) as Record<string, Record<string, unknown>>;
  const categories = (lighthouse.categories ?? {}) as Record<string, Record<string, unknown>>;

  const lcpValue = normalizeAuditScore(audits['largest-contentful-paint']?.numericValue) ?? 0;
  const clsValue = normalizeAuditScore(audits['cumulative-layout-shift']?.numericValue) ?? 0;
  const inpValue =
    normalizeAuditScore(audits['interaction-to-next-paint']?.numericValue) ??
    normalizeAuditScore(audits['experimental-interaction-to-next-paint']?.numericValue) ??
    0;

  const auditsFailed = Object.entries(audits)
    .filter(([, audit]) => {
      const score = normalizeAuditScore(audit.score);
      return score !== null && score < 0.9 && audit.scoreDisplayMode !== 'notApplicable';
    })
    .map(([id, audit]) => ({
      id,
      title: typeof audit.title === 'string' ? audit.title : id,
      score: normalizeAuditScore(audit.score),
      displayValue: typeof audit.displayValue === 'string' ? audit.displayValue : undefined
    }))
    .sort((left, right) => (left.score ?? 1) - (right.score ?? 1))
    .slice(0, 20);

  const performanceScore = Math.round(((categories.performance?.score as number | undefined) ?? 0) * 100);
  const accessibilityScore = Math.round(((categories.accessibility?.score as number | undefined) ?? 0) * 100);
  const bestPracticesScore = Math.round((((categories['best-practices'] ?? categories.best_practices)?.score as number | undefined) ?? 0) * 100);
  const seoScore = Math.round(((categories.seo?.score as number | undefined) ?? 0) * 100);

  return {
    url,
    strategy,
    lcp: { value: lcpValue, score: toScore(lcpValue, [2500, 4000]) },
    cls: { value: clsValue, score: toScore(clsValue, [0.1, 0.25]) },
    inp: { value: inpValue, score: toScore(inpValue, [200, 500]) },
    performanceScore,
    accessibilityScore,
    bestPracticesScore,
    seoScore,
    auditsFailed,
    overallPass: performanceScore >= 90 && accessibilityScore >= 90 && bestPracticesScore >= 90 && seoScore >= 90,
    rawResponse: data,
    fetchedAt: new Date().toISOString()
  };
}

async function runPSIInternal(url: string, strategy: PSIStrategy = 'mobile'): Promise<PSIAuditRecord> {
  const params = new URLSearchParams({
    url,
    key: getApiKey(),
    strategy
  });
  params.append('category', 'performance');
  params.append('category', 'accessibility');
  params.append('category', 'best-practices');
  params.append('category', 'seo');

  const response = await fetch(`${PSI_BASE_URL}?${params.toString()}`, {
    signal:
      typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(60000)
        : undefined
  });

  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }

    throw new AppError('INTEGRATION_ERROR', `PSI request failed with status ${response.status}.`, 502, {
      status: response.status,
      responseBody: bodyText.slice(0, 500)
    });
  }

  const data = (await response.json()) as Record<string, unknown>;
  return parsePSIResponse(data, url, strategy);
}

export async function runPSI(url: string, strategy: PSIStrategy = 'mobile'): Promise<PSIAuditRecord | null> {
  try {
    return await runPSIInternal(url, strategy);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    return null;
  }
}

export async function runPSIWithError(url: string, strategy: PSIStrategy = 'mobile') {
  try {
    const record = await runPSIInternal(url, strategy);
    return { record, error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected PSI failure';
    return { record: null as PSIAuditRecord | null, error: message };
  }
}

export async function runPSIBatch(urls: string[], strategy: PSIStrategy = 'mobile') {
  const results: Array<PSIAuditRecord | null> = [];
  const concurrency = 2;

  for (let index = 0; index < urls.length; index += concurrency) {
    const batch = urls.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          return await runPSI(item, strategy);
        } catch {
          return null;
        }
      })
    );
    results.push(...batchResults);

    if (index + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export async function runPSIBatchWithDiagnostics(urls: string[], strategy: PSIStrategy = 'mobile') {
  const results: Array<PSIAuditRecord | null> = [];
  const failures: Array<{ url: string; error: string }> = [];
  const concurrency = 2;

  for (let index = 0; index < urls.length; index += concurrency) {
    const batch = urls.slice(index, index + concurrency);
    const batchResults = await Promise.all(batch.map((item) => runPSIWithError(item, strategy)));
    batchResults.forEach((result, batchIndex) => {
      results.push(result.record);
      if (result.error) {
        failures.push({ url: batch[batchIndex] ?? '', error: result.error });
      }
    });

    if (index + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { results, failures };
}

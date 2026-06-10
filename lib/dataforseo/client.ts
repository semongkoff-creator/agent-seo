import { AppError } from '@/lib/errors';
import type { DataForSEOOnPageAuditResult, DataForSEOTaskPayload, DataForSEOResponse } from './types';

const BASE_URL = 'https://api.dataforseo.com/v3';

function getCredential(name: string) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getAuthHeader() {
  const login = getCredential('DATAFORSEO_LOGIN');
  const password = getCredential('DATAFORSEO_API_PASSWORD');

  if (!login || !password) {
    throw new AppError('INTEGRATION_ERROR', 'DataForSEO credentials are not configured.', 502);
  }

  const passwordLooksEncoded =
    /^[A-Za-z0-9+/]+={0,2}$/.test(password) && (() => {
      try {
        const decoded = Buffer.from(password, 'base64').toString('utf8');
        return decoded.includes(':') && decoded.includes('@');
      } catch {
        return false;
      }
    })();

  if (passwordLooksEncoded) {
    throw new AppError(
      'INTEGRATION_ERROR',
      'DATAFORSEO_API_PASSWORD terlihat seperti string yang sudah di-encode. Isi dengan password asli dari DataForSEO, bukan base64.',
      502
    );
  }

  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function requestDataForSEO<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      authorization: getAuthHeader(),
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let responseMessage = '';
    let responseStatusCode: number | null = null;
    let responseStatusMessage = '';

    try {
      const payload = (await response.json()) as {
        status_code?: number;
        status_message?: string;
        error?: string;
        message?: string;
      };
      responseStatusCode = typeof payload?.status_code === 'number' ? payload.status_code : null;
      responseStatusMessage =
        typeof payload?.status_message === 'string'
          ? payload.status_message
          : typeof payload?.message === 'string'
            ? payload.message
            : typeof payload?.error === 'string'
              ? payload.error
              : '';
    } catch {
      responseMessage = (await response.text()).trim();
    }

    throw new AppError(
      'INTEGRATION_ERROR',
      `DataForSEO request failed with status ${response.status}${responseStatusMessage ? `: ${responseStatusMessage}` : ''}`.trim(),
      502,
      {
        status: response.status,
        dataforseo_status_code: responseStatusCode,
        dataforseo_status_message: responseStatusMessage || null,
        response_body: responseMessage || null
      }
    );
  }

  const payload = (await response.json()) as T & { status_code?: number; status_message?: string };
  if (payload && typeof payload === 'object' && 'status_code' in payload && payload.status_code !== 20000) {
    throw new AppError('INTEGRATION_ERROR', `DataForSEO error: ${payload.status_message ?? 'Unknown error'}`, 502, {
      status_code: payload.status_code,
      status_message: payload.status_message
    });
  }

  return payload;
}

export function getDataForSEOPageLimit() {
  const raw = getCredential('DATAFORSEO_MAX_PAGES_PER_AUDIT');
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(1000, Math.max(1, Math.floor(parsed)));
  }

  return 500;
}

export function getDataForSEOBudgetLimit() {
  const raw = getCredential('DATAFORSEO_MONTHLY_BUDGET_USD');
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

export async function submitOnPageAudit(targetUrl: string): Promise<DataForSEOResponse> {
  const payload: DataForSEOTaskPayload[] = [
    {
      target: targetUrl,
      max_crawl_pages: getDataForSEOPageLimit(),
      load_resources: true,
      enable_javascript: true
    }
  ];

  return requestDataForSEO<DataForSEOResponse>('/on_page/task_post', payload);
}

export async function fetchOnPagePages(taskId: string): Promise<DataForSEOResponse> {
  return requestDataForSEO<DataForSEOResponse>('/on_page/pages', [
    {
      id: taskId,
      limit: 1000,
      order_by: ['onpage_score,asc']
    }
  ]);
}

function pickPageItems(response: DataForSEOResponse) {
  const task = response.tasks?.[0];
  const result = Array.isArray(task?.result) ? (task?.result as Array<Record<string, unknown>>) : [];
  const first = result[0];

  if (!first || typeof first !== 'object') {
    return [];
  }

  const items = Array.isArray(first.items) ? first.items : [];
  return items.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
}

export function normalizeOnPageResult(response: DataForSEOResponse): DataForSEOOnPageAuditResult {
  const task = response.tasks?.[0];
  const result = Array.isArray(task?.result) ? (task?.result as Array<Record<string, unknown>>) : [];
  const first = result[0] ?? {};
  const crawlStatus = (first.crawl_status as Record<string, unknown> | undefined) ?? {};
  const progress = typeof first.crawl_progress === 'string' ? first.crawl_progress : task?.status_message?.toLowerCase() ?? 'queued';
  const pagesCrawled = typeof crawlStatus.pages_crawled === 'number' ? crawlStatus.pages_crawled : 0;
  const pagesTotal =
    typeof first.total_items_count === 'number'
      ? first.total_items_count
      : typeof crawlStatus.max_crawl_pages === 'number'
        ? crawlStatus.max_crawl_pages
        : null;
  const pages = pickPageItems(response);

  return {
    taskId: task?.id ?? '',
    progress: progress.includes('finish')
      ? 'finished'
      : progress.includes('fail')
        ? 'failed'
        : progress.includes('progress')
          ? 'in_progress'
          : 'queued',
    pagesCrawled,
    pagesTotal,
    progressPercent: pagesTotal && pagesTotal > 0 ? Math.min(100, Math.round((pagesCrawled / pagesTotal) * 100)) : 0,
    estimatedCostUsd: typeof task?.cost === 'number' ? task.cost : null,
    actualCostUsd: typeof response.cost === 'number' ? response.cost : null,
    issues: [],
    pages: pages.map((page) => ({
      url: typeof page.url === 'string' ? page.url : '',
      statusCode: typeof page.status_code === 'number' ? page.status_code : undefined,
      crawlProgress: typeof first.crawl_progress === 'string' ? first.crawl_progress : undefined,
      onpageScore: typeof page.onpage_score === 'number' ? page.onpage_score : undefined,
      detectedAt: typeof page.fetch_time === 'string' ? page.fetch_time : new Date().toISOString(),
      issueKey: '',
      issueLabel: '',
      reason: '',
      additionalInfo: page
    })),
    rawSummary: {
      task,
      result: first
    }
  };
}

export async function getAuditPages(taskId: string) {
  const response = await fetchOnPagePages(taskId);
  return normalizeOnPageResult(response);
}

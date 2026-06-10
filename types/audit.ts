import type { DataForSEOOnPageAuditResult } from '@/lib/dataforseo/types';

export type AuditTaskStatus = 'queued' | 'in_progress' | 'parsing' | 'completed' | 'failed' | 'cancelled';

export type AuditTaskRecord = {
  id: string;
  projectId: string;
  userId: string;
  provider: string;
  externalTaskId: string | null;
  targetUrl: string;
  maxCrawlPages: number;
  status: AuditTaskStatus;
  pagesCrawled: number;
  pagesTotal: number | null;
  progressPercent: number;
  totalErrorsFound: number;
  errorsBySeverity: Record<string, number>;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  submittedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  retryCount: number;
  rawSummary: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuditTaskPollResponse = {
  task: AuditTaskRecord;
  auditResult: DataForSEOOnPageAuditResult | null;
};

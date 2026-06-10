export type DataForSEOTaskPayload = {
  target: string;
  max_crawl_pages: number;
  load_resources?: boolean;
  enable_javascript?: boolean;
  custom_js?: string;
  tag?: string;
  pingback_url?: string;
};

export type DataForSEOTaskResult = {
  id: string;
  status_code: number;
  status_message: string;
  time?: string;
  cost?: number;
  result_count?: number;
  path?: string[];
  data?: Record<string, unknown>;
  result?: unknown;
};

export type DataForSEOResponse = {
  version?: string;
  status_code: number;
  status_message: string;
  time?: string;
  cost?: number;
  tasks_count?: number;
  tasks_error?: number;
  tasks: DataForSEOTaskResult[];
};

export type DataForSEOPageIssue = {
  key: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: (page: Record<string, unknown>) => string;
  shouldTrigger: (page: Record<string, unknown>) => boolean;
  extraInfo?: (page: Record<string, unknown>) => Record<string, unknown>;
};

export type DataForSEOPageDetail = {
  url: string;
  statusCode?: number;
  crawlProgress?: string;
  onpageScore?: number;
  detectedAt: string;
  issueKey: string;
  issueLabel: string;
  reason: string;
  additionalInfo: Record<string, unknown>;
};

export type DataForSEOAggregateIssue = {
  key: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  affectedUrls: DataForSEOPageDetail[];
};

export type DataForSEOOnPageAuditResult = {
  taskId: string;
  progress: 'queued' | 'in_progress' | 'finished' | 'failed';
  pagesCrawled: number;
  pagesTotal: number | null;
  progressPercent: number;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  issues: DataForSEOAggregateIssue[];
  pages: DataForSEOPageDetail[];
  rawSummary: Record<string, unknown>;
};

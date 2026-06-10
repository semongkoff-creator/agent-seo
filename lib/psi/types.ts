export type PSIStrategy = 'mobile' | 'desktop';

export type PSIAuditScore = 'good' | 'needs_improvement' | 'poor';

export type PSIAuditMetric = {
  value: number;
  score: PSIAuditScore;
};

export type PSIAuditRecord = {
  url: string;
  strategy: PSIStrategy;
  lcp: PSIAuditMetric;
  cls: PSIAuditMetric;
  inp: PSIAuditMetric;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  auditsFailed: Array<{
    id: string;
    title: string;
    score: number | null;
    displayValue?: string;
  }>;
  overallPass: boolean;
  rawResponse: Record<string, unknown>;
  fetchedAt: string;
};

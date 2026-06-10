import type { GSCMockData, GA4MockData, TechnicalErrorRecord, TechnicalErrorUrlDetail } from '@/types/wizard';

export function hashSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function fallbackGSCData(projectId: string): GSCMockData {
  const seed = hashSeed(projectId);
  const total = 60 + (seed % 25);
  const indexed = Math.max(18, total - (seed % 18));
  const percentage = Math.round((indexed / total) * 100);

  return {
    indexed,
    total,
    percentage,
    source: 'mock'
  };
}

export function fallbackGA4Data(projectId: string): GA4MockData {
  const seed = hashSeed(projectId);
  const session = 1200 + (seed % 800);
  const pageView = Math.round(session * (1.7 + (seed % 4) * 0.1));
  const engagementRate = 45 + (seed % 20);
  const bounceRate = 35 + (seed % 25);
  const conversionRate = Number((1.6 + (seed % 12) * 0.2).toFixed(1));
  const visitorTotal = 900 + (seed % 700);
  const returning = Math.round(visitorTotal * 0.28);
  const newVisitors = visitorTotal - returning;

  return {
    session: {
      value: session,
      trendPct: 8 + (seed % 12)
    },
    pageView: {
      value: pageView,
      trendPct: 6 + (seed % 10)
    },
    engagementRate: {
      value: engagementRate,
      benchmark: 50 + (seed % 8)
    },
    bounceRate,
    conversionRate,
    visitor: {
      total: visitorTotal,
      new: newVisitors,
      returning
    },
    source: 'mock'
  };
}

export function fallbackTechnicalErrors(projectId: string): TechnicalErrorRecord[] {
  const seed = hashSeed(projectId);
  const sources = ['GSC', 'Crawler', 'Manual Audit'];
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  const statuses = ['open', 'in_progress', 'fixed'] as const;

  return [0, 1, 2, 3].map((index) => {
    const severity = severities[(seed + index) % severities.length];
    const status = statuses[(seed + index * 2) % statuses.length];

    return {
      id: `${projectId}-error-${index + 1}`,
      source: sources[index % sources.length],
      errorType:
        index === 0
          ? 'Redirect chain detected'
          : index === 1
            ? 'Canonical mismatch'
            : index === 2
              ? 'Noindex on important pages'
              : 'Mobile usability issue',
      count: 4 + ((seed + index) % 12),
      severity,
      status,
      affectedUrls: [
        {
          url: `https://example.com/page-${index + 1}`,
          reason: index === 0 ? 'Redirect chain detected' : 'Affected by the issue',
          statusCode: index === 1 ? 404 : 200,
          detectedAt: new Date().toISOString(),
          additionalInfo: { source: 'fallback' }
        } satisfies TechnicalErrorUrlDetail,
        {
          url: `https://example.com/page-${index + 2}`,
          reason: 'Representative sample URL',
          statusCode: 200,
          detectedAt: new Date().toISOString(),
          additionalInfo: { source: 'fallback' }
        } satisfies TechnicalErrorUrlDetail
      ],
      screenshots: index === 0 ? [] : [`https://placehold.co/800x450?text=Error+${index + 1}`]
    };
  });
}

export function toNumber(value: unknown, fallbackValue: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallbackValue;
}

export function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

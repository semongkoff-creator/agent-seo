import { AppError } from '@/lib/errors';
import { normalizePercentValue } from '@/lib/formatters/percent';
import type { GA4MockData } from '@/types/wizard';
import type { GA4Property } from '@/lib/validators/google-integrations';

type GA4ReportRow = {
  metricValues?: Array<{ value?: string }>;
  dimensionValues?: Array<{ value?: string }>;
};

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError('INTEGRATION_ERROR', 'Google Analytics request failed', response.status, { body });
  }
  return body;
}

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

export async function listGA4Properties(accessToken: string): Promise<GA4Property[]> {
  const body = await fetchJson('https://analyticsadmin.googleapis.com/v1alpha/accountSummaries', {
    headers: { authorization: `Bearer ${accessToken}` }
  });

  const summaries = Array.isArray(body?.accountSummaries) ? body.accountSummaries : [];
  const properties: GA4Property[] = [];

  for (const summary of summaries as Array<Record<string, unknown>>) {
    const accountId = typeof summary.account === 'string' ? summary.account.split('/').pop() ?? '' : '';
    const accountName = typeof summary.displayName === 'string' ? summary.displayName : undefined;
    const props = Array.isArray(summary.propertySummaries) ? summary.propertySummaries : [];

    for (const prop of props as Array<Record<string, unknown>>) {
      const propertyName = typeof prop.displayName === 'string' ? prop.displayName : undefined;
      const propertyId = typeof prop.property === 'string' ? prop.property.split('/').pop() ?? '' : '';

      if (propertyId) {
        properties.push({
          propertyId,
          propertyName,
          accountId: accountId || undefined,
          accountName
        });
      }
    }
  }

  return properties;
}

export async function syncGA4Metrics(input: {
  accessToken: string;
  propertyId: string;
  dateRange?: string;
}): Promise<Array<{ metricType: string; metricValue: Record<string, unknown> }>> {
  const dateRange = parseDateRange(input.dateRange);
  const body = await fetchJson(`https://analyticsdata.googleapis.com/v1beta/properties/${input.propertyId}:runReport`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      dateRanges: [dateRange],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
        { name: 'totalUsers' },
        { name: 'newUsers' }
      ]
    })
  });

  const row = (Array.isArray(body?.rows) ? body.rows[0] : null) as GA4ReportRow | null;
  const metricValues = row?.metricValues ?? [];
  const sessions = Number(metricValues[0]?.value ?? 0);
  const pageViews = Number(metricValues[1]?.value ?? 0);
  const engagementRate = normalizePercentValue(metricValues[2]?.value ?? 0, 0);
  const totalUsers = Number(metricValues[3]?.value ?? 0);
  const newUsers = Number(metricValues[4]?.value ?? 0);
  const returningUsers = Math.max(totalUsers - newUsers, 0);

  return [
    {
      metricType: 'session',
      metricValue: {
        value: sessions,
        trend_pct: 0
      }
    },
    {
      metricType: 'page_view',
      metricValue: {
        value: pageViews,
        trend_pct: 0
      }
    },
    {
      metricType: 'engagement_rate',
      metricValue: {
        value: engagementRate,
        benchmark: 50,
        bounce_rate: Math.max(100 - engagementRate, 0),
        conversion_rate: 0
      }
    },
    {
      metricType: 'visitor',
      metricValue: {
        total: totalUsers,
        new: newUsers,
        returning: returningUsers
      }
    }
  ];
}

export function ga4MetricsToMockData(rows: Array<{ metricType?: string; metricValue?: Record<string, unknown> }>): GA4MockData | null {
  const lookup = new Map(rows.map((row) => [String(row.metricType ?? ''), row.metricValue ?? null]));
  const sessionMetric = lookup.get('session');
  const pageViewMetric = lookup.get('page_view');
  const engagementMetric = lookup.get('engagement_rate');
  const visitorMetric = lookup.get('visitor');

  if (!sessionMetric || !pageViewMetric || !engagementMetric || !visitorMetric) {
    return null;
  }

  const engagementRateValue = normalizePercentValue(engagementMetric.value ?? engagementMetric.engagement_rate ?? 0, 0);
  const derivedBounceRate = Math.max(100 - engagementRateValue, 0);
  const storedBounceRate = normalizePercentValue(engagementMetric.bounce_rate ?? engagementMetric.bounceRate ?? 0, 0);
  const bounceRate =
    storedBounceRate > 0 && Math.abs(storedBounceRate - derivedBounceRate) <= 5 ? storedBounceRate : derivedBounceRate;

  return {
    session: {
      value: Number(sessionMetric.value ?? sessionMetric.session ?? 0),
      trendPct: Number(sessionMetric.trend_pct ?? sessionMetric.trendPct ?? 0)
    },
    pageView: {
      value: Number(pageViewMetric.value ?? pageViewMetric.page_view ?? 0),
      trendPct: Number(pageViewMetric.trend_pct ?? pageViewMetric.trendPct ?? 0)
    },
    engagementRate: {
      value: engagementRateValue,
      benchmark: Number(engagementMetric.benchmark ?? 0)
    },
    bounceRate: bounceRate || undefined,
    conversionRate:
      normalizePercentValue(engagementMetric.conversion_rate ?? engagementMetric.conversionRate ?? 0, 0) || undefined,
    visitor: {
      total: Number(visitorMetric.total ?? 0),
      new: Number(visitorMetric.new ?? visitorMetric.new_visitors ?? 0),
      returning: Number(visitorMetric.returning ?? visitorMetric.returning_visitors ?? 0)
    }
  };
}

import { db } from '@/lib/db/client';
import { isMissingRelationError } from '@/lib/errors';
import type { GA4MockData } from '@/types/wizard';
import { fallbackGA4Data, parseStringArray, toNumber } from './_helpers';

function parseMetricValue(row: Record<string, unknown>) {
  const metricValue = row.metric_value as Record<string, unknown> | undefined;
  return metricValue && typeof metricValue === 'object' ? metricValue : null;
}

export async function getGA4MockData(projectId: string): Promise<GA4MockData> {
  try {
    const { data, error } = await db
      .from('ga4_metrics')
      .select('metric_type, metric_value')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    if (rows.length > 0) {
      const lookup = new Map(rows.map((row) => [String(row.metric_type ?? ''), parseMetricValue(row)]));

      const sessionMetric = lookup.get('session');
      const pageViewMetric = lookup.get('page_view');
      const engagementMetric = lookup.get('engagement_rate');
      const visitorMetric = lookup.get('visitor');

      if (sessionMetric && pageViewMetric && engagementMetric && visitorMetric) {
        return {
          session: {
            value: toNumber(sessionMetric.value ?? sessionMetric.session ?? 0, 0),
            trendPct: toNumber(sessionMetric.trend_pct ?? sessionMetric.trendPct ?? 0, 0)
          },
          pageView: {
            value: toNumber(pageViewMetric.value ?? pageViewMetric.page_view ?? 0, 0),
            trendPct: toNumber(pageViewMetric.trend_pct ?? pageViewMetric.trendPct ?? 0, 0)
          },
          engagementRate: {
            value: toNumber(engagementMetric.value ?? engagementMetric.engagement_rate ?? 0, 0),
            benchmark: toNumber(engagementMetric.benchmark ?? 0, 0)
          },
          visitor: {
            total: toNumber(visitorMetric.total ?? 0, 0),
            new: toNumber(visitorMetric.new ?? visitorMetric.new_visitors ?? 0, 0),
            returning: toNumber(visitorMetric.returning ?? visitorMetric.returning_visitors ?? 0, 0)
          }
        };
      }
    }
  } catch (error) {
    if (!isMissingRelationError(error)) {
      return fallbackGA4Data(projectId);
    }
  }

  return fallbackGA4Data(projectId);
}

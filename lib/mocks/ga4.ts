import { db } from '@/lib/db/client';
import { isMissingRelationError } from '@/lib/errors';
import { normalizePercentValue } from '@/lib/formatters/percent';
import type { GA4MockData } from '@/types/wizard';
import { fallbackGA4Data, parseStringArray, toNumber } from './_helpers';

function parseMetricValue(row: Record<string, unknown>) {
  const metricValue = row.metric_value as Record<string, unknown> | undefined;
  return metricValue && typeof metricValue === 'object' ? metricValue : null;
}

export async function getGA4MockData(projectId: string): Promise<GA4MockData> {
  try {
    const { data: realData, error: realError } = await db
      .from('ga4_metrics')
      .select('metric_type, metric_value, data_source, measured_at')
      .eq('project_id', projectId)
      .in('data_source', ['ga4_api', 'google_api'])
      .order('measured_at', { ascending: false });

    if (realError) {
      throw realError;
    }

    const rows = (realData ?? []) as Array<Record<string, unknown>>;
    if (rows.length > 0) {
      const lookup = new Map(rows.map((row) => [String(row.metric_type ?? ''), parseMetricValue(row)]));

      const sessionMetric = lookup.get('session');
      const pageViewMetric = lookup.get('page_view');
      const engagementMetric = lookup.get('engagement_rate');
      const visitorMetric = lookup.get('visitor');

      if (sessionMetric && pageViewMetric && engagementMetric && visitorMetric) {
        const engagementValue = normalizePercentValue(engagementMetric.value ?? engagementMetric.engagement_rate ?? 0, 0);
        const derivedBounceRate = Math.max(100 - engagementValue, 0);
        const storedBounceRate = normalizePercentValue(engagementMetric.bounce_rate ?? engagementMetric.bounceRate ?? 0, 0);
        const bounceRate =
          storedBounceRate > 0 && Math.abs(storedBounceRate - derivedBounceRate) <= 5
            ? storedBounceRate
            : derivedBounceRate;

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
            value: engagementValue,
            benchmark: toNumber(engagementMetric.benchmark ?? 0, 0)
          },
          bounceRate: bounceRate || undefined,
          conversionRate:
            normalizePercentValue(engagementMetric.conversion_rate ?? engagementMetric.conversionRate ?? 0, 0) || undefined,
          visitor: {
            total: toNumber(visitorMetric.total ?? 0, 0),
            new: toNumber(visitorMetric.new ?? visitorMetric.new_visitors ?? 0, 0),
            returning: toNumber(visitorMetric.returning ?? visitorMetric.returning_visitors ?? 0, 0)
          },
          source: (rows[0].data_source as GA4MockData['source']) ?? 'ga4_api'
        };
      }
    }

    const { data, error } = await db
      .from('ga4_metrics')
      .select('metric_type, metric_value, data_source')
      .eq('project_id', projectId)
      .order('measured_at', { ascending: false });

    if (error) {
      throw error;
    }

    const fallbackRows = (data ?? []) as Array<Record<string, unknown>>;
    if (fallbackRows.length > 0) {
      const lookup = new Map(fallbackRows.map((row) => [String(row.metric_type ?? ''), parseMetricValue(row)]));

      const sessionMetric = lookup.get('session');
      const pageViewMetric = lookup.get('page_view');
      const engagementMetric = lookup.get('engagement_rate');
      const visitorMetric = lookup.get('visitor');

      if (sessionMetric && pageViewMetric && engagementMetric && visitorMetric) {
        const engagementValue = normalizePercentValue(engagementMetric.value ?? engagementMetric.engagement_rate ?? 0, 0);
        const derivedBounceRate = Math.max(100 - engagementValue, 0);
        const storedBounceRate = normalizePercentValue(engagementMetric.bounce_rate ?? engagementMetric.bounceRate ?? 0, 0);
        const bounceRate =
          storedBounceRate > 0 && Math.abs(storedBounceRate - derivedBounceRate) <= 5
            ? storedBounceRate
            : derivedBounceRate;

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
            value: engagementValue,
            benchmark: toNumber(engagementMetric.benchmark ?? 0, 0)
          },
          bounceRate: bounceRate || undefined,
          conversionRate:
            normalizePercentValue(engagementMetric.conversion_rate ?? engagementMetric.conversionRate ?? 0, 0) || undefined,
          visitor: {
            total: toNumber(visitorMetric.total ?? 0, 0),
            new: toNumber(visitorMetric.new ?? visitorMetric.new_visitors ?? 0, 0),
            returning: toNumber(visitorMetric.returning ?? visitorMetric.returning_visitors ?? 0, 0)
          },
          source: (fallbackRows[0].data_source as GA4MockData['source']) ?? 'google_api'
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

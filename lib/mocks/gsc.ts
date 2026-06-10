import { db } from '@/lib/db/client';
import { isMissingRelationError } from '@/lib/errors';
import type { GSCMockData } from '@/types/wizard';
import { fallbackGSCData, toNumber } from './_helpers';

function parseRow(row: Record<string, unknown>, source?: GSCMockData['source']): GSCMockData | null {
  const metricValue = row.metric_value as Record<string, unknown> | undefined;
  if (!metricValue || typeof metricValue !== 'object') {
    return null;
  }

  const indexed = toNumber(metricValue.indexed, -1);
  const total = toNumber(metricValue.total, -1);
  const percentage = toNumber(metricValue.percentage, -1);

  if (indexed < 0 || total < 0 || percentage < 0) {
    return null;
  }

  return {
    indexed,
    total,
    percentage,
    source,
    measurementMethod:
      metricValue.measurement_method === 'url_inspection' ||
      metricValue.measurement_method === 'hybrid_estimate' ||
      metricValue.measurement_method === 'sitemap_fallback'
        ? metricValue.measurement_method
        : undefined,
    confidence:
      metricValue.confidence === 'high' || metricValue.confidence === 'medium' || metricValue.confidence === 'low'
        ? metricValue.confidence
        : undefined,
    sampleSize: Number.isFinite(Number(metricValue.sample_size)) ? Number(metricValue.sample_size) : undefined,
    details: metricValue.details && typeof metricValue.details === 'object' ? (metricValue.details as Record<string, unknown>) : undefined
  };
}

export async function getGSCMockData(projectId: string): Promise<GSCMockData> {
  try {
    const { data: realData, error: realError } = await db
      .from('gsc_metrics')
      .select('metric_type, metric_value, data_source, measured_at')
      .eq('project_id', projectId)
      .eq('metric_type', 'indexed_pages')
      .in('data_source', ['gsc_api', 'google_api'])
      .order('measured_at', { ascending: false })
      .limit(1);

    if (realError) {
      throw realError;
    }

    const realRows = (realData ?? []) as Array<Record<string, unknown>>;
    if (realRows.length > 0) {
      const parsed = parseRow(realRows[0], (realRows[0].data_source as GSCMockData['source']) ?? 'gsc_api');
      if (parsed) {
        return parsed;
      }
    }

    const { data, error } = await db
      .from('gsc_metrics')
      .select('metric_type, metric_value, data_source')
      .eq('project_id', projectId)
      .eq('metric_type', 'indexed_pages')
      .order('measured_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (data) {
      const row = (data as Array<Record<string, unknown>>)[0];
      const parsed = parseRow(row, (row.data_source as GSCMockData['source']) ?? 'mock');
      if (parsed) {
        return parsed;
      }
    }
  } catch (error) {
    if (!isMissingRelationError(error)) {
      return fallbackGSCData(projectId);
    }
  }

  return fallbackGSCData(projectId);
}

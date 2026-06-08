import { db } from '@/lib/db/client';
import { isMissingRelationError } from '@/lib/errors';
import type { GSCMockData } from '@/types/wizard';
import { fallbackGSCData, toNumber } from './_helpers';

function parseRow(row: Record<string, unknown>): GSCMockData | null {
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
    percentage
  };
}

export async function getGSCMockData(projectId: string): Promise<GSCMockData> {
  try {
    const { data, error } = await db
      .from('gsc_metrics')
      .select('metric_type, metric_value')
      .eq('project_id', projectId)
      .eq('metric_type', 'indexed_pages')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      const parsed = parseRow(data as Record<string, unknown>);
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

import { db } from '@/lib/db/client';
import { isMissingRelationError } from '@/lib/errors';
import type { TechnicalErrorRecord, TechnicalErrorUrlDetail } from '@/types/wizard';
import { fallbackTechnicalErrors, parseStringArray, toNumber } from './_helpers';

const severityValues = ['low', 'medium', 'high', 'critical'] as const;
const statusValues = ['open', 'in_progress', 'fixed'] as const;

function toSeverity(value: unknown): TechnicalErrorRecord['severity'] {
  if (typeof value === 'string' && severityValues.includes(value as TechnicalErrorRecord['severity'])) {
    return value as TechnicalErrorRecord['severity'];
  }

  return 'medium';
}

function toStatus(value: unknown): TechnicalErrorRecord['status'] {
  if (typeof value === 'string' && statusValues.includes(value as TechnicalErrorRecord['status'])) {
    return value as TechnicalErrorRecord['status'];
  }

  return 'open';
}

function parseRecord(row: Record<string, unknown>): TechnicalErrorRecord {
  const affectedUrls = Array.isArray(row.affected_urls)
    ? row.affected_urls
        .map((item): TechnicalErrorUrlDetail | null => {
          if (typeof item === 'string' && item.trim()) {
            return { url: item };
          }

          if (!item || typeof item !== 'object') {
            return null;
          }

          const record = item as Record<string, unknown>;
          const url = typeof record.url === 'string' && record.url ? record.url : typeof record.location === 'string' ? record.location : '';
          if (!url) {
            return null;
          }

          return {
            url,
            reason: typeof record.reason === 'string' ? record.reason : undefined,
            statusCode: typeof record.status_code === 'number' ? record.status_code : undefined,
            detectedAt: typeof record.detected_at === 'string' ? record.detected_at : undefined,
            additionalInfo: (record.additional_info ?? {}) as Record<string, unknown>
          };
        })
        .filter((item): item is TechnicalErrorUrlDetail => item !== null)
    : [];

  return {
    id: String(row.id ?? ''),
    source: typeof row.source === 'string' && row.source ? row.source : 'Audit',
    errorType: typeof row.error_type === 'string' && row.error_type ? row.error_type : 'Technical issue',
    count: toNumber(row.error_count, 0),
    severity: toSeverity(row.severity),
    status: toStatus(row.status),
    affectedUrls,
    screenshots: parseStringArray(row.screenshots)
  };
}

export async function getTechnicalErrors(projectId: string): Promise<TechnicalErrorRecord[]> {
  try {
    const { data, error } = await db
      .from('technical_errors')
      .select('id, source, error_type, error_count, severity, status, affected_urls, screenshots')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map(parseRecord);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      return fallbackTechnicalErrors(projectId);
    }
  }

  return fallbackTechnicalErrors(projectId);
}

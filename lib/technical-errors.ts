import type { TechnicalErrorRecord, TechnicalErrorUrlDetail } from '@/types/wizard';

export function extractAffectedUrlDetails(error: TechnicalErrorRecord): TechnicalErrorUrlDetail[] {
  return Array.isArray(error.affectedUrls) ? error.affectedUrls : [];
}

export function formatAffectedUrlLabel(item: TechnicalErrorUrlDetail) {
  if (item.reason) {
    return `${item.url} - ${item.reason}`;
  }

  return item.url;
}

export function getAffectedUrlCount(error: TechnicalErrorRecord) {
  return extractAffectedUrlDetails(error).length;
}

export function hasAffectedUrls(error: TechnicalErrorRecord) {
  return getAffectedUrlCount(error) > 0;
}

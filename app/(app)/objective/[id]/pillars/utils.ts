import type { TechnicalErrorSeverity } from '@/types/wizard';

export type ObjectiveRecord = Record<string, unknown>;

export function toText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ObjectiveRecord) : {};
}

export function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

export function calcGrowth(baseline: number, target: number) {
  if (!Number.isFinite(baseline) || baseline === 0) {
    return target > 0 ? 100 : 0;
  }

  return Math.max(0, Math.round(((target - baseline) / baseline) * 100));
}

export function getEstimatedEffort(severity: TechnicalErrorSeverity) {
  switch (severity) {
    case 'critical':
      return '8-16h';
    case 'high':
      return '4-8h';
    case 'medium':
      return '2-4h';
    default:
      return '< 2h';
  }
}

export type MetricCard = {
  label: string;
  baseline?: string;
  target?: string;
  unit?: string;
  note?: string;
};

export function formatMetricValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'n/a';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatMetricValue(item)).join(', ');
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${formatLabel(key)}: ${formatMetricValue(item)}`)
      .join(' · ');
  }

  return String(value);
}

export function extractMetricCards(value: unknown): MetricCard[] {
  const record = toRecord(value);
  const entries = Object.entries(record);

  return entries.map(([key, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const nested = item as Record<string, unknown>;
      return {
        label: formatLabel(key),
        baseline: nested.baseline !== undefined ? formatMetricValue(nested.baseline) : undefined,
        target: nested.target !== undefined ? formatMetricValue(nested.target) : undefined,
        unit: typeof nested.unit === 'string' ? nested.unit : undefined,
        note: typeof nested.note === 'string' ? nested.note : undefined
      };
    }

    return {
      label: formatLabel(key),
      target: formatMetricValue(item)
    };
  });
}

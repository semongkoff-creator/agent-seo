export function normalizePercentValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value <= 1 ? value * 100 : value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed <= 1 ? parsed * 100 : parsed;
    }
  }

  return fallback;
}

export function formatPercentValue(value: unknown, fallback = 0) {
  const normalized = normalizePercentValue(value, fallback);
  const rounded = Math.round(normalized * 100) / 100;

  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}%`;
  }

  return `${rounded.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}%`;
}

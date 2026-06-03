const WIB_TIME_ZONE = 'Asia/Jakarta';

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWibDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = toDate(value);
  if (!date) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIME_ZONE,
    dateStyle: 'medium',
    ...options
  }).format(date);
}

export function formatWibDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = toDate(value);
  if (!date) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options
  }).format(date);
}

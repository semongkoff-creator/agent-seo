import type { KeywordOwningRecord, KeywordPositionRecord } from '@/types/wizard';

export function buildKeywordOwning(rows: KeywordPositionRecord[]): KeywordOwningRecord {
  const total = rows.length;
  const top10 = rows.filter((row) => row.position <= 10).length;
  const top3 = rows.filter((row) => row.position <= 3).length;

  return {
    total,
    top10,
    top3
  };
}

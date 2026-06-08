"use client";

import { useState } from 'react';
import type { KeywordPositionRecord } from '@/types/wizard';

export function useGSCKeywords(initialRows: KeywordPositionRecord[]) {
  const [rows] = useState<KeywordPositionRecord[]>(initialRows);
  return rows;
}

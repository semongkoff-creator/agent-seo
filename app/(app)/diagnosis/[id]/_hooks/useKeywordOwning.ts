"use client";

import { useState } from 'react';
import type { KeywordOwningRecord } from '@/types/wizard';

export function useKeywordOwning(initialData: KeywordOwningRecord) {
  const [data] = useState<KeywordOwningRecord>(initialData);
  return data;
}

"use client";

import { useState } from 'react';
import type { GA4MockData } from '@/types/wizard';

export function useGA4Metrics(initialData: GA4MockData) {
  const [data] = useState<GA4MockData>(initialData);
  return data;
}

"use client";

import { useMemo, useState } from 'react';
import type { AIVisibilityRecord } from '@/types/wizard';

export function useAIVisibilityMetrics(
  initialGemini: AIVisibilityRecord[],
  initialChatGPT: AIVisibilityRecord[]
) {
  const [gemini] = useState<AIVisibilityRecord[]>(initialGemini);
  const [chatgpt] = useState<AIVisibilityRecord[]>(initialChatGPT);

  const aggregates = useMemo(
    () => ({
      gemini,
      chatgpt
    }),
    [chatgpt, gemini]
  );

  return aggregates;
}

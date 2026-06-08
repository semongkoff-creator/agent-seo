import type { AIVisibilityEngine, AIVisibilityRecord } from '@/types/wizard';
import { hashSeed } from './_helpers';

const keywordPool = [
  'seo agency',
  'technical seo audit',
  'b2b seo strategy',
  'keyword research service',
  'content seo plan',
  'local seo consultant',
  'enterprise seo partner',
  'ga4 setup service'
];

function buildRows(projectId: string, engine: AIVisibilityEngine): AIVisibilityRecord[] {
  const seed = hashSeed(`${projectId}:${engine}`);
  return keywordPool.map((keyword, index) => {
    const visibilityScore = Math.max(18, Math.min(96, 42 + ((seed + index * 9) % 50)));
    const detectionRate = Number((28 + ((seed + index * 5) % 60)).toFixed(1));
    const avgPosition = Number((1.8 + ((seed + index * 3) % 110) / 10).toFixed(2));
    return {
      id: `${projectId}-${engine}-ai-${index + 1}`,
      engine,
      keyword,
      visibilityScore,
      detectionRate,
      top3Visibility: visibilityScore > 70 ? 1 : 0,
      avgPosition,
      citationData: {
        source: engine === 'gemini' ? 'Google SGE' : 'ChatGPT Search',
        snippets: [
          `${keyword} benchmark`,
          `${keyword} implementation guide`
        ]
      }
    };
  });
}

export function buildAIVisibilityRows(projectId: string) {
  return {
    gemini: buildRows(projectId, 'gemini'),
    chatgpt: buildRows(projectId, 'chatgpt')
  };
}

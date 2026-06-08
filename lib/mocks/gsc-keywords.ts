import type { KeywordPositionRecord, KeywordPositionTrend } from '@/types/wizard';
import { hashSeed } from './_helpers';

const keywordPool = [
  'seo agency',
  'technical seo audit',
  'b2b seo strategy',
  'keyword research service',
  'content seo plan',
  'local seo consultant',
  'enterprise seo partner',
  'ga4 setup service',
  'google search console audit',
  'ai visibility tracker',
  'website audit checklist',
  'core web vitals fix',
  'canonical issue checker',
  'indexing issues fix',
  'ecommerce seo support',
  'conversion rate seo',
  'rank tracker dashboard',
  'search visibility tool',
  'sitemap crawl check',
  'robots txt audit',
  'search intent mapping',
  'seo content roadmap',
  'organic leads growth',
  'keyword position monitor'
];

function trendForPosition(position: number): KeywordPositionTrend {
  if (position <= 10) {
    return 'up';
  }

  if (position <= 30) {
    return 'flat';
  }

  return 'down';
}

export function buildKeywordPositions(projectId: string): KeywordPositionRecord[] {
  const seed = hashSeed(projectId);

  return keywordPool.map((keyword, index) => {
    const position = ((seed + index * 7) % 52) + 1;
    return {
      id: `${projectId}-kw-${index + 1}`,
      keyword,
      position,
      urlRanking: index % 2 === 0 ? `/blog/${keyword.replace(/\s+/g, '-')}` : `/service/${keyword.replace(/\s+/g, '-')}`,
      searchVolume: 120 + ((seed + index * 11) % 1800),
      trend: index < 4 ? 'new' : trendForPosition(position)
    };
  });
}

export function filterKeywordPositions(
  rows: KeywordPositionRecord[],
  filter: 'all' | 'top10' | 'opportunity' | 'longtail'
) {
  switch (filter) {
    case 'top10':
      return rows.filter((row) => row.position <= 10);
    case 'opportunity':
      return rows.filter((row) => row.position >= 11 && row.position <= 30);
    case 'longtail':
      return rows.filter((row) => row.position >= 31);
    default:
      return rows;
  }
}

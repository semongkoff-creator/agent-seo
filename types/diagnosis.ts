import type {
  AIVisibilityRecord,
  GA4MockData,
  KeywordOwningRecord,
  KeywordPositionRecord,
  TechnicalErrorRecord
} from './wizard';

export type DiagnosisDashboardData = {
  technicalErrors: TechnicalErrorRecord[];
  keywordPositions: KeywordPositionRecord[];
  aiVisibility: {
    gemini: AIVisibilityRecord[];
    chatgpt: AIVisibilityRecord[];
  };
  ga4: GA4MockData;
  keywordOwning: KeywordOwningRecord;
};

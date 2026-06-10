export type MainBusinessGoalValue = 'traffic' | 'leads' | 'keyword_position' | 'sales' | 'awareness' | 'local_visibility';

export type IndustryValue =
  | 'saas'
  | 'ecommerce'
  | 'agency'
  | 'consulting'
  | 'fnb'
  | 'manufacturing'
  | 'healthcare'
  | 'education'
  | 'fintech'
  | 'real_estate'
  | 'tourism'
  | 'local'
  | 'other';

export type AudienceValue =
  | 'b2b_enterprise'
  | 'b2b_midmarket'
  | 'b2b_smb'
  | 'b2c_mass'
  | 'b2c_premium'
  | 'local'
  | 'government'
  | 'mixed'
  | 'other';

export type ProductOptionGroup = {
  value: string;
  label: string;
};

export type GSCMockData = {
  indexed: number;
  total: number;
  percentage: number;
  source?: 'mock' | 'gsc_api' | 'google_api';
  measurementMethod?: 'url_inspection' | 'hybrid_estimate' | 'sitemap_fallback';
  confidence?: 'high' | 'medium' | 'low';
  sampleSize?: number;
  details?: Record<string, unknown>;
};

export type GA4MetricTrend = {
  value: number;
  trendPct: number;
};

export type GA4MockData = {
  session: GA4MetricTrend;
  pageView: GA4MetricTrend;
  engagementRate: {
    value: number;
    benchmark: number;
  };
  bounceRate?: number;
  conversionRate?: number;
  visitor: {
    total: number;
    new: number;
    returning: number;
  };
  source?: 'mock' | 'ga4_api' | 'google_api';
};

export type TechnicalErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type TechnicalErrorStatus = 'open' | 'in_progress' | 'fixed';

export type TechnicalErrorUrlDetail = {
  url: string;
  reason?: string;
  statusCode?: number;
  detectedAt?: string;
  additionalInfo?: Record<string, unknown>;
};

export type TechnicalErrorRecord = {
  id: string;
  source: string;
  errorType: string;
  count: number;
  severity: TechnicalErrorSeverity;
  status: TechnicalErrorStatus;
  affectedUrls: TechnicalErrorUrlDetail[];
  screenshots: string[];
  fixGuide?: {
    summary: string;
    whyItMatters: string;
    steps: string[];
  };
  rawData?: Record<string, unknown>;
};

export type KeywordPositionTrend = 'up' | 'down' | 'flat' | 'new';
export type KeywordPositionRecord = {
  id: string;
  keyword: string;
  position: number;
  urlRanking: string;
  searchVolume: number;
  trend: KeywordPositionTrend;
};

export type AIVisibilityEngine = 'gemini' | 'chatgpt';
export type AIVisibilityRecord = {
  id: string;
  engine: AIVisibilityEngine;
  keyword: string;
  visibilityScore: number;
  detectionRate: number;
  top3Visibility: number;
  avgPosition: number;
  citationData: Record<string, unknown>;
};

export type KeywordOwningRecord = {
  total: number;
  top10: number;
  top3: number;
};

export type MainBusinessGoalOption = {
  value: Exclude<MainBusinessGoalValue, 'sales' | 'awareness' | 'local_visibility'>;
  label: string;
};

export const MAIN_BUSINESS_GOAL_OPTIONS: MainBusinessGoalOption[] = [
  { value: 'leads', label: 'Generate Leads' },
  { value: 'traffic', label: 'Increase Traffic' },
  { value: 'keyword_position', label: 'Improve Keyword Position' }
];

export const LEGACY_BUSINESS_GOAL_MAP: Record<string, Exclude<MainBusinessGoalValue, 'sales' | 'awareness' | 'local_visibility'>> = {
  sales: 'leads',
  awareness: 'leads',
  local_visibility: 'leads'
};

export function normalizeBusinessGoalValue(value: unknown): Exclude<MainBusinessGoalValue, 'sales' | 'awareness' | 'local_visibility'> {
  if (typeof value !== 'string') {
    return 'leads';
  }

  if (value === 'traffic' || value === 'leads' || value === 'keyword_position') {
    return value;
  }

  return LEGACY_BUSINESS_GOAL_MAP[value] ?? 'leads';
}

export function formatBusinessGoalLabel(value: unknown): string {
  const normalized = normalizeBusinessGoalValue(value);

  switch (normalized) {
    case 'traffic':
      return 'Traffic';
    case 'keyword_position':
      return 'Keyword Position';
    default:
      return 'Leads';
  }
}

export const INDUSTRY_OPTIONS: Array<{ value: IndustryValue; label: string }> = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'agency', label: 'Software Development Agency' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'fnb', label: 'Restaurant / F&B' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'fintech', label: 'Finance / Fintech' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'tourism', label: 'Tourism / Hospitality' },
  { value: 'local', label: 'Local Business' },
  { value: 'other', label: 'Other (specify)' }
];

export const AUDIENCE_OPTIONS: Array<{ value: AudienceValue; label: string }> = [
  { value: 'b2b_enterprise', label: 'B2B Enterprise' },
  { value: 'b2b_midmarket', label: 'B2B Mid-Market' },
  { value: 'b2b_smb', label: 'B2B SMB' },
  { value: 'b2c_mass', label: 'B2C Mass Market' },
  { value: 'b2c_premium', label: 'B2C Premium' },
  { value: 'local', label: 'Local Community' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'mixed', label: 'Mixed (B2B + B2C)' },
  { value: 'other', label: 'Other (specify)' }
];

export const PRODUCT_OPTIONS: Record<string, ProductOptionGroup[]> = {
  agency: [
    { value: 'custom_software', label: 'Custom Software Development' },
    { value: 'web_dev', label: 'Web Development' },
    { value: 'mobile_dev', label: 'Mobile App Development' },
    { value: 'erp', label: 'ERP Implementation' },
    { value: 'other', label: 'Other (specify)' }
  ],
  ecommerce: [
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'fnb', label: 'Food & Beverage' },
    { value: 'beauty', label: 'Health & Beauty' },
    { value: 'home', label: 'Home & Living' },
    { value: 'other', label: 'Other (specify)' }
  ],
  saas: [
    { value: 'b2b_saas', label: 'B2B SaaS' },
    { value: 'b2c_app', label: 'B2C App' },
    { value: 'platform', label: 'Platform / Marketplace' },
    { value: 'other', label: 'Other (specify)' }
  ],
  consulting: [
    { value: 'strategy', label: 'Strategy Consulting' },
    { value: 'operations', label: 'Operations Consulting' },
    { value: 'marketing', label: 'Marketing Consulting' },
    { value: 'other', label: 'Other (specify)' }
  ],
  fnb: [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'catering', label: 'Catering' },
    { value: 'other', label: 'Other (specify)' }
  ],
  manufacturing: [
    { value: 'industrial', label: 'Industrial Products' },
    { value: 'consumer_goods', label: 'Consumer Goods' },
    { value: 'b2b_supply', label: 'B2B Supply' },
    { value: 'other', label: 'Other (specify)' }
  ],
  healthcare: [
    { value: 'clinic', label: 'Clinic' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'telemedicine', label: 'Telemedicine' },
    { value: 'other', label: 'Other (specify)' }
  ],
  education: [
    { value: 'school', label: 'School' },
    { value: 'university', label: 'University' },
    { value: 'course', label: 'Course / Bootcamp' },
    { value: 'other', label: 'Other (specify)' }
  ],
  fintech: [
    { value: 'payments', label: 'Payments' },
    { value: 'lending', label: 'Lending' },
    { value: 'wealth', label: 'Wealth Management' },
    { value: 'other', label: 'Other (specify)' }
  ],
  real_estate: [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'property_management', label: 'Property Management' },
    { value: 'other', label: 'Other (specify)' }
  ],
  tourism: [
    { value: 'hotel', label: 'Hotel' },
    { value: 'travel_agency', label: 'Travel Agency' },
    { value: 'tour_operator', label: 'Tour Operator' },
    { value: 'other', label: 'Other (specify)' }
  ],
  local: [
    { value: 'service_business', label: 'Service Business' },
    { value: 'retail', label: 'Retail' },
    { value: 'clinic', label: 'Clinic / Practice' },
    { value: 'other', label: 'Other (specify)' }
  ],
  default: [{ value: 'other', label: 'Other (specify)' }]
};

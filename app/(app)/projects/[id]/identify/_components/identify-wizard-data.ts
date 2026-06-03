export type IdentifyStepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type IdentifyFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'tri-state' | 'radio' | 'tags';

export type IdentifyFieldConfig = {
  name: string;
  label: string;
  type: IdentifyFieldType;
  help?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type IdentifyStepConfig = {
  step: IdentifyStepNumber;
  title: string;
  eyebrow: string;
  description: string;
  fields: IdentifyFieldConfig[];
};

export const identifyStepConfigs: Record<IdentifyStepNumber, IdentifyStepConfig> = {
  1: {
    step: 1,
    eyebrow: 'Project Context',
    title: 'Tell us what the site sells',
    description: 'We use these basics to anchor crawl, keyword, and conversion analysis.',
    fields: [
      { name: 'website_url', label: 'Website URL', type: 'text', placeholder: 'yourdomain.com' },
      { name: 'business_name', label: 'Business Name', type: 'text', placeholder: 'Kaitech Studio' },
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        placeholder: 'SaaS / Software'
      },
      { name: 'target_location', label: 'Target Location', type: 'text', placeholder: 'Jakarta, Indonesia' },
      {
        name: 'target_audience',
        label: 'Target Audience',
        type: 'textarea',
        placeholder: 'Founders, marketers, and operators looking for better SEO visibility.'
      },
      {
        name: 'main_product_or_service',
        label: 'Main Product or Service',
        type: 'textarea',
        placeholder: 'Managed SEO audit and content strategy for B2B SaaS teams.'
      }
    ]
  },
  2: {
    step: 2,
    eyebrow: 'Website Snapshot',
    title: 'Describe the live SEO footprint',
    description: 'This helps us decide whether we should analyze from scratch or from live signals.',
    fields: [
      {
        name: 'website_stage',
        label: 'Website Stage',
        type: 'radio',
        options: [
          { label: 'From scratch', value: 'from_scratch' },
          { label: 'New website', value: 'new' },
          { label: 'Existing website', value: 'existing' }
        ]
      },
      {
        name: 'is_indexed',
        label: 'Indexed by Google?',
        type: 'tri-state',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Unknown', value: 'unknown' }
        ]
      },
      { name: 'monthly_organic_traffic', label: 'Monthly Organic Traffic', type: 'number', placeholder: '0' },
      {
        name: 'organic_traffic_trend',
        label: 'Traffic Trend',
        type: 'radio',
        options: [
          { label: 'Increasing', value: 'increasing' },
          { label: 'Flat', value: 'flat' },
          { label: 'Decreasing', value: 'decreasing' },
          { label: 'Not sure yet', value: '' }
        ]
      },
      { name: 'indexed_pages', label: 'Indexed Pages', type: 'number', placeholder: '0' },
      { name: 'published_pages', label: 'Published Pages', type: 'number', placeholder: '0' },
      {
        name: 'main_seo_concern',
        label: 'Main SEO Concern',
        type: 'textarea',
        placeholder: 'Traffic is flat even though content is being published consistently.'
      }
    ]
  },
  3: {
    step: 3,
    eyebrow: 'Technical Signals',
    title: 'Capture crawl and rendering health',
    description: 'We want the diagnosis to know what search engines can and cannot access.',
    fields: [
      { name: 'sitemap_url', label: 'Sitemap URL', type: 'text', placeholder: 'https://yourdomain.com/sitemap.xml' },
      {
        name: 'robots_txt',
        label: 'robots.txt',
        type: 'textarea',
        placeholder: 'User-agent: *\nDisallow: /admin/'
      },
      { name: 'crawl_errors_count', label: 'Crawl Errors Count', type: 'number', placeholder: '0' },
      { name: 'core_web_vitals_pass', label: 'Core Web Vitals Pass', type: 'boolean' },
      { name: 'mobile_usability_issues', label: 'Mobile Usability Issues', type: 'boolean' },
      { name: 'has_redirect_errors', label: 'Redirect Errors', type: 'boolean' },
      { name: 'has_4xx_5xx_errors', label: '4xx / 5xx Errors', type: 'boolean' },
      { name: 'canonical_issues', label: 'Canonical Issues', type: 'boolean' },
      { name: 'noindex_issues', label: 'Noindex Issues', type: 'boolean' }
    ]
  },
  4: {
    step: 4,
    eyebrow: 'Demand & Relevance',
    title: 'Map keywords to intent and opportunity',
    description: 'This helps us detect a relevance gap versus authority or technical issues.',
    fields: [
      { name: 'current_ranking_keywords', label: 'Current Ranking Keywords', type: 'tags', placeholder: 'keyword one, keyword two' },
      { name: 'target_keywords', label: 'Target Keywords', type: 'tags', placeholder: 'keyword one, keyword two' },
      { name: 'monthly_impressions', label: 'Monthly Impressions', type: 'number', placeholder: '0' },
      { name: 'monthly_ctr', label: 'Monthly CTR (%)', type: 'number', placeholder: '0.0' },
      { name: 'competitor_domains', label: 'Competitor Domains', type: 'tags', placeholder: 'competitor.com, rival.com' }
    ]
  },
  5: {
    step: 5,
    eyebrow: 'Authority Profile',
    title: 'Tell us about the brand and backlink gap',
    description: 'Authority signals help the agent understand why content may still be underperforming.',
    fields: [
      { name: 'domain_rating', label: 'Domain Rating', type: 'number', placeholder: '0' },
      { name: 'referring_domains', label: 'Referring Domains', type: 'number', placeholder: '0' },
      { name: 'backlink_count', label: 'Backlink Count', type: 'number', placeholder: '0' },
      { name: 'competitor_dr_avg', label: 'Competitor DR Average', type: 'number', placeholder: '0' },
      {
        name: 'brand_mentions_estimate',
        label: 'Brand Mentions Estimate',
        type: 'radio',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' }
        ]
      },
      { name: 'has_case_studies', label: 'Has Case Studies', type: 'boolean' },
      { name: 'has_author_pages', label: 'Has Author Pages', type: 'boolean' }
    ]
  },
  6: {
    step: 6,
    eyebrow: 'Conversion Signals',
    title: 'Finish with conversion context',
    description: 'Even if traffic exists, the diagnosis should know whether the site converts well.',
    fields: [
      { name: 'current_conversion_rate', label: 'Current Conversion Rate (%)', type: 'number', placeholder: '0.0' },
      { name: 'monthly_organic_leads', label: 'Monthly Organic Leads', type: 'number', placeholder: '0' },
      { name: 'monthly_organic_sales', label: 'Monthly Organic Sales', type: 'number', placeholder: '0' },
      { name: 'bounce_rate', label: 'Bounce Rate (%)', type: 'number', placeholder: '0.0' },
      { name: 'avg_session_duration', label: 'Average Session Duration (seconds)', type: 'number', placeholder: '0' },
      { name: 'top_landing_pages', label: 'Top Landing Pages', type: 'tags', placeholder: '/blog/post-1, /pricing' },
      {
        name: 'cta_quality_self_rating',
        label: 'CTA Quality Self Rating',
        type: 'radio',
        options: [
          { label: 'Weak', value: 'weak' },
          { label: 'Medium', value: 'medium' },
          { label: 'Strong', value: 'strong' }
        ]
      }
    ]
  }
};

export const identifyStepOrder = [1, 2, 3, 4, 5, 6] as const;

export const identifyStepTitles = identifyStepOrder.map((step) => identifyStepConfigs[step]);

export function formatProjectLabel(name: string | null | undefined) {
  return typeof name === 'string' && name.trim() ? name : 'Project name not set';
}

export function formatProjectUrl(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value : 'Website not provided';
}

export function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function joinTags(value: unknown) {
  return parseTags(value).join(', ');
}

export function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
}

export function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true' || value === 'yes';
  }

  return false;
}

export function normalizeTriState(value: unknown) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  if (typeof value === 'string' && ['yes', 'no', 'unknown'].includes(value)) {
    return value;
  }
  return 'unknown';
}

export function buildStepState(step: IdentifyStepNumber, source: Record<string, unknown>) {
  const state: Record<string, unknown> = {};

  identifyStepConfigs[step].fields.forEach((field) => {
    const current = source[field.name];

    if (field.type === 'tags') {
      state[field.name] = joinTags(current);
      return;
    }

    if (field.type === 'number') {
      state[field.name] = normalizeNumber(current);
      return;
    }

    if (field.type === 'boolean') {
      state[field.name] = normalizeBoolean(current);
      return;
    }

    if (field.type === 'tri-state') {
      state[field.name] = normalizeTriState(current);
      return;
    }

    state[field.name] = typeof current === 'string' ? current : '';
  });

  if (step === 1) {
    state.website_url = typeof source.website_url === 'string' && source.website_url ? source.website_url : '';
    state.business_name = typeof source.business_name === 'string' ? source.business_name : '';
    state.industry = typeof source.industry === 'string' ? source.industry : '';
    state.target_location = typeof source.target_location === 'string' ? source.target_location : '';
    state.target_audience = typeof source.target_audience === 'string' ? source.target_audience : '';
    state.main_product_or_service = typeof source.main_product_or_service === 'string' ? source.main_product_or_service : '';
  }

  if (step === 2) {
    state.website_stage = typeof source.website_stage === 'string' ? source.website_stage : 'existing';
    const trend = typeof source.organic_traffic_trend === 'string' ? source.organic_traffic_trend : '';
    const legacyTrendMap: Record<string, string> = {
      growing: 'increasing',
      stagnant: 'flat',
      zero: 'flat',
      declining: 'decreasing',
      unknown: ''
    };
    state.organic_traffic_trend = legacyTrendMap[trend] ?? trend;
  }

  if (step === 5) {
    state.brand_mentions_estimate = typeof source.brand_mentions_estimate === 'string' ? source.brand_mentions_estimate : 'low';
  }

  if (step === 6) {
    state.cta_quality_self_rating = typeof source.cta_quality_self_rating === 'string' ? source.cta_quality_self_rating : 'medium';
  }

  return state;
}

export function serializeStepState(step: IdentifyStepNumber, state: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  identifyStepConfigs[step].fields.forEach((field) => {
    const value = state[field.name];

    if (field.type === 'tags') {
      payload[field.name] = parseTags(value);
      return;
    }

    if (field.type === 'number') {
      const parsed = typeof value === 'number' ? value : Number(value);
      payload[field.name] = Number.isFinite(parsed) && value !== '' ? parsed : undefined;
      return;
    }

    if (field.type === 'boolean') {
      payload[field.name] = Boolean(value);
      return;
    }

    if (field.type === 'tri-state') {
      if (value === 'yes') payload[field.name] = true;
      else if (value === 'no') payload[field.name] = false;
      else payload[field.name] = undefined;
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        payload[field.name] = trimmed;
      }
      return;
    }
  });

  if (step === 1) {
    const websiteUrl = typeof state.website_url === 'string' ? state.website_url.trim() : '';
    if (websiteUrl) {
      payload.website_url = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    }
  }

  if (step === 5) {
    const map: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
    payload.brand_mentions_estimate = map[String(state.brand_mentions_estimate ?? 'low')] ?? 1;
  }

  if (step === 6) {
    const map: Record<string, number> = { weak: 3, medium: 6, strong: 9 };
    payload.cta_quality_self_rating = map[String(state.cta_quality_self_rating ?? 'medium')] ?? 6;
  }

  return payload;
}

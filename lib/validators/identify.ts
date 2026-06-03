import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';
import { websiteStageSchema } from './projects';

const trafficTrendSchema = z.enum(['increasing', 'flat', 'decreasing']);

const websiteBasicsSchema = z
  .object({
    website_url: z.string().trim().url(),
    business_name: z.string().trim().min(1).max(160).optional(),
    industry: z.string().trim().min(1).max(120).optional(),
    target_location: z.string().trim().min(1).max(120).optional(),
    target_audience: z.string().trim().min(1).max(240).optional(),
    main_product_or_service: z.string().trim().min(1).max(240).optional()
  })
  .passthrough();

const websiteStatusSchema = z
  .object({
    website_stage: websiteStageSchema,
    is_indexed: z.boolean().optional(),
    monthly_organic_traffic: z.number().nonnegative().optional(),
    organic_traffic_trend: trafficTrendSchema.optional(),
    indexed_pages: z.number().int().nonnegative().optional(),
    published_pages: z.number().int().nonnegative().optional(),
    main_seo_concern: z.string().trim().min(1).max(240).optional()
  })
  .passthrough();

const technicalSeoSchema = z
  .object({
    sitemap_url: z.string().trim().url().optional(),
    robots_txt: z.string().trim().min(1).max(2000).optional(),
    crawl_errors_count: z.number().int().nonnegative().optional(),
    core_web_vitals_pass: z.boolean().optional(),
    mobile_usability_issues: z.boolean().optional(),
    has_redirect_errors: z.boolean().optional(),
    has_4xx_5xx_errors: z.boolean().optional(),
    canonical_issues: z.boolean().optional(),
    noindex_issues: z.boolean().optional()
  })
  .passthrough();

const keywordsAndRelevanceSchema = z
  .object({
    current_ranking_keywords: z.array(z.string().trim().min(1)).optional(),
    target_keywords: z.array(z.string().trim().min(1)).optional(),
    monthly_impressions: z.number().nonnegative().optional(),
    monthly_ctr: z.number().min(0).max(100).optional(),
    competitor_domains: z.array(z.string().trim().min(1)).optional()
  })
  .passthrough();

const authorityAndTrustSchema = z
  .object({
    domain_rating: z.number().min(0).max(100).optional(),
    referring_domains: z.number().int().nonnegative().optional(),
    backlink_count: z.number().int().nonnegative().optional(),
    competitor_dr_avg: z.number().min(0).max(100).optional(),
    brand_mentions_estimate: z.number().int().nonnegative().optional(),
    has_case_studies: z.boolean().optional(),
    has_author_pages: z.boolean().optional()
  })
  .passthrough();

const conversionSchema = z
  .object({
    current_conversion_rate: z.number().min(0).max(100).optional(),
    monthly_organic_leads: z.number().int().nonnegative().optional(),
    monthly_organic_sales: z.number().int().nonnegative().optional(),
    bounce_rate: z.number().min(0).max(100).optional(),
    avg_session_duration: z.number().nonnegative().optional(),
    top_landing_pages: z.array(z.string().trim().min(1)).optional(),
    cta_quality_self_rating: z.number().int().min(1).max(10).optional()
  })
  .passthrough();

export const identifyStepNumberSchema = z.coerce.number().int().min(1).max(6);
export const identifyStepSchemas = {
  1: websiteBasicsSchema,
  2: websiteStatusSchema,
  3: technicalSeoSchema,
  4: keywordsAndRelevanceSchema,
  5: authorityAndTrustSchema,
  6: conversionSchema
} as const;

export const identifyStepDraftSchema = z
  .object({
    payload: z.record(z.any())
  })
  .passthrough();

export const identifyDraftParamsSchema = z.object({
  id: uuidSchema
});

export const identifyStepParamsSchema = z.object({
  id: uuidSchema,
  subStep: z.string().regex(/^[1-6]$/)
});

export const identifySubmitSchema = z.object({}).passthrough().optional();

export type IdentifyStepNumber = z.infer<typeof identifyStepNumberSchema>;
export type IdentifyStepDraftInput = z.infer<typeof identifyStepDraftSchema>;

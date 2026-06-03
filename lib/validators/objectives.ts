import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const objectiveTypeSchema = z.enum([
  'technical_recovery',
  'qualified_traffic',
  'authority_growth',
  'conversion_improvement',
  'foundation_building',
  'mixed'
]);

export const achievabilityScoreSchema = z.enum(['low', 'moderate', 'high']);
export const budgetLevelSchema = z.enum(['low', 'medium', 'high']);

export const objectiveInputSchema = z
  .object({
    business_goal: z
      .object({
        main_business_goal: z.enum(['traffic', 'leads', 'sales', 'revenue', 'awareness', 'local_visibility']),
        business_target_value: z.string().trim().min(1).optional(),
        target_period: z.string().trim().min(1).optional(),
        priority_product_or_service: z.string().trim().min(1).optional(),
        target_market: z.string().trim().min(1).optional(),
        average_order_value: z.number().nonnegative().optional()
      })
      .passthrough(),
    seo_baseline: z
      .object({
        current_monthly_organic_traffic: z.number().nonnegative().optional(),
        current_organic_conversions: z.number().nonnegative().optional(),
        current_impressions: z.number().nonnegative().optional(),
        current_ctr: z.number().min(0).max(100).optional(),
        current_ranking_keywords: z.number().nonnegative().optional(),
        current_indexed_pages: z.number().nonnegative().optional(),
        domain_authority: z.number().min(0).max(100).optional(),
        referring_domains: z.number().nonnegative().optional()
      })
      .passthrough(),
    constraints: z
      .object({
        campaign_duration: z.string().trim().min(1),
        budget_level: budgetLevelSchema,
        content_capacity_per_month: z.number().nonnegative(),
        developer_support_available: z.boolean(),
        link_building_capacity: z.enum(['low', 'medium', 'high']).optional(),
        industry_competition_level: z.enum(['low', 'medium', 'high'])
      })
      .passthrough()
  })
  .passthrough();

export const objectiveIdParamsSchema = z.object({
  id: uuidSchema
});

export const objectiveListQuerySchema = paginationSchema.extend({
  projectId: uuidSchema.optional()
});

export const regenerateObjectiveSchema = z
  .object({
    reason: z.string().trim().min(1).max(240).optional()
  })
  .passthrough();

export const objectiveDraftParamsSchema = z.object({
  id: uuidSchema
});

export const objectiveInputParamsSchema = z.object({
  id: uuidSchema
});

export type ObjectiveInput = z.infer<typeof objectiveInputSchema>;
export type ObjectiveListQuery = z.infer<typeof objectiveListQuerySchema>;
export type RegenerateObjectiveInput = z.infer<typeof regenerateObjectiveSchema>;

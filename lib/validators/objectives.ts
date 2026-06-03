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

export const diagnosisProblemTypeSchema = z.enum([
  'technical_bottleneck',
  'relevance_gap',
  'authority_deficit',
  'conversion_pitfall',
  'from_scratch',
  'mixed',
  'technical_recovery',
  'qualified_traffic',
  'authority_growth',
  'conversion_improvement',
  'foundation_building'
]);

export const achievabilityScoreSchema = z.enum(['low', 'moderate', 'high']);
export const budgetLevelSchema = z.enum(['low', 'medium', 'high']);
export const targetPeriodSchema = z.enum(['3 months', '6 months', '9 months', '12 months']);
export const existingBrandStrengthSchema = z.enum(['low', 'medium', 'high']);

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),
  z.string().trim().min(1).optional()
);

export const objectiveInputSchema = z
  .object({
    business_goal: z
      .object({
        main_business_goal: z.enum(['traffic', 'leads', 'sales', 'revenue', 'awareness', 'local_visibility']),
        business_target_value: optionalTextSchema,
        target_period: targetPeriodSchema.optional(),
        priority_product_or_service: optionalTextSchema,
        target_market: optionalTextSchema,
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
        referring_domains: z.number().nonnegative().optional(),
        current_conversion_rate: z.number().min(0).max(100).optional(),
        bounce_rate: z.number().min(0).max(100).optional()
      })
      .passthrough(),
    constraints: z
      .object({
        campaign_duration: targetPeriodSchema.optional().or(z.string().trim().min(1)),
        budget_level: budgetLevelSchema,
        content_capacity_per_month: z.number().nonnegative(),
        developer_support_available: z.boolean(),
        link_building_capacity: z.enum(['low', 'medium', 'high']).optional(),
        industry_competition_level: z.enum(['low', 'medium', 'high']),
        existing_brand_strength: existingBrandStrengthSchema.optional()
      })
      .passthrough()
  })
  .passthrough();

export const objectiveDiagnosisContextSchema = z
  .object({
    primary_problem_type: diagnosisProblemTypeSchema,
    secondary_problem_type: z.string().trim().min(1).nullable().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    confidence_score: z.number().min(0).max(100).optional(),
    diagnosis_summary: z.string().trim().min(1).optional(),
    root_cause: z.string().trim().min(1).optional(),
    evidence: z.array(z.unknown()).optional(),
    campaign_readiness: z.string().trim().min(1).optional(),
    recommended_next_step: z.string().trim().min(1).optional(),
    objective_direction: z.string().trim().min(1).optional()
  })
  .passthrough();

export const objectiveGenerationSchema = z
  .object({
    diagnosis_id: uuidSchema,
    diagnosis_result: objectiveDiagnosisContextSchema,
    business_goal: objectiveInputSchema.shape.business_goal,
    seo_baseline: objectiveInputSchema.shape.seo_baseline,
    constraints: objectiveInputSchema.shape.constraints
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
export type ObjectiveGenerationInput = z.infer<typeof objectiveGenerationSchema>;
export type ObjectiveListQuery = z.infer<typeof objectiveListQuerySchema>;
export type RegenerateObjectiveInput = z.infer<typeof regenerateObjectiveSchema>;

import { z } from 'zod';
import { uuidSchema } from './common';
import { achievabilityScoreSchema, objectiveTypeSchema } from './objectives';
import {
  campaignReadinessSchema,
  primaryProblemTypeSchema,
  severitySchema
} from './diagnoses';

const evidenceItemSchema = z
  .object({
    label: z.string().trim().min(1),
    value: z.string().trim().min(1),
    icon_hint: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional()
  })
  .passthrough();

const businessImpactSchema = z
  .object({
    summary: z.string().trim().min(1),
    metrics: z
      .array(
        z
          .object({
            label: z.string().trim().min(1),
            value: z.string().trim().min(1),
            direction: z.enum(['positive', 'negative', 'neutral'])
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

const diagnosisSectionSchema = z
  .object({
    summary: z.string().trim().min(1).optional(),
    critical_issues: z.array(z.string().trim().min(1)).default([]),
    checklist_priority: z.array(z.string().trim().min(1)).default([])
  })
  .passthrough();

const keywordOpportunitySchema = z
  .object({
    keyword: z.string().trim().min(1),
    current_position: z.number().finite(),
    opportunity: z.string().trim().min(1)
  })
  .passthrough();

const objectiveMetricSchema = z
  .object({
    label: z.string().trim().min(1),
    current_value: z.string().trim().min(1),
    potential_value: z.string().trim().min(1),
    gap: z.string().trim().min(1)
  })
  .passthrough();

export const diagnosisCompleteWebhookSchema = z
  .object({
    job_id: uuidSchema,
    project_id: uuidSchema,
    diagnosis_id: uuidSchema,
    status: z.literal('completed'),
    result: z
      .object({
        primary_problem_type: primaryProblemTypeSchema,
        secondary_problem_type: primaryProblemTypeSchema.optional(),
        severity: severitySchema,
        confidence_score: z.number().min(0).max(100),
        diagnosis_summary: z.string().trim().min(1),
        root_cause: z.string().trim().min(1),
        evidence: z.array(evidenceItemSchema).default([]),
        business_impact: businessImpactSchema,
        campaign_readiness: campaignReadinessSchema,
        recommended_next_step: z.string().trim().min(1),
        objective_direction: z.string().trim().min(1),
        not_recommended_actions: z.array(z.string().trim().min(1)).default([]),
        warnings: z.array(z.string().trim().min(1)).default([]),
        technical_health_score: z.number().min(0).max(100).optional(),
        ai_visibility_score: z.number().min(0).max(100).optional(),
        technical_section: diagnosisSectionSchema.optional(),
        keyword_section: z
          .object({
            summary: z.string().trim().min(1).optional(),
            top_opportunities: z.array(keywordOpportunitySchema).default([])
          })
          .passthrough()
          .optional(),
        ai_overview_section: z
          .object({
            summary: z.string().trim().min(1).optional(),
            gemini_insights: z.string().trim().min(1).optional(),
            chatgpt_insights: z.string().trim().min(1).optional(),
            recommendation: z.string().trim().min(1).optional()
          })
          .passthrough()
          .optional(),
        business_impact_section: z
          .object({
            summary: z.string().trim().min(1).optional(),
            metrics: z.array(objectiveMetricSchema).default([])
          })
          .passthrough()
          .optional(),
        raw_llm_output: z.record(z.any()).optional(),
        model_used: z.string().trim().min(1)
      })
      .passthrough()
  })
  .passthrough();

export const objectiveCompleteWebhookSchema = z
  .object({
    job_id: uuidSchema,
    project_id: uuidSchema,
    objective_id: uuidSchema,
    status: z.literal('completed'),
    result: z
      .object({
        objective_type: objectiveTypeSchema,
        smart_objective: z.string().trim().min(1),
        business_goal_alignment: z.string().trim().min(1).optional(),
        input_metrics: z.record(z.any()).optional(),
        output_metrics: z.record(z.any()).optional(),
        outcome_metrics: z.record(z.any()).optional(),
        baseline: z.record(z.any()).optional(),
        target: z.record(z.any()).optional(),
        time_period: z.string().trim().min(1).optional(),
        achievability_score: achievabilityScoreSchema.optional(),
        achievability_percent: z.number().min(0).max(100).optional(),
        risk_notes: z.array(z.string().trim().min(1)).default([]),
        pillar: z.enum(['technical', 'content_keyword', 'business_impact']).optional(),
        checklist_summary: z.string().trim().min(1).optional(),
        estimated_completion: z.string().trim().min(1).optional(),
        linked_technical_errors: z.array(z.string().trim().min(1)).default([]),
        action_items: z.array(z.string().trim().min(1)).default([]),
        target_metrics: z.record(z.any()).optional(),
        roi_estimate: z.string().trim().min(1).optional(),
        reasoning: z.string().trim().min(1).optional(),
        next_step: z.string().trim().min(1).optional(),
        objectives: z
          .array(
            z
              .object({
                pillar: z.enum(['technical', 'content_keyword', 'business_impact']),
                smart_objective: z.string().trim().min(1),
                checklist_summary: z.string().trim().min(1).optional(),
                estimated_completion: z.string().trim().min(1).optional(),
                linked_technical_errors: z.array(z.string().trim().min(1)).default([]),
                action_items: z.array(z.string().trim().min(1)).default([]),
                target_metrics: z.record(z.any()).optional(),
                roi_estimate: z.string().trim().min(1).optional()
              })
              .passthrough()
          )
          .optional(),
        raw_llm_output: z.record(z.any()).optional(),
        model_used: z.string().trim().min(1)
      })
      .passthrough()
  })
  .passthrough();

export const jobFailedWebhookSchema = z
  .object({
    job_id: uuidSchema,
    project_id: uuidSchema.optional(),
    status: z.literal('failed'),
    error_message: z.string().trim().min(1),
    details: z.record(z.any()).optional()
  })
  .passthrough();

export type DiagnosisCompleteWebhookInput = z.infer<typeof diagnosisCompleteWebhookSchema>;
export type ObjectiveCompleteWebhookInput = z.infer<typeof objectiveCompleteWebhookSchema>;
export type JobFailedWebhookInput = z.infer<typeof jobFailedWebhookSchema>;

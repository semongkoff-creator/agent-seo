import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const diagnosisStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export const primaryProblemTypeSchema = z.enum([
  'technical_bottleneck',
  'relevance_gap',
  'authority_deficit',
  'conversion_pitfall',
  'from_scratch',
  'mixed'
]);
export const severitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const campaignReadinessSchema = z.enum(['ready', 'not_ready', 'partially_ready']);

export const listDiagnosesQuerySchema = paginationSchema;

export const diagnosisIdParamsSchema = z.object({
  id: uuidSchema
});

export const rerunDiagnosisSchema = z.object({
  reason: z.string().trim().min(1).max(240).optional()
});

export type ListDiagnosesQuery = z.infer<typeof listDiagnosesQuerySchema>;
export type RerunDiagnosisInput = z.infer<typeof rerunDiagnosisSchema>;

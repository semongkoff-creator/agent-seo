import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const projectStatusSchema = z.enum(['active', 'archived']);
export const websiteStageSchema = z.enum(['from_scratch', 'new', 'existing']);
export const businessGoalSchema = z.enum(['traffic', 'leads', 'sales', 'awareness', 'local_visibility']);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  websiteUrl: z.string().trim().url(),
  industry: z.string().trim().min(1).max(120).optional(),
  targetLocation: z.string().trim().min(1).max(120).optional(),
  targetAudience: z.string().trim().min(1).max(240).optional(),
  mainProductOrService: z.string().trim().min(1).max(240).optional(),
  websiteStage: websiteStageSchema.optional(),
  mainBusinessGoal: businessGoalSchema.optional()
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = paginationSchema.extend({
  status: projectStatusSchema.optional()
});

export const projectIdParamsSchema = z.object({
  id: uuidSchema
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

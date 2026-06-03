import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const taskImpactSchema = z.enum(['high', 'medium', 'low']);
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'skipped']);

export const createTaskSchema = z
  .object({
    stepNumber: z.coerce.number().int().min(1).max(7),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(500).optional(),
    impact: taskImpactSchema.default('medium'),
    dueAt: z.string().datetime().optional()
  })
  .passthrough();

export const updateTaskSchema = createTaskSchema.partial();

export const listTasksQuerySchema = paginationSchema.extend({
  status: taskStatusSchema.optional(),
  stepNumber: z.coerce.number().int().min(1).max(7).optional()
});

export const taskIdParamsSchema = z.object({
  id: uuidSchema
});

export const campaignOverviewParamsSchema = z.object({
  id: uuidSchema
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

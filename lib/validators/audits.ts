import { z } from 'zod';
import { uuidSchema } from './common';

export const runAuditSchema = z.object({
  projectId: uuidSchema
});

export const auditTaskIdSchema = z.object({
  taskId: z.string().min(1)
});

export const cancelAuditParamsSchema = z.object({
  taskId: z.string().min(1)
});

export type RunAuditInput = z.infer<typeof runAuditSchema>;

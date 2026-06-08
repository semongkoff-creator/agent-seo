import { z } from 'zod';
import { uuidSchema } from './common';

export const technicalErrorStatusSchema = z.enum(['open', 'in_progress', 'fixed']);

export const technicalErrorPatchSchema = z.object({
  status: technicalErrorStatusSchema
});

export const technicalErrorIdParamsSchema = z.object({
  id: uuidSchema,
  errorId: z.string().min(1)
});

export type TechnicalErrorPatchInput = z.infer<typeof technicalErrorPatchSchema>;

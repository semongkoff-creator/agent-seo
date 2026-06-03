import { z } from 'zod';
import { apiKeyEnvironmentSchema } from './integrations';
import { uuidSchema } from './common';

export const createApiKeySchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    environment: apiKeyEnvironmentSchema.default('live'),
    expiresAt: z.string().datetime().optional()
  })
  .passthrough();

export const apiKeyIdParamsSchema = z.object({
  id: uuidSchema
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

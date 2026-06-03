import { z } from 'zod';
import { uuidSchema } from './common';

export const integrationProviderSchema = z.enum(['gsc', 'ga4', 'ahrefs', 'semrush']);
export const integrationStatusSchema = z.enum(['connected', 'disconnected', 'error']);
export const apiKeyEnvironmentSchema = z.enum(['live', 'test']);

export const integrationProviderParamsSchema = z.object({
  provider: integrationProviderSchema
});

export const integrationConnectSchema = z
  .object({
    apiKey: z.string().trim().min(1).optional()
  })
  .passthrough();

export const integrationPropertySchema = z
  .object({
    propertyId: z.string().trim().min(1),
    propertyName: z.string().trim().min(1).optional()
  })
  .passthrough();

export const integrationConnectRequestSchema = integrationConnectSchema.extend({
  property: integrationPropertySchema.optional()
});

export const integrationIdParamsSchema = z.object({
  id: uuidSchema
});

export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;
export type IntegrationConnectRequest = z.infer<typeof integrationConnectRequestSchema>;

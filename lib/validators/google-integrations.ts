import { z } from 'zod';

export const googleServiceSchema = z.enum(['gsc', 'ga4']);

export const googleOAuthInitiateSchema = z.object({
  service: googleServiceSchema
});

export const googleOAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1)
});

export const googleOAuthServiceQuerySchema = z.object({
  service: googleServiceSchema
});

export const gscPropertySchema = z.object({
  siteUrl: z.string().trim().min(1),
  permissionLevel: z.string().trim().min(1).optional(),
  verified: z.boolean().optional()
});

export const ga4PropertySchema = z.object({
  propertyId: z.string().trim().min(1),
  propertyName: z.string().trim().min(1).optional(),
  accountId: z.string().trim().min(1).optional(),
  accountName: z.string().trim().min(1).optional()
});

export const googlePropertySelectionSchema = z.discriminatedUnion('service', [
  z.object({
    service: z.literal('gsc'),
    property: gscPropertySchema
  }),
  z.object({
    service: z.literal('ga4'),
    property: ga4PropertySchema
  })
]);

export const googleSyncSchema = z.object({
  service: googleServiceSchema,
  dateRange: z.string().trim().min(1).optional()
});

export type GoogleService = z.infer<typeof googleServiceSchema>;
export type GoogleOAuthInitiateInput = z.infer<typeof googleOAuthInitiateSchema>;
export type GoogleOAuthCallbackInput = z.infer<typeof googleOAuthCallbackSchema>;
export type GooglePropertySelectionInput = z.infer<typeof googlePropertySelectionSchema>;
export type GoogleSyncInput = z.infer<typeof googleSyncSchema>;
export type GSCProperty = z.infer<typeof gscPropertySchema>;
export type GA4Property = z.infer<typeof ga4PropertySchema>;

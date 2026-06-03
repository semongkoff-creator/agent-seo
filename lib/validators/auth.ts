import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
  fullName: z.string().trim().min(1).max(120).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema
});

export const oauthStartSchema = z.object({
  provider: z.literal('google')
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OAuthStartInput = z.infer<typeof oauthStartSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import type { CreateApiKeyInput } from '@/lib/validators/api-keys';

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export async function listApiKeys(userId: string) {
  const { data, error } = await db
    .from('api_keys')
    .select('id, label, key_prefix, environment, last_used_at, expires_at, revoked_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) {
      return { items: [] };
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to list API keys', 500, { cause: error.message });
  }

  return { items: data ?? [] };
}

export async function createApiKey(userId: string, input: CreateApiKeyInput) {
  const secret = `sk_${input.environment}_${randomBytes(16).toString('hex')}`;
  const keyPrefix = secret.slice(0, 12);

  const { data, error } = await db
    .from('api_keys')
    .insert({
      user_id: userId,
      label: input.label,
      key_hash: hashKey(secret),
      key_prefix: keyPrefix,
      environment: input.environment,
      expires_at: input.expiresAt ?? null
    })
    .select('id, label, key_prefix, environment, expires_at, created_at')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create API key', 500, { cause: error.message });
  }

  return {
    ...data,
    plaintextKey: secret
  };
}

export async function revokeApiKey(userId: string, apiKeyId: string) {
  const { data, error } = await db
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', apiKeyId)
    .eq('user_id', userId)
    .select('id, revoked_at')
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to revoke API key', 500, { cause: error.message });
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'API key not found', 404);
  }

  return data;
}

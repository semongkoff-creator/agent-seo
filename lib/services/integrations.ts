import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { encryptSecret } from '@/lib/crypto/secrets';
import type { IntegrationConnectRequest, IntegrationProvider } from '@/lib/validators/integrations';

export async function listIntegrations(userId: string) {
  const { data, error } = await db.from('integrations').select('*').eq('user_id', userId);
  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to list integrations', 500, { cause: error.message });
  }
  return { items: data ?? [] };
}

export async function connectIntegration(
  userId: string,
  provider: IntegrationProvider,
  input: IntegrationConnectRequest
) {
  const metadata = {
    ...(input.property ?? {}),
    connectedAt: new Date().toISOString()
  };

  const { data, error } = await db
    .from('integrations')
    .upsert(
      {
        user_id: userId,
        provider,
        status: 'connected',
        credentials_encrypted: input.apiKey ? encryptSecret(input.apiKey) : null,
        metadata,
        last_sync_at: new Date().toISOString()
      },
      { onConflict: 'user_id,provider' }
    )
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to connect integration', 500, { cause: error.message });
  }

  return data;
}

export async function disconnectIntegration(userId: string, provider: IntegrationProvider) {
  const { data, error } = await db
    .from('integrations')
    .update({
      status: 'disconnected',
      credentials_encrypted: null,
      metadata: {},
      last_sync_at: null
    })
    .eq('user_id', userId)
    .eq('provider', provider)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to disconnect integration', 500, { cause: error.message });
  }

  return data;
}

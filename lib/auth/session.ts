import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import { authCookieNames } from '@/lib/auth/cookies';
import { hashToken } from '@/lib/auth/local-auth';

export type SessionUser = {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
};

function readHeader(name: string): string | null {
  try {
    return headers().get(name);
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  try {
    return headers().get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1]
      ? decodeURIComponent(headers().get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? '')
      : null;
  } catch {
    return null;
  }
}

function getAuthorizationToken(): string | null {
  const authHeader = readHeader('authorization');
  const supabaseHeader = readHeader('x-supabase-auth');
  const cookieToken = readCookie(authCookieNames.accessToken);
  const value = authHeader ?? supabaseHeader;
  if (!value) {
    return cookieToken;
  }

  const [scheme, token] = value.split(/\s+/);
  if (token && scheme?.toLowerCase() === 'bearer') {
    return token;
  }

  if (value.length > 0 && !value.includes(' ')) {
    return value;
  }

  return cookieToken;
}

export function getCurrentAuthToken(): string | null {
  return getAuthorizationToken();
}

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

function createAuthClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new AppError('INTEGRATION_ERROR', 'Supabase auth is not configured', 502);
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

async function getSupabaseUserFromToken(token: string) {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.getUser(token);

  if (error) {
    throw new AppError('UNAUTHORIZED', error.message, 401, { cause: error.name });
  }

  const supabaseUser = data.user;
  if (!supabaseUser) {
    return null;
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    fullName: supabaseUser.user_metadata?.full_name ?? null,
    avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
    role: null
  };
}

async function getLocalUserFromToken(token: string) {
  const { data: session, error: sessionError } = await db
    .from('auth_sessions')
    .select('id, auth_account_id, revoked_at, expires_at')
    .eq('access_token_hash', hashToken(token))
    .maybeSingle();

  if (sessionError) {
    if (isMissingRelationError(sessionError)) {
      return null;
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load local session', 500, {
      cause: sessionError.message
    });
  }

  if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
    return null;
  }

  const { data: account, error: accountError } = await db
    .from('auth_accounts')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', session.auth_account_id)
    .maybeSingle();

  if (accountError) {
    if (isMissingRelationError(accountError)) {
      return null;
    }

    throw new AppError('INTERNAL_ERROR', 'Failed to load local auth account', 500, {
      cause: accountError.message
    });
  }

  if (!account) {
    return null;
  }

  await db.from('auth_sessions').update({ last_used_at: new Date().toISOString() }).eq('id', session.id);

  return {
    id: account.id,
    email: account.email,
    fullName: account.full_name ?? null,
    avatarUrl: account.avatar_url ?? null,
    role: account.role ?? null
  };
}

export async function getUser(): Promise<SessionUser | null> {
  const userId = readHeader('x-user-id');
  if (!userId) {
    const token = getAuthorizationToken();
    if (!token) {
      return null;
    }

    try {
      const localUser = await getLocalUserFromToken(token);
      if (localUser) {
        return localUser;
      }
    } catch (error) {
      if (error instanceof AppError && error.statusCode >= 500) {
        throw error;
      }
    }

    try {
      return await getSupabaseUserFromToken(token);
    } catch {
      return null;
    }
  }

  return {
    id: userId,
    email: readHeader('x-user-email'),
    fullName: readHeader('x-user-name'),
    avatarUrl: readHeader('x-user-avatar'),
    role: readHeader('x-user-role')
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return user;
}

export async function requireUserWithProjectAccess(projectId: string) {
  const user = await requireUser();
  const { data, error } = await db
    .from('projects')
    .select('id, user_id, name, status')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load project access check', 500, { cause: error.message });
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Project not found', 404);
  }

  if (data.user_id !== user.id) {
    throw new AppError('FORBIDDEN', 'You do not have access to this project', 403);
  }

  return { user, project: data };
}

export async function requireApiKeyOrUser() {
  const user = await getUser();
  if (user) {
    return user;
  }

  const token = getAuthorizationToken();
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { data: apiKey, error: apiKeyError } = await db
    .from('api_keys')
    .select('id, user_id, revoked_at, expires_at')
    .eq('key_hash', hashKey(token))
    .maybeSingle();

  if (apiKeyError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to validate API key', 500, {
      cause: apiKeyError.message
    });
  }

  if (!apiKey || apiKey.revoked_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid API key', 401);
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at).getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Expired API key', 401);
  }

  await db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id);

  const { data: profile, error: userError } = await db
    .from('users')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', apiKey.user_id)
    .maybeSingle();

  if (userError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load API key owner', 500, {
      cause: userError.message
    });
  }

  if (!profile) {
    throw new AppError('NOT_FOUND', 'API key owner not found', 404);
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role
  };
}

export async function requireApiKey() {
  const token = getAuthorizationToken();
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'API key required', 401);
  }

  const { data: apiKey, error: apiKeyError } = await db
    .from('api_keys')
    .select('id, user_id, revoked_at, expires_at')
    .eq('key_hash', hashKey(token))
    .maybeSingle();

  if (apiKeyError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to validate API key', 500, {
      cause: apiKeyError.message
    });
  }

  if (!apiKey || apiKey.revoked_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid API key', 401);
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at).getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Expired API key', 401);
  }

  await db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id);

  const { data: profile, error: userError } = await db
    .from('users')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', apiKey.user_id)
    .maybeSingle();

  if (userError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load API key owner', 500, {
      cause: userError.message
    });
  }

  if (!profile) {
    throw new AppError('NOT_FOUND', 'API key owner not found', 404);
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role
  };
}

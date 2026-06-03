import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import {
  createAuthSessionTokens,
  createPasswordResetToken,
  hashPassword,
  hashToken,
  verifyPassword
} from '@/lib/auth/local-auth';
import type {
  ForgotPasswordInput,
  LoginInput,
  OAuthCallbackInput,
  OAuthStartInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput
} from '@/lib/validators/auth';

export type AuthResult = {
  userId: string;
  email: string;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: number | null;
  };
};

type LocalAuthAccount = {
  id: string;
  email: string;
  password_hash: string;
  status: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

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

async function syncUserProfile(
  userId: string,
  email: string,
  fullName?: string | null,
  avatarUrl?: string | null,
  role: string = 'member'
) {
  const { error } = await db.from('users').upsert({
    id: userId,
    email,
    full_name: fullName ?? null,
    avatar_url: avatarUrl ?? null,
    role
  });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to sync user profile', 500, { cause: error.message });
  }
}

function mapSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
}) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null
  };
}

function toSession(input: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}) {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt
  };
}

async function findAuthAccountByEmail(email: string) {
  const { data, error } = await db
    .from('auth_accounts')
    .select('id, email, password_hash, status, role, avatar_url, full_name')
    .eq('email', email.toLowerCase())
    .maybeSingle<LocalAuthAccount>();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load auth account', 500, { cause: error.message });
  }

  return data ?? null;
}

async function createLocalSession(authAccountId: string) {
  const tokens = createAuthSessionTokens();
  const { error } = await db.from('auth_sessions').insert({
    auth_account_id: authAccountId,
    access_token_hash: tokens.accessTokenHash,
    refresh_token_hash: tokens.refreshTokenHash,
    expires_at: new Date(tokens.expiresAt * 1000).toISOString()
  });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create auth session', 500, { cause: error.message });
  }

  return toSession(tokens);
}

async function rotateLocalSession(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken);
  const { data: sessionRow, error } = await db
    .from('auth_sessions')
    .select('id, auth_account_id, revoked_at, expires_at')
    .eq('refresh_token_hash', refreshTokenHash)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to refresh session', 500, { cause: error.message });
  }

  if (!sessionRow || sessionRow.revoked_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }

  if (new Date(sessionRow.expires_at).getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Expired session', 401);
  }

  const nextSession = createAuthSessionTokens();

  const { error: revokeError } = await db
    .from('auth_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', sessionRow.id);

  if (revokeError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to rotate session', 500, { cause: revokeError.message });
  }

  const { error: insertError } = await db.from('auth_sessions').insert({
    auth_account_id: sessionRow.auth_account_id,
    access_token_hash: nextSession.accessTokenHash,
    refresh_token_hash: nextSession.refreshTokenHash,
    expires_at: new Date(nextSession.expiresAt * 1000).toISOString()
  });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to rotate session', 500, { cause: insertError.message });
  }

  return toSession(nextSession);
}

async function revokeSessionByToken(token: string | null | undefined) {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await db.from('auth_sessions').update({ revoked_at: new Date().toISOString() }).eq('access_token_hash', tokenHash);
  await db.from('auth_sessions').update({ revoked_at: new Date().toISOString() }).eq('refresh_token_hash', tokenHash);
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await findAuthAccountByEmail(email);

  if (existing) {
    throw new AppError('CONFLICT', 'An account with this email already exists', 409);
  }

  const userId = randomUUID();
  const passwordHash = hashPassword(input.password);

  const { error: accountError } = await db.from('auth_accounts').insert({
    id: userId,
    email,
    password_hash: passwordHash,
    status: 'active',
    full_name: input.fullName ?? null,
    avatar_url: null,
    role: 'member',
    email_verified_at: new Date().toISOString(),
    password_updated_at: new Date().toISOString()
  });

  if (accountError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create auth account', 500, { cause: accountError.message });
  }

  await syncUserProfile(userId, email, input.fullName ?? null, null, 'member');

  const session = await createLocalSession(userId);

  return {
    userId,
    email,
    session
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const account = await findAuthAccountByEmail(email);

  if (!account || account.status !== 'active') {
    throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
  }

  if (!verifyPassword(input.password, account.password_hash)) {
    throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
  }

  const { error } = await db
    .from('auth_accounts')
    .update({
      last_login_at: new Date().toISOString(),
      full_name: account.full_name ?? null,
      avatar_url: account.avatar_url ?? null,
      role: account.role ?? 'member'
    })
    .eq('id', account.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update login timestamp', 500, { cause: error.message });
  }

  await syncUserProfile(account.id, email, account.full_name ?? null, account.avatar_url ?? null, account.role ?? 'member');

  const session = await createLocalSession(account.id);

  return {
    userId: account.id,
    email,
    session
  };
}

export async function refreshSession(input: RefreshInput): Promise<AuthResult> {
  const session = await rotateLocalSession(input.refreshToken);

  const { data: sessionRow, error: sessionError } = await db
    .from('auth_sessions')
    .select('auth_account_id')
    .eq('refresh_token_hash', hashToken(session.refreshToken))
    .maybeSingle();

  if (sessionError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load refreshed session', 500, { cause: sessionError.message });
  }

  if (!sessionRow) {
    throw new AppError('INTERNAL_ERROR', 'Unable to load refreshed session', 500);
  }

  const { data: account, error: accountError } = await db
    .from('auth_accounts')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', sessionRow.auth_account_id)
    .maybeSingle();

  if (accountError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load auth account', 500, { cause: accountError.message });
  }

  if (!account) {
    throw new AppError('NOT_FOUND', 'Auth account not found', 404);
  }

  await syncUserProfile(account.id, account.email, account.full_name ?? null, account.avatar_url ?? null, account.role ?? 'member');

  return {
    userId: account.id,
    email: account.email,
    session
  };
}

export async function logoutUser(): Promise<{ ok: true }> {
  return { ok: true };
}

export async function revokeCurrentAuthSession(token?: string | null): Promise<{ ok: true }> {
  await revokeSessionByToken(token ?? null);
  return { ok: true };
}

export async function getCurrentUserProfile(): Promise<AuthResult> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.getUser();

  if (error) {
    throw new AppError('UNAUTHORIZED', error.message, 401, { cause: error.name });
  }

  const user = data.user;
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
  }

  await syncUserProfile(
    user.id,
    user.email ?? '',
    user.user_metadata?.full_name ?? null,
    user.user_metadata?.avatar_url ?? null
  );

  return {
    userId: user.id,
    email: user.email ?? ''
  };
}

export async function startGoogleOAuth(_input: OAuthStartInput): Promise<{ url: string }> {
  const auth = createAuthClient();
  const redirectTo = `${process.env.APP_URL ?? 'http://localhost:3000'}/api/auth/oauth/google/callback`;
  const { data, error } = await auth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });

  if (error) {
    throw new AppError('INTEGRATION_ERROR', error.message, 502, { cause: error.name });
  }

  return { url: data.url };
}

export async function handleGoogleOAuthCallback(input: OAuthCallbackInput): Promise<AuthResult> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.exchangeCodeForSession(input.code);

  if (error) {
    throw new AppError('INTEGRATION_ERROR', error.message, 502, { cause: error.name });
  }

  if (!data.user || !data.session) {
    throw new AppError('INTERNAL_ERROR', 'OAuth callback did not return a session', 500);
  }

  await syncUserProfile(
    data.user.id,
    data.user.email ?? '',
    data.user.user_metadata?.full_name ?? null,
    data.user.user_metadata?.avatar_url ?? null
  );

  return {
    userId: data.user.id,
    email: data.user.email ?? '',
    session: mapSession(data.session)
  };
}

export async function sendForgotPasswordEmail(input: ForgotPasswordInput): Promise<{ ok: true; resetToken?: string; resetUrl?: string }> {
  const email = input.email.trim().toLowerCase();
  const { data: account, error } = await db
    .from('auth_accounts')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to start password reset', 500, { cause: error.message });
  }

  if (!account) {
    return { ok: true };
  }

  const reset = createPasswordResetToken();
  const { error: insertError } = await db.from('auth_password_resets').insert({
    auth_account_id: account.id,
    token_hash: reset.tokenHash,
    expires_at: reset.expiresAt.toISOString()
  });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create password reset token', 500, { cause: insertError.message });
  }

  if (process.env.NODE_ENV !== 'production') {
    return {
      ok: true,
      resetToken: reset.token,
      resetUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(reset.token)}`
    };
  }

  return { ok: true };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ ok: true }> {
  const tokenHash = hashToken(input.token);
  const { data: resetRow, error } = await db
    .from('auth_password_resets')
    .select('id, auth_account_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to verify password reset token', 500, { cause: error.message });
  }

  if (!resetRow || resetRow.used_at) {
    throw new AppError('UNAUTHORIZED', 'Invalid reset token', 401);
  }

  if (new Date(resetRow.expires_at).getTime() < Date.now()) {
    throw new AppError('UNAUTHORIZED', 'Expired reset token', 401);
  }

  const newPasswordHash = hashPassword(input.password);
  const now = new Date().toISOString();

  const { error: updateAccountError } = await db
    .from('auth_accounts')
    .update({
      password_hash: newPasswordHash,
      password_updated_at: now
    })
    .eq('id', resetRow.auth_account_id);

  if (updateAccountError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update password', 500, { cause: updateAccountError.message });
  }

  const { error: markResetError } = await db
    .from('auth_password_resets')
    .update({ used_at: now })
    .eq('id', resetRow.id);

  if (markResetError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to complete reset token', 500, { cause: markResetError.message });
  }

  await db.from('auth_sessions').update({ revoked_at: now }).eq('auth_account_id', resetRow.auth_account_id);

  return { ok: true };
}

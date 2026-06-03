import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
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

async function syncUserProfile(userId: string, email: string, fullName?: string | null, avatarUrl?: string | null) {
  const { error } = await db.from('users').upsert({
    id: userId,
    email,
    full_name: fullName ?? null,
    avatar_url: avatarUrl ?? null
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

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName ?? null
      }
    }
  });

  if (error) {
    throw new AppError('INTEGRATION_ERROR', error.message, 502, { cause: error.name });
  }

  const user = data.user;
  if (!user) {
    throw new AppError('INTERNAL_ERROR', 'Registration did not return a user', 500);
  }

  await syncUserProfile(user.id, input.email, input.fullName ?? null, null);

  return {
    userId: user.id,
    email: input.email,
    session: data.session ? mapSession(data.session) : undefined
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (error) {
    throw new AppError('UNAUTHORIZED', error.message, 401, { cause: error.name });
  }

  if (!data.user) {
    throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
  }

  await syncUserProfile(
    data.user.id,
    data.user.email ?? input.email,
    data.user.user_metadata?.full_name ?? null,
    data.user.user_metadata?.avatar_url ?? null
  );

  return {
    userId: data.user.id,
    email: data.user.email ?? input.email,
    session: data.session ? mapSession(data.session) : undefined
  };
}

export async function refreshSession(input: RefreshInput): Promise<AuthResult> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.refreshSession({
    refresh_token: input.refreshToken
  });

  if (error) {
    throw new AppError('UNAUTHORIZED', error.message, 401, { cause: error.name });
  }

  if (!data.user || !data.session) {
    throw new AppError('UNAUTHORIZED', 'Unable to refresh session', 401);
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

export async function logoutUser(): Promise<{ ok: true }> {
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

export async function sendForgotPasswordEmail(input: ForgotPasswordInput): Promise<{ ok: true }> {
  const auth = createAuthClient();
  const { error } = await auth.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password`
  });

  if (error) {
    throw new AppError('INTEGRATION_ERROR', error.message, 502, { cause: error.name });
  }

  return { ok: true };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ ok: true }> {
  const auth = createAuthClient();
  const { error } = await auth.auth.updateUser({
    password: input.password
  });

  if (error) {
    throw new AppError('INTEGRATION_ERROR', error.message, 502, { cause: error.name });
  }

  return { ok: true };
}

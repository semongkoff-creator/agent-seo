import { createHash, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Admin';

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

if (!adminEmail || !adminPassword) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `v1.${salt.toString('hex')}.${derived.toString('hex')}`;
}

function createTokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

const client = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const email = adminEmail.toLowerCase();
const { data: userPage, error: listError } = await client.auth.admin.listUsers({
  page: 1,
  perPage: 1000
});

if (listError) {
  throw listError;
}

const existingAuthUser = userPage.users.find((user) => user.email?.toLowerCase() === email);
let userId = existingAuthUser?.id ?? randomUUID();

if (existingAuthUser) {
  const { error: updateError } = await client.auth.admin.updateUserById(existingAuthUser.id, {
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminFullName
    }
  });

  if (updateError) {
    throw updateError;
  }
} else {
  const { data: createdUser, error: createError } = await client.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminFullName
    }
  });

  if (createError) {
    throw createError;
  }

  if (!createdUser.user) {
    throw new Error('Failed to create admin auth user');
  }

  userId = createdUser.user.id;
}

const { data: profile, error: profileLookupError } = await client
  .from('users')
  .select('id, email')
  .eq('email', email)
  .maybeSingle();

if (profileLookupError) {
  throw profileLookupError;
}

if (profile && profile.id !== userId) {
  const { error: cleanupError } = await client.from('users').delete().eq('email', email);
  if (cleanupError) {
    throw cleanupError;
  }
}

const passwordHash = hashPassword(adminPassword);

const { data: localAccount, error: localAccountLookupError } = await client
  .from('auth_accounts')
  .select('id, email')
  .eq('email', email)
  .maybeSingle();

if (localAccountLookupError) {
  throw localAccountLookupError;
}

if (localAccount && localAccount.id !== userId) {
  const { error: cleanupError } = await client.from('auth_accounts').delete().eq('email', email);
  if (cleanupError) {
    throw cleanupError;
  }
}

const { error: upsertAuthError } = await client.from('auth_accounts').upsert({
  id: userId,
  email,
  password_hash: passwordHash,
  status: 'active',
  full_name: adminFullName,
  avatar_url: null,
  role: 'admin',
  email_verified_at: new Date().toISOString(),
  password_updated_at: new Date().toISOString(),
  last_login_at: new Date().toISOString()
});

if (upsertAuthError) {
  throw upsertAuthError;
}

const { error: profileError } = await client.from('users').upsert({
  id: userId,
  email,
  full_name: adminFullName,
  role: 'admin',
  timezone: 'Asia/Jakarta'
});

if (profileError) {
  throw profileError;
}

console.log(`Synced local admin auth account ${adminEmail} -> ${userId}`);

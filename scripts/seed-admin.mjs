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

const { data: account, error: accountLookupError } = await client
  .from('auth_accounts')
  .select('id, email')
  .eq('email', adminEmail.toLowerCase())
  .maybeSingle();

if (accountLookupError) {
  throw accountLookupError;
}

const userId = account?.id ?? randomUUID();
const passwordHash = hashPassword(adminPassword);

const { error: upsertAuthError } = await client.from('auth_accounts').upsert({
  id: userId,
  email: adminEmail.toLowerCase(),
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
  email: adminEmail.toLowerCase(),
  full_name: adminFullName,
  role: 'admin',
  timezone: 'Asia/Jakarta'
});

if (profileError) {
  throw profileError;
}

console.log(`Synced local admin auth account ${adminEmail} -> ${userId}`);

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

const client = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const { data: page, error: listError } = await client.auth.admin.listUsers({
  page: 1,
  perPage: 1000
});

if (listError) {
  throw listError;
}

const existing = page.users.find((user) => (user.email ?? '').toLowerCase() === adminEmail.toLowerCase());

let userId;

if (existing) {
  const { error: updateError } = await client.auth.admin.updateUserById(existing.id, {
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminFullName
    }
  });

  if (updateError) {
    throw updateError;
  }

  userId = existing.id;
  console.log(`Updated admin auth user ${adminEmail}`);
} else {
  const { data, error: createError } = await client.auth.admin.createUser({
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

  if (!data.user) {
    throw new Error('Failed to create admin auth user');
  }

  userId = data.user.id;
  console.log(`Created admin auth user ${adminEmail}`);
}

const { error: profileError } = await client.from('users').upsert({
  id: userId,
  email: adminEmail,
  full_name: adminFullName,
  role: 'admin',
  timezone: 'Asia/Jakarta'
});

if (profileError) {
  throw profileError;
}

console.log(`Synced admin profile ${adminEmail} -> ${userId}`);

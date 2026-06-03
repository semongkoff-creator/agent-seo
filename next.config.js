/** @type {import('next').NextConfig} */
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'N8N_WEBHOOK_SECRET',
    'APP_WEBHOOK_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ENCRYPTION_KEY',
    'APP_URL'
  ];

  const shouldValidate = process.env.NODE_ENV === 'production' || process.env.CI === 'true' || process.env.VALIDATE_ENV === 'true';

  if (!shouldValidate) {
    return;
  }

  const missing = required.filter((key) => !process.env[key]);
  if (!process.env.N8N_WEBHOOK_URL && !process.env.N8N_IDENTIFY_WEBHOOK_URL && !process.env.N8N_OBJECTIVE_WEBHOOK_URL) {
    missing.push('N8N_WEBHOOK_URL or a workflow-specific n8n URL');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

module.exports = nextConfig;

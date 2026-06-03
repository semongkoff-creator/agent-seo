export type OpenApiSpec = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: Record<string, Record<string, unknown>>;
};

export function buildOpenApiSpec(): OpenApiSpec {
  return {
    openapi: '3.1.0',
    info: {
      title: 'SEO Agent API',
      version: '0.1.0',
      description: 'Static OpenAPI snapshot for the SEO Agent scaffold.'
    },
    paths: {
      '/api/health': { get: { summary: 'Health check' } },
      '/api/auth/register': { post: { summary: 'Register user' } },
      '/api/auth/login': { post: { summary: 'Login user' } },
      '/api/auth/logout': { post: { summary: 'Logout user' } },
      '/api/auth/refresh': { post: { summary: 'Refresh token' } },
      '/api/auth/me': { get: { summary: 'Current user' } },
      '/api/projects': { get: { summary: 'List projects' }, post: { summary: 'Create project' } },
      '/api/projects/{id}': {
        get: { summary: 'Get project' },
        patch: { summary: 'Update project' },
        delete: { summary: 'Archive project' }
      },
      '/api/diagnoses': { get: { summary: 'List diagnoses' } },
      '/api/diagnoses/{id}': { get: { summary: 'Get diagnosis' }, post: { summary: 'Rerun diagnosis' } },
      '/api/objectives': { get: { summary: 'List objectives' } },
      '/api/objectives/{id}': { get: { summary: 'Get objective' } },
      '/api/webhooks/n8n/diagnosis-complete': { post: { summary: 'Diagnosis callback' } },
      '/api/webhooks/n8n/objective-complete': { post: { summary: 'Objective callback' } },
      '/api/webhooks/n8n/job-failed': { post: { summary: 'Job failure callback' } }
    }
  };
}

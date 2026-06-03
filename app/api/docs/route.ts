import { AppError } from '@/lib/errors';
import { buildOpenApiSpec } from '@/lib/openapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    throw new AppError('NOT_FOUND', 'Docs are only available in development', 404);
  }

  const spec = buildOpenApiSpec();
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${spec.info.title}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 24px; background: #0b1020; color: #e5e7eb; }
      h1 { margin: 0 0 8px; }
      p { color: #94a3b8; }
      pre { background: #111827; padding: 16px; border-radius: 12px; overflow: auto; }
      .chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #1f2937; color: #cbd5e1; margin-bottom: 16px; }
    </style>
  </head>
  <body>
    <div class="chip">Development docs</div>
    <h1>${spec.info.title}</h1>
    <p>${spec.info.description}</p>
    <pre>${escapeHtml(JSON.stringify(spec, null, 2))}</pre>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8'
    }
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

import { ok } from '../_lib/response';
import { buildOpenApiSpec } from '@/lib/openapi';

export async function GET() {
  return ok(buildOpenApiSpec());
}

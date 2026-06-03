import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { connectIntegration, disconnectIntegration } from '@/lib/services/integrations';
import { integrationConnectRequestSchema, integrationProviderParamsSchema } from '@/lib/validators/integrations';

type Params = { params: { provider: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const parsed = integrationProviderParamsSchema.parse(params);
    const user = await requireUser();
    const input = await parseJsonBody(request, integrationConnectRequestSchema);
    const data = await connectIntegration(user.id, parsed.provider, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const parsed = integrationProviderParamsSchema.parse(params);
    const user = await requireUser();
    const data = await disconnectIntegration(user.id, parsed.provider);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

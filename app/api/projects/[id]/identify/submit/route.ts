import { ok, fail } from '@/app/api/_lib/response';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { submitIdentify } from '@/lib/services/identify';
import { identifyDraftParamsSchema } from '@/lib/validators/identify';

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    const parsed = identifyDraftParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const data = await submitIdentify(user.id, parsed.id);
    return ok(data, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}

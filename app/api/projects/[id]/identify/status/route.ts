import { ok, fail } from '@/app/api/_lib/response';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { getIdentifyStatus } from '@/lib/services/identify';
import { identifyDraftParamsSchema } from '@/lib/validators/identify';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = identifyDraftParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const data = await getIdentifyStatus(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

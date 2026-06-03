import { ok, fail } from '@/app/api/_lib/response';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { getObjectiveDraft } from '@/lib/services/objectives';
import { objectiveDraftParamsSchema } from '@/lib/validators/objectives';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = objectiveDraftParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const data = await getObjectiveDraft(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

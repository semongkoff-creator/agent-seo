import { ok, fail } from '@/app/api/_lib/response';
import { requireApiKeyOrUser } from '@/lib/auth/session';
import { getObjective } from '@/lib/services/objectives';
import { objectiveIdParamsSchema } from '@/lib/validators/objectives';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = objectiveIdParamsSchema.parse(params);
    const user = await requireApiKeyOrUser();
    const data = await getObjective(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { regenerateObjective } from '@/lib/services/objectives';
import { objectiveIdParamsSchema, regenerateObjectiveSchema } from '@/lib/validators/objectives';

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const parsed = objectiveIdParamsSchema.parse(params);
    const user = await requireUser();
    const input = await parseJsonBody(request, regenerateObjectiveSchema);
    const data = await regenerateObjective(user.id, parsed.id, input);
    return ok(data, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}

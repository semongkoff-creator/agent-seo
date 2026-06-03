import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { saveObjectiveInputs } from '@/lib/services/objectives';
import { objectiveInputSchema, objectiveInputParamsSchema } from '@/lib/validators/objectives';

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  try {
    const parsed = objectiveInputParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const input = await parseJsonBody(request, objectiveInputSchema);
    const data = await saveObjectiveInputs(user.id, parsed.id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

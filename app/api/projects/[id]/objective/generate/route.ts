import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { generateObjective } from '@/lib/services/objectives';
import { objectiveInputSchema, objectiveInputParamsSchema } from '@/lib/validators/objectives';

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const parsed = objectiveInputParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const input = await parseJsonBody(request, objectiveInputSchema);
    const data = await generateObjective(user.id, parsed.id, input);
    return ok(data, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}

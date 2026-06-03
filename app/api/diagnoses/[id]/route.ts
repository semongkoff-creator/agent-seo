import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireApiKeyOrUser, requireUser } from '@/lib/auth/session';
import { getDiagnosis, rerunDiagnosis } from '@/lib/services/diagnoses';
import { diagnosisIdParamsSchema, rerunDiagnosisSchema } from '@/lib/validators/diagnoses';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = diagnosisIdParamsSchema.parse(params);
    const user = await requireApiKeyOrUser();
    const data = await getDiagnosis(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const parsed = diagnosisIdParamsSchema.parse(params);
    const user = await requireUser();
    const input = await parseJsonBody(request, rerunDiagnosisSchema);
    const data = await rerunDiagnosis(user.id, parsed.id, input);
    return ok(data, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}

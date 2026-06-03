import { ok, fail } from '@/app/api/_lib/response';
import { requireApiKeyOrUser } from '@/lib/auth/session';
import { listDiagnoses } from '@/lib/services/diagnoses';
import { listDiagnosesQuerySchema } from '@/lib/validators/diagnoses';

export async function GET(request: Request) {
  try {
    const user = await requireApiKeyOrUser();
    const url = new URL(request.url);
    const query = listDiagnosesQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined
    });
    const data = await listDiagnoses(user.id, query);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

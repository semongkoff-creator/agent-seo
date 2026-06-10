import { ok, fail } from '@/app/api/_lib/response';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { getLatestGSCInspection } from '@/lib/services/technical-signals';
import { identifyDraftParamsSchema } from '@/lib/validators/identify';

type Params = { params: { projectId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = identifyDraftParamsSchema.parse({ id: params.projectId });
    await requireUserWithProjectAccess(parsed.id);
    const data = await getLatestGSCInspection(parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

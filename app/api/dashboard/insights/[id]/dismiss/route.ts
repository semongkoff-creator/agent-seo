import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { dismissDashboardInsight } from '@/lib/services/dashboard';
import { uuidSchema } from '@/lib/validators/common';

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    const parsedId = uuidSchema.parse(params.id);
    const user = await requireUser();
    const data = await dismissDashboardInsight(user.id, parsedId);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

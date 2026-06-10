import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { cancelAuditTask } from '@/lib/services/audits';
import { cancelAuditParamsSchema } from '@/lib/validators/audits';

type Params = { params: { taskId: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { taskId } = cancelAuditParamsSchema.parse({ taskId: params.taskId });
    const user = await requireUser();
    const data = await cancelAuditTask(user.id, taskId);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

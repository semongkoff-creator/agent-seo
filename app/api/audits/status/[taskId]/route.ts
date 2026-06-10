import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { getAuditTask, pollAuditTask } from '@/lib/services/audits';
import { auditTaskIdSchema } from '@/lib/validators/audits';

type Params = { params: { taskId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { taskId } = auditTaskIdSchema.parse({ taskId: params.taskId });
    const user = await requireUser();
    const task = await getAuditTask(user.id, taskId);

    if (task.status === 'queued' || task.status === 'in_progress') {
      const data = await pollAuditTask(user.id, taskId);
      return ok(data);
    }

    return ok({ task, auditResult: null });
  } catch (error) {
    return fail(error);
  }
}

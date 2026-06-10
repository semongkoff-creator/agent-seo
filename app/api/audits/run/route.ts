import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { createAuditTask } from '@/lib/services/audits';
import { runAuditSchema } from '@/lib/validators/audits';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, runAuditSchema);
    const user = await requireUser();
    const data = await createAuditTask(user.id, input.projectId);
    return ok(data, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}

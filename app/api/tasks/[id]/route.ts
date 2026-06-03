import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { deleteTask, updateTask } from '@/lib/services/tasks';
import { taskIdParamsSchema, updateTaskSchema } from '@/lib/validators/tasks';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const parsed = taskIdParamsSchema.parse(params);
    const user = await requireUser();
    const input = await parseJsonBody(request, updateTaskSchema);
    const data = await updateTask(user.id, parsed.id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const parsed = taskIdParamsSchema.parse(params);
    const user = await requireUser();
    const data = await deleteTask(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

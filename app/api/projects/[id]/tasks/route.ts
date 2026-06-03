import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { createTask, listTasks } from '@/lib/services/tasks';
import { createTaskSchema, listTasksQuerySchema, campaignOverviewParamsSchema } from '@/lib/validators/tasks';

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const parsed = campaignOverviewParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const url = new URL(request.url);
    const query = listTasksQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      stepNumber: url.searchParams.get('stepNumber') ?? undefined
    });
    const data = await listTasks(user.id, parsed.id, query);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const parsed = campaignOverviewParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const input = await parseJsonBody(request, createTaskSchema);
    const data = await createTask(user.id, parsed.id, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

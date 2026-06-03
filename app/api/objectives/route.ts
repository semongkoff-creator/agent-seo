import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { listObjectives } from '@/lib/services/objectives';
import { objectiveListQuerySchema } from '@/lib/validators/objectives';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const query = objectiveListQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      projectId: url.searchParams.get('projectId') ?? undefined
    });
    const data = await listObjectives(user.id, query);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireApiKeyOrUser, requireUser } from '@/lib/auth/session';
import { createProject, listProjects } from '@/lib/services/projects';
import { createProjectSchema, listProjectsQuerySchema } from '@/lib/validators/projects';

export async function GET(request: Request) {
  try {
    const user = await requireApiKeyOrUser();
    const url = new URL(request.url);
    const query = listProjectsQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      status: url.searchParams.get('status') ?? undefined
    });
    const data = await listProjects(user.id, query);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, createProjectSchema);
    const data = await createProject(user.id, input);
    return ok(data, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

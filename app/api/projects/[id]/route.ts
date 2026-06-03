import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireApiKeyOrUser, requireUserWithProjectAccess } from '@/lib/auth/session';
import { archiveProject, getProject, updateProject } from '@/lib/services/projects';
import { projectIdParamsSchema, updateProjectSchema } from '@/lib/validators/projects';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = projectIdParamsSchema.parse(params);
    const user = await requireApiKeyOrUser();
    const data = await getProject(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const parsed = projectIdParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const input = await parseJsonBody(request, updateProjectSchema);
    const data = await updateProject(user.id, parsed.id, input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const parsed = projectIdParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const data = await archiveProject(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

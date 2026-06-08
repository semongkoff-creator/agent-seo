import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { AppError, isMissingRelationError } from '@/lib/errors';
import { technicalErrorPatchSchema, technicalErrorIdParamsSchema } from '@/lib/validators/technical-errors';

type Params = { params: { id: string; errorId: string } };

function notFound(message: string) {
  throw new AppError('NOT_FOUND', message, 404);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const parsed = technicalErrorIdParamsSchema.parse(params);
    const user = await requireUser();
    const input = await parseJsonBody(request, technicalErrorPatchSchema);

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('id')
      .eq('id', parsed.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (projectError) {
      if (isMissingRelationError(projectError)) {
        notFound('Project not found');
      }

      throw new AppError('INTERNAL_ERROR', 'Failed to verify project access', 500, {
        cause: projectError.message
      });
    }

    if (!project) {
      notFound('Project not found');
    }

    const updates: Record<string, unknown> = {
      status: input.status,
      fixed_at: input.status === 'fixed' ? new Date().toISOString() : null
    };

    const { data, error } = await db
      .from('technical_errors')
      .update(updates)
      .eq('id', parsed.errorId)
      .eq('project_id', parsed.id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error)) {
        notFound('Technical error not found');
      }

      throw new AppError('INTERNAL_ERROR', 'Failed to update technical error', 500, { cause: error.message });
    }

    if (!data) {
      notFound('Technical error not found');
    }

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

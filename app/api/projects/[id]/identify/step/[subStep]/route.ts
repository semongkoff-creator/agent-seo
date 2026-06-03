import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { saveIdentifyStep } from '@/lib/services/identify';
import {
  identifyStepDraftSchema,
  identifyStepNumberSchema,
  identifyStepParamsSchema,
  identifyStepSchemas
} from '@/lib/validators/identify';

type Params = { params: { id: string; subStep: string } };

export async function PUT(request: Request, { params }: Params) {
  try {
    const parsed = identifyStepParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const body = await parseJsonBody(request, identifyStepDraftSchema);
    const stepNumber = identifyStepNumberSchema.parse(parsed.subStep) as keyof typeof identifyStepSchemas;
    const schema = identifyStepSchemas[stepNumber];
    const validated = schema.parse(body.payload);
    const data = await saveIdentifyStep(user.id, parsed.id, Number(stepNumber), validated);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { sendForgotPasswordEmail } from '@/lib/services/auth';
import { forgotPasswordSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, forgotPasswordSchema);
    const data = await sendForgotPasswordEmail(input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { resetPassword } from '@/lib/services/auth';
import { resetPasswordSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, resetPasswordSchema);
    const data = await resetPassword(input);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

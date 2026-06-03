import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { attachSetCookieHeaders, buildAuthSetCookieHeaders } from '@/lib/auth/cookies';
import { registerUser } from '@/lib/services/auth';
import { registerSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, registerSchema);
    const data = await registerUser(input);
    const response = ok(data, { status: 201 });
    if (data.session) {
      attachSetCookieHeaders(response, buildAuthSetCookieHeaders(data.session));
    }
    return response;
  } catch (error) {
    return fail(error);
  }
}

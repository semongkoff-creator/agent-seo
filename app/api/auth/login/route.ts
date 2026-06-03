import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { attachSetCookieHeaders, buildAuthSetCookieHeaders } from '@/lib/auth/cookies';
import { loginUser } from '@/lib/services/auth';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, loginSchema);
    const data = await loginUser(input);
    const response = ok(data);
    if (data.session) {
      attachSetCookieHeaders(response, buildAuthSetCookieHeaders(data.session));
    }
    return response;
  } catch (error) {
    return fail(error);
  }
}

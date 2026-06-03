import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { attachSetCookieHeaders, buildAuthSetCookieHeaders } from '@/lib/auth/cookies';
import { refreshSession } from '@/lib/services/auth';
import { refreshSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, refreshSchema);
    const data = await refreshSession(input);
    const response = ok(data);
    if (data.session) {
      attachSetCookieHeaders(response, buildAuthSetCookieHeaders(data.session));
    }
    return response;
  } catch (error) {
    return fail(error);
  }
}

import { ok, fail } from '@/app/api/_lib/response';
import { attachSetCookieHeaders, buildClearAuthCookieHeaders } from '@/lib/auth/cookies';
import { logoutUser, revokeCurrentAuthSession } from '@/lib/services/auth';
import { requireUser, getCurrentAuthToken } from '@/lib/auth/session';

export async function POST() {
  try {
    await requireUser();
    await revokeCurrentAuthSession(getCurrentAuthToken());
    const data = await logoutUser();
    const response = ok(data);
    attachSetCookieHeaders(response, buildClearAuthCookieHeaders());
    return response;
  } catch (error) {
    return fail(error);
  }
}

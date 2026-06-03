import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { attachSetCookieHeaders, buildAuthSetCookieHeaders } from '@/lib/auth/cookies';
import { handleGoogleOAuthCallback } from '@/lib/services/auth';
import { oauthCallbackSchema } from '@/lib/validators/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = oauthCallbackSchema.parse({
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state') ?? undefined
    });
    const data = await handleGoogleOAuthCallback(input);
    const response = ok(data);
    if (data.session) {
      attachSetCookieHeaders(response, buildAuthSetCookieHeaders(data.session));
    }
    return response;
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, oauthCallbackSchema);
    const data = await handleGoogleOAuthCallback(input);
    const response = ok(data);
    if (data.session) {
      attachSetCookieHeaders(response, buildAuthSetCookieHeaders(data.session));
    }
    return response;
  } catch (error) {
    return fail(error);
  }
}

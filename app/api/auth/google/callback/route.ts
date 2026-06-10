import { NextResponse } from 'next/server';
import { fail } from '@/app/api/_lib/response';
import { verifyGoogleOAuthState } from '@/lib/google-oauth';
import { completeGoogleOAuthConnection } from '@/lib/services/google-integrations';
import { googleOAuthCallbackSchema } from '@/lib/validators/google-integrations';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = googleOAuthCallbackSchema.parse({
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state')
    });
    const state = verifyGoogleOAuthState(input.state);

    const connection = await completeGoogleOAuthConnection({
      userId: state.userId,
      code: input.code,
      state: input.state
    });

    const target = new URL('/settings', url.origin);
    target.searchParams.set('integration', connection.service);
    target.searchParams.set('action', 'select_property');
    return NextResponse.redirect(target);
  } catch (error) {
    const url = new URL(request.url);
    const target = new URL('/settings', url.origin);
    target.searchParams.set('error', error instanceof Error ? error.message : 'OAuth callback failed');
    return NextResponse.redirect(target);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = googleOAuthCallbackSchema.parse(body);
    const state = verifyGoogleOAuthState(input.state);
    const connection = await completeGoogleOAuthConnection({
      userId: state.userId,
      code: input.code,
      state: input.state
    });
    return NextResponse.json({ ok: true, data: connection });
  } catch (error) {
    return fail(error);
  }
}

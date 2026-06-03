import { ok, fail } from '@/app/api/_lib/response';
import { requireUser, getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const user = await getUser();

    const { data: profile, error } = await db
      .from('users')
      .select('id, email, full_name, avatar_url, role, plan, timezone, created_at, updated_at')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (error) {
      return ok(user ?? sessionUser);
    }

    return ok({
      ...(user ?? sessionUser),
      profile: profile ?? null
    });
  } catch (error) {
    return fail(error);
  }
}

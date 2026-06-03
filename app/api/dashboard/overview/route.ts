import { ok, fail } from '@/app/api/_lib/response';
import { requireUser } from '@/lib/auth/session';
import { getDashboardOverview } from '@/lib/services/dashboard';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

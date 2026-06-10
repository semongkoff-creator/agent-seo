import { ok, fail } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/validation';
import { requireUser } from '@/lib/auth/session';
import { syncGoogleMetrics } from '@/lib/services/google-integrations';
import { googleSyncSchema } from '@/lib/validators/google-integrations';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, googleSyncSchema.omit({ service: true }));

    const data = await syncGoogleMetrics({
      userId: user.id,
      service: 'ga4',
      dateRange: input.dateRange
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

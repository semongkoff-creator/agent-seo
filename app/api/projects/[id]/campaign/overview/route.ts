import { ok, fail } from '@/app/api/_lib/response';
import { requireUserWithProjectAccess } from '@/lib/auth/session';
import { getCampaignOverview } from '@/lib/services/tasks';
import { campaignOverviewParamsSchema } from '@/lib/validators/tasks';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const parsed = campaignOverviewParamsSchema.parse(params);
    const { user } = await requireUserWithProjectAccess(parsed.id);
    const data = await getCampaignOverview(user.id, parsed.id);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

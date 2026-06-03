import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getProject } from '@/lib/services/projects';
import { getObjectiveDraft } from '@/lib/services/objectives';
import { listDiagnoses } from '@/lib/services/diagnoses';
import { objectiveInputSchema } from '@/lib/validators/objectives';
import { ObjectiveBuilder } from './_components/ObjectiveBuilder';

type PageParams = { params: { id: string } };

function mergeDraftPayloads(items: Array<Record<string, unknown>>) {
  return items.reduce<Record<string, unknown>>((acc, item) => {
    const payload = item.payload as Record<string, unknown> | undefined;
    if (payload && typeof payload === 'object') {
      Object.assign(acc, payload);
    }
    return acc;
  }, {});
}

export default async function ProjectObjectivePage({ params }: PageParams) {
  const user = await requireUser();
  const project = await getProject(user.id, params.id);
  const [draft, diagnoses] = await Promise.all([
    getObjectiveDraft(user.id, params.id),
    listDiagnoses(user.id, { page: 1, limit: 10 })
  ]);

  const projectRecord = project as Record<string, unknown>;
  const latestDiagnosis = diagnoses.items.find((item) => {
    const record = item as Record<string, unknown>;
    return record.project_id === params.id && record.status === 'completed';
  }) ?? diagnoses.items.find((item) => {
    const record = item as Record<string, unknown>;
    return record.project_id === params.id;
  }) ?? null;

  if (!latestDiagnosis) {
    redirect('/identify');
  }

  const latestDiagnosisRecord = latestDiagnosis as Record<string, unknown>;
  const mergedDraft = mergeDraftPayloads(draft.items as Array<Record<string, unknown>>);
  const draftBusinessGoal = (mergedDraft.business_goal as Record<string, unknown> | undefined) ?? {};
  const draftSeoBaseline = (mergedDraft.seo_baseline as Record<string, unknown> | undefined) ?? {};
  const draftConstraints = (mergedDraft.constraints as Record<string, unknown> | undefined) ?? {};

  const initialDraft = objectiveInputSchema.parse({
    business_goal: {
      main_business_goal:
        typeof draftBusinessGoal.main_business_goal === 'string'
          ? draftBusinessGoal.main_business_goal
          : typeof projectRecord.main_business_goal === 'string'
            ? projectRecord.main_business_goal
            : 'leads',
      business_target_value: typeof draftBusinessGoal.business_target_value === 'string' ? draftBusinessGoal.business_target_value : '',
      target_period: typeof draftBusinessGoal.target_period === 'string' ? draftBusinessGoal.target_period : '',
      priority_product_or_service:
        typeof draftBusinessGoal.priority_product_or_service === 'string'
          ? draftBusinessGoal.priority_product_or_service
          : typeof projectRecord.main_product_or_service === 'string'
            ? projectRecord.main_product_or_service
            : '',
      target_market:
        typeof draftBusinessGoal.target_market === 'string'
          ? draftBusinessGoal.target_market
          : typeof projectRecord.target_audience === 'string'
            ? projectRecord.target_audience
            : '',
      average_order_value:
        typeof draftBusinessGoal.average_order_value === 'number'
          ? draftBusinessGoal.average_order_value
          : undefined
    },
    seo_baseline: {
      current_monthly_organic_traffic:
        typeof draftSeoBaseline.current_monthly_organic_traffic === 'number'
          ? draftSeoBaseline.current_monthly_organic_traffic
          : undefined,
      current_organic_conversions:
        typeof draftSeoBaseline.current_organic_conversions === 'number'
          ? draftSeoBaseline.current_organic_conversions
          : undefined,
      current_impressions:
        typeof draftSeoBaseline.current_impressions === 'number'
          ? draftSeoBaseline.current_impressions
          : undefined,
      current_ctr: typeof draftSeoBaseline.current_ctr === 'number' ? draftSeoBaseline.current_ctr : undefined,
      current_ranking_keywords:
        typeof draftSeoBaseline.current_ranking_keywords === 'number'
          ? draftSeoBaseline.current_ranking_keywords
          : undefined,
      current_indexed_pages:
        typeof draftSeoBaseline.current_indexed_pages === 'number'
          ? draftSeoBaseline.current_indexed_pages
          : undefined,
      domain_authority: typeof draftSeoBaseline.domain_authority === 'number' ? draftSeoBaseline.domain_authority : undefined,
      referring_domains: typeof draftSeoBaseline.referring_domains === 'number' ? draftSeoBaseline.referring_domains : undefined
    },
    constraints: {
      campaign_duration: typeof draftConstraints.campaign_duration === 'string' ? draftConstraints.campaign_duration : '90 days',
      budget_level: typeof draftConstraints.budget_level === 'string' ? draftConstraints.budget_level : 'medium',
      content_capacity_per_month:
        typeof draftConstraints.content_capacity_per_month === 'number' ? draftConstraints.content_capacity_per_month : 0,
      developer_support_available:
        typeof draftConstraints.developer_support_available === 'boolean' ? draftConstraints.developer_support_available : true,
      link_building_capacity:
        typeof draftConstraints.link_building_capacity === 'string' ? draftConstraints.link_building_capacity : 'medium',
      industry_competition_level:
        typeof draftConstraints.industry_competition_level === 'string' ? draftConstraints.industry_competition_level : 'medium'
    }
  });

  return (
    <ObjectiveBuilder
      projectId={params.id}
      projectName={typeof projectRecord.name === 'string' ? projectRecord.name : 'Untitled Project'}
      diagnosisId={typeof latestDiagnosisRecord.id === 'string' ? latestDiagnosisRecord.id : null}
      diagnosisSummary={typeof latestDiagnosisRecord.diagnosis_summary === 'string' ? latestDiagnosisRecord.diagnosis_summary : 'Use the latest diagnosis as the objective reference.'}
      diagnosisType={typeof latestDiagnosisRecord.primary_problem_type === 'string' ? latestDiagnosisRecord.primary_problem_type.replace(/_/g, ' ') : 'mixed'}
      initialDraft={initialDraft}
    />
  );
}

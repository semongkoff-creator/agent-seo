import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getLatestIdentifyResult } from '@/lib/services/identify';
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

function mapIdentifyPayloadToBaseline(payload: Record<string, unknown>) {
  return {
    current_monthly_organic_traffic:
      typeof payload.monthly_organic_traffic === 'number' ? payload.monthly_organic_traffic : undefined,
    current_organic_conversions:
      typeof payload.monthly_organic_leads === 'number'
        ? payload.monthly_organic_leads
        : typeof payload.monthly_organic_sales === 'number'
          ? payload.monthly_organic_sales
          : undefined,
    current_impressions: typeof payload.monthly_impressions === 'number' ? payload.monthly_impressions : undefined,
    current_ctr: typeof payload.monthly_ctr === 'number' ? payload.monthly_ctr : undefined,
    current_ranking_keywords: Array.isArray(payload.current_ranking_keywords)
      ? payload.current_ranking_keywords.length
      : undefined,
    current_indexed_pages: typeof payload.indexed_pages === 'number' ? payload.indexed_pages : undefined,
    domain_authority: typeof payload.domain_rating === 'number' ? payload.domain_rating : undefined,
    referring_domains: typeof payload.referring_domains === 'number' ? payload.referring_domains : undefined,
    current_conversion_rate:
      typeof payload.current_conversion_rate === 'number' ? payload.current_conversion_rate : undefined,
    bounce_rate: typeof payload.bounce_rate === 'number' ? payload.bounce_rate : undefined
  };
}

export default async function ProjectObjectivePage({ params }: PageParams) {
  const user = await requireUser();
  const [draft, diagnoses] = await Promise.all([
    getObjectiveDraft(user.id, params.id),
    listDiagnoses(user.id, { page: 1, limit: 10 })
  ]);
  const latestIdentify = await getLatestIdentifyResult(user.id, params.id);

  const latestIdentifyPayload = (latestIdentify?.payload as Record<string, unknown> | undefined) ?? {};
  const projectRecord = {
    id: params.id,
    name: latestIdentifyPayload.business_name ?? 'Untitled Project',
    website_url: latestIdentifyPayload.website_url,
    main_business_goal:
      typeof latestIdentifyPayload.main_business_goal === 'string' ? latestIdentifyPayload.main_business_goal : 'leads',
    main_product_or_service: latestIdentifyPayload.main_product_or_service,
    target_audience: latestIdentifyPayload.target_audience,
    website_stage:
      typeof latestIdentifyPayload.website_stage === 'string' ? latestIdentifyPayload.website_stage : 'existing'
  } as Record<string, unknown>;
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
  const draftBusinessGoal = ((mergedDraft.business_goal as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const draftSeoBaseline = ((mergedDraft.seo_baseline as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const draftConstraints = ((mergedDraft.constraints as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const identifyBaseline = (
    latestIdentifyPayload && Object.keys(latestIdentifyPayload).length > 0
      ? mapIdentifyPayloadToBaseline(latestIdentifyPayload)
      : {}
  ) as Record<string, unknown>;

  const initialDraft = objectiveInputSchema.parse({
    business_goal: {
      main_business_goal:
        typeof draftBusinessGoal.main_business_goal === 'string'
          ? draftBusinessGoal.main_business_goal
          : typeof projectRecord.main_business_goal === 'string'
            ? projectRecord.main_business_goal
            : 'leads',
      business_target_value: typeof draftBusinessGoal.business_target_value === 'string' ? draftBusinessGoal.business_target_value : '',
      target_period: typeof draftBusinessGoal.target_period === 'string' ? draftBusinessGoal.target_period : '6 months',
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
          : typeof identifyBaseline.current_monthly_organic_traffic === 'number'
            ? identifyBaseline.current_monthly_organic_traffic
            : undefined,
      current_organic_conversions:
        typeof draftSeoBaseline.current_organic_conversions === 'number'
          ? draftSeoBaseline.current_organic_conversions
          : typeof identifyBaseline.current_organic_conversions === 'number'
            ? identifyBaseline.current_organic_conversions
            : undefined,
      current_impressions:
        typeof draftSeoBaseline.current_impressions === 'number'
          ? draftSeoBaseline.current_impressions
          : typeof identifyBaseline.current_impressions === 'number'
            ? identifyBaseline.current_impressions
            : undefined,
      current_ctr:
        typeof draftSeoBaseline.current_ctr === 'number'
          ? draftSeoBaseline.current_ctr
          : typeof identifyBaseline.current_ctr === 'number'
            ? identifyBaseline.current_ctr
            : undefined,
      current_ranking_keywords:
        typeof draftSeoBaseline.current_ranking_keywords === 'number'
          ? draftSeoBaseline.current_ranking_keywords
          : typeof identifyBaseline.current_ranking_keywords === 'number'
            ? identifyBaseline.current_ranking_keywords
            : undefined,
      current_indexed_pages:
        typeof draftSeoBaseline.current_indexed_pages === 'number'
          ? draftSeoBaseline.current_indexed_pages
          : typeof identifyBaseline.current_indexed_pages === 'number'
            ? identifyBaseline.current_indexed_pages
            : undefined,
      domain_authority:
        typeof draftSeoBaseline.domain_authority === 'number'
          ? draftSeoBaseline.domain_authority
          : typeof identifyBaseline.domain_authority === 'number'
            ? identifyBaseline.domain_authority
            : undefined,
      referring_domains:
        typeof draftSeoBaseline.referring_domains === 'number'
          ? draftSeoBaseline.referring_domains
          : typeof identifyBaseline.referring_domains === 'number'
            ? identifyBaseline.referring_domains
            : undefined,
      current_conversion_rate:
        typeof draftSeoBaseline.current_conversion_rate === 'number'
          ? draftSeoBaseline.current_conversion_rate
          : typeof identifyBaseline.current_conversion_rate === 'number'
            ? identifyBaseline.current_conversion_rate
            : undefined,
      bounce_rate:
        typeof draftSeoBaseline.bounce_rate === 'number'
          ? draftSeoBaseline.bounce_rate
          : typeof identifyBaseline.bounce_rate === 'number'
            ? identifyBaseline.bounce_rate
            : undefined
    },
    constraints: {
      campaign_duration:
        typeof draftConstraints.campaign_duration === 'string'
          ? draftConstraints.campaign_duration
          : '6 months',
      budget_level: typeof draftConstraints.budget_level === 'string' ? draftConstraints.budget_level : 'medium',
      content_capacity_per_month:
        typeof draftConstraints.content_capacity_per_month === 'number' ? draftConstraints.content_capacity_per_month : 0,
      developer_support_available:
        typeof draftConstraints.developer_support_available === 'boolean' ? draftConstraints.developer_support_available : true,
      link_building_capacity:
        typeof draftConstraints.link_building_capacity === 'string' ? draftConstraints.link_building_capacity : 'medium',
      industry_competition_level:
        typeof draftConstraints.industry_competition_level === 'string' ? draftConstraints.industry_competition_level : 'medium',
      existing_brand_strength:
        typeof draftConstraints.existing_brand_strength === 'string' ? draftConstraints.existing_brand_strength : undefined
    }
  });

  return (
    <ObjectiveBuilder
      projectId={params.id}
      projectName={typeof projectRecord.name === 'string' ? projectRecord.name : 'Untitled Project'}
      websiteStage={typeof projectRecord.website_stage === 'string' ? projectRecord.website_stage : 'existing'}
      diagnosisId={typeof latestDiagnosisRecord.id === 'string' ? latestDiagnosisRecord.id : null}
      diagnosisSummary={typeof latestDiagnosisRecord.diagnosis_summary === 'string' ? latestDiagnosisRecord.diagnosis_summary : 'Use the latest diagnosis as the objective reference.'}
      diagnosisType={typeof latestDiagnosisRecord.primary_problem_type === 'string' ? latestDiagnosisRecord.primary_problem_type.replace(/_/g, ' ') : 'mixed'}
      diagnosisSeverity={typeof latestDiagnosisRecord.severity === 'string' ? latestDiagnosisRecord.severity : 'medium'}
      diagnosisDirection={typeof latestDiagnosisRecord.objective_direction === 'string' ? latestDiagnosisRecord.objective_direction : 'Focus on the recommended next step from the diagnosis.'}
      diagnosisResult={{
        primary_problem_type: latestDiagnosisRecord.primary_problem_type,
        secondary_problem_type: latestDiagnosisRecord.secondary_problem_type ?? null,
        severity: latestDiagnosisRecord.severity,
        confidence_score: latestDiagnosisRecord.confidence_score,
        diagnosis_summary: latestDiagnosisRecord.diagnosis_summary,
        root_cause: latestDiagnosisRecord.root_cause,
        evidence: latestDiagnosisRecord.evidence,
        campaign_readiness: latestDiagnosisRecord.campaign_readiness,
        recommended_next_step: latestDiagnosisRecord.recommended_next_step,
        objective_direction: latestDiagnosisRecord.objective_direction
      }}
      initialDraft={initialDraft}
    />
  );
}

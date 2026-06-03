import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getIdentifyDraft } from '@/lib/services/identify';
import { getProject } from '@/lib/services/projects';
import { identifyStepNumberSchema } from '@/lib/validators/identify';
import { IdentifyWizard } from '../../_components/IdentifyWizard';
import { buildStepState, type IdentifyStepNumber } from '../../_components/identify-wizard-data';

type PageParams = { params: { id: string; step: string } };

function mergeDraftItems(items: Array<Record<string, unknown>>) {
  return items.reduce<Record<string, unknown>>((acc, item) => {
    if (item && typeof item.payload === 'object' && item.payload !== null) {
      Object.assign(acc, item.payload as Record<string, unknown>);
    }
    return acc;
  }, {});
}

export default async function IdentifyStepPage({ params }: PageParams) {
  const user = await requireUser();
  const project = await getProject(user.id, params.id);
  const projectRecord = project as Record<string, unknown>;
  const parsedStep = identifyStepNumberSchema.parse(params.step) as IdentifyStepNumber;
  const draftResult = await getIdentifyDraft(user.id, params.id);
  const mergedDrafts = mergeDraftItems(draftResult.items as Array<Record<string, unknown>>);
  const seedState = {
    ...mergedDrafts,
    website_url: typeof projectRecord.website_url === 'string' ? projectRecord.website_url : '',
    business_name: typeof projectRecord.name === 'string' ? projectRecord.name : '',
    industry: typeof projectRecord.industry === 'string' ? projectRecord.industry : '',
    target_location: typeof projectRecord.target_location === 'string' ? projectRecord.target_location : '',
    target_audience: typeof projectRecord.target_audience === 'string' ? projectRecord.target_audience : '',
    main_product_or_service:
      typeof projectRecord.main_product_or_service === 'string' ? projectRecord.main_product_or_service : '',
    website_stage: typeof projectRecord.website_stage === 'string' ? projectRecord.website_stage : 'existing'
  };

  const stepOneState = buildStepState(1, seedState);
  const fromScratch = String(stepOneState.website_stage ?? seedState.website_stage ?? '') === 'from_scratch';

  if (fromScratch && parsedStep > 2) {
    redirect(`/projects/${params.id}/identify/step/2`);
  }

  if (parsedStep < 1 || parsedStep > 6) {
    redirect(`/projects/${params.id}/identify/step/1`);
  }

  return (
    <IdentifyWizard
      projectId={params.id}
      projectName={typeof projectRecord.name === 'string' ? projectRecord.name : 'Untitled Project'}
      projectUrl={typeof projectRecord.website_url === 'string' ? projectRecord.website_url : 'https://example.com'}
      currentStep={parsedStep}
      initialDrafts={seedState}
    />
  );
}

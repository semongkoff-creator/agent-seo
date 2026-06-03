export type IdentifyWorkflowDraft = {
  id: string;
  stepNumber: number;
  subStep: string;
  payload: Record<string, unknown>;
};

export type IdentifyWorkflowPayload = {
  app: 'seo-agent';
  action: 'identify_problem';
  submittedAt: string;
  job_id: string;
  job: {
    id: string;
    type: 'identify_problem';
  };
  project_id: string;
  project: {
    id: string;
  };
  diagnosis_id: string;
  diagnosis: {
    id: string;
  };
  identify_drafts: IdentifyWorkflowDraft[];
  identify_merged: Record<string, unknown>;
  identify: {
    drafts: IdentifyWorkflowDraft[];
    merged: Record<string, unknown>;
  };
};

export type ObjectiveWorkflowPayload = {
  app: 'seo-agent';
  action: 'define_objective';
  submittedAt: string;
  job_id: string;
  job: {
    id: string;
    type: 'define_objective';
  };
  project_id: string;
  project: {
    id: string;
  };
  diagnosis_id: string;
  diagnosis: {
    id: string;
  };
  objective_id: string;
  objective: {
    id: string;
  };
  diagnosis_result: Record<string, unknown>;
  objective_input: Record<string, unknown>;
  diagnosisResult: Record<string, unknown>;
  objectiveInput: Record<string, unknown>;
};

export type DiagnosisCompleteCallbackPayload = {
  job_id: string;
  project_id: string;
  diagnosis_id: string;
  status: 'completed';
  result: Record<string, unknown>;
};

export type ObjectiveCompleteCallbackPayload = {
  job_id: string;
  project_id: string;
  objective_id: string;
  status: 'completed';
  result: Record<string, unknown>;
};

export type JobFailedCallbackPayload = {
  job_id: string;
  project_id?: string;
  status: 'failed';
  error_message: string;
  details?: Record<string, unknown>;
};

export function buildIdentifyWorkflowPayload(input: {
  jobId: string;
  projectId: string;
  diagnosisId: string;
  drafts: IdentifyWorkflowDraft[];
  merged: Record<string, unknown>;
  submittedAt?: string;
}): IdentifyWorkflowPayload {
  return {
    app: 'seo-agent',
    action: 'identify_problem',
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    job_id: input.jobId,
    job: {
      id: input.jobId,
      type: 'identify_problem'
    },
    project_id: input.projectId,
    project: {
      id: input.projectId
    },
    diagnosis_id: input.diagnosisId,
    diagnosis: {
      id: input.diagnosisId
    },
    identify_drafts: input.drafts,
    identify_merged: input.merged,
    identify: {
      drafts: input.drafts,
      merged: input.merged
    }
  };
}

export function buildObjectiveWorkflowPayload(input: {
  jobId: string;
  projectId: string;
  diagnosisId: string;
  objectiveId: string;
  diagnosisResult: Record<string, unknown>;
  objectiveInput: Record<string, unknown>;
  submittedAt?: string;
}): ObjectiveWorkflowPayload {
  return {
    app: 'seo-agent',
    action: 'define_objective',
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    job_id: input.jobId,
    job: {
      id: input.jobId,
      type: 'define_objective'
    },
    project_id: input.projectId,
    project: {
      id: input.projectId
    },
    diagnosis_id: input.diagnosisId,
    diagnosis: {
      id: input.diagnosisId
    },
    objective_id: input.objectiveId,
    objective: {
      id: input.objectiveId
    },
    diagnosis_result: input.diagnosisResult,
    objective_input: input.objectiveInput,
    diagnosisResult: input.diagnosisResult,
    objectiveInput: input.objectiveInput
  };
}

export function buildDiagnosisCompleteCallbackPayload(input: {
  jobId: string;
  projectId: string;
  diagnosisId: string;
  result: Record<string, unknown>;
}): DiagnosisCompleteCallbackPayload {
  return {
    job_id: input.jobId,
    project_id: input.projectId,
    diagnosis_id: input.diagnosisId,
    status: 'completed',
    result: input.result
  };
}

export function buildObjectiveCompleteCallbackPayload(input: {
  jobId: string;
  projectId: string;
  objectiveId: string;
  result: Record<string, unknown>;
}): ObjectiveCompleteCallbackPayload {
  return {
    job_id: input.jobId,
    project_id: input.projectId,
    objective_id: input.objectiveId,
    status: 'completed',
    result: input.result
  };
}

export function buildJobFailedCallbackPayload(input: {
  jobId: string;
  projectId?: string;
  errorMessage: string;
  details?: Record<string, unknown>;
}): JobFailedCallbackPayload {
  return {
    job_id: input.jobId,
    project_id: input.projectId,
    status: 'failed',
    error_message: input.errorMessage,
    details: input.details
  };
}

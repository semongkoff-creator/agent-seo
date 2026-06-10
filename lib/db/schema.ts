import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['owner', 'member', 'admin']);
export const userPlanEnum = pgEnum('user_plan', ['free', 'starter', 'growth', 'scale']);

export const projectStatusEnum = pgEnum('project_status', ['active', 'archived']);
export const websiteStageEnum = pgEnum('website_stage', ['from_scratch', 'new', 'existing']);
export const businessGoalEnum = pgEnum('business_goal', [
  'traffic',
  'leads',
  'keyword_position',
  'sales',
  'awareness',
  'local_visibility'
]);

export const diagnosisStatusEnum = pgEnum('diagnosis_status', ['pending', 'processing', 'completed', 'failed']);
export const primaryProblemTypeEnum = pgEnum('primary_problem_type', [
  'technical_bottleneck',
  'relevance_gap',
  'authority_deficit',
  'conversion_pitfall',
  'from_scratch',
  'mixed'
]);
export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);
export const campaignReadinessEnum = pgEnum('campaign_readiness', ['ready', 'not_ready', 'partially_ready']);

export const objectiveTypeEnum = pgEnum('objective_type', [
  'technical_recovery',
  'qualified_traffic',
  'authority_growth',
  'conversion_improvement',
  'foundation_building',
  'mixed'
]);
export const achievabilityScoreEnum = pgEnum('achievability_score', ['low', 'moderate', 'high']);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'not_started',
  'in_progress',
  'completed',
  'blocked',
  'locked'
]);
export const taskImpactEnum = pgEnum('task_impact', ['high', 'medium', 'low']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'skipped']);

export const integrationProviderEnum = pgEnum('integration_provider', ['gsc', 'ga4', 'ahrefs', 'semrush']);
export const integrationStatusEnum = pgEnum('integration_status', ['connected', 'disconnected', 'error']);
export const apiKeyEnvironmentEnum = pgEnum('api_key_environment', ['live', 'test']);
export const oauthServiceEnum = pgEnum('oauth_service', ['gsc', 'ga4']);
export const oauthConnectionStatusEnum = pgEnum('oauth_connection_status', ['connected', 'disconnected', 'error']);

export const jobTypeEnum = pgEnum('job_type', ['identify_problem', 'define_objective']);
export const jobStatusEnum = pgEnum('job_status', ['queued', 'processing', 'completed', 'failed']);
export const usageEventTypeEnum = pgEnum('usage_event_type', [
  'project_created',
  'diagnosis_run',
  'objective_generated',
  'api_request'
]);
export const aiInsightKindEnum = pgEnum('ai_insight_kind', ['opportunity', 'anomaly', 'recommendation']);

const createdAt = timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

export const authAccountStatusEnum = pgEnum('auth_account_status', ['active', 'disabled']);

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    status: authAccountStatusEnum('status').notNull().default('active'),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('member'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt,
    updatedAt
  },
  () => ({})
);

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authAccountId: uuid('auth_account_id')
      .notNull()
      .references(() => authAccounts.id, { onDelete: 'cascade' }),
    accessTokenHash: text('access_token_hash').notNull().unique(),
    refreshTokenHash: text('refresh_token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    accountIdx: index('auth_sessions_account_idx').on(table.authAccountId),
    accessHashIdx: index('auth_sessions_access_hash_idx').on(table.accessTokenHash),
    refreshHashIdx: index('auth_sessions_refresh_hash_idx').on(table.refreshTokenHash)
  })
);

export const authPasswordResets = pgTable(
  'auth_password_resets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authAccountId: uuid('auth_account_id')
      .notNull()
      .references(() => authAccounts.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    accountIdx: index('auth_password_resets_account_idx').on(table.authAccountId),
    tokenHashIdx: index('auth_password_resets_token_hash_idx').on(table.tokenHash)
  })
);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('member'),
  plan: userPlanEnum('plan').notNull().default('free'),
  timezone: text('timezone'),
  createdAt,
  updatedAt
});

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    websiteUrl: text('website_url').notNull(),
    industry: text('industry'),
    targetLocation: text('target_location'),
    targetAudience: text('target_audience'),
    mainProductOrService: text('main_product_or_service'),
    websiteStage: websiteStageEnum('website_stage'),
    mainBusinessGoal: businessGoalEnum('main_business_goal'),
    status: projectStatusEnum('status').notNull().default('active'),
    currentStep: integer('current_step').notNull().default(1),
    createdAt,
    updatedAt
  },
  (table) => ({
    userStatusIdx: index('projects_user_status_idx').on(table.userId, table.status),
    userUpdatedIdx: index('projects_user_updated_at_idx').on(table.userId, table.updatedAt)
  })
);

export const seoInputs = pgTable(
  'seo_inputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    subStep: integer('sub_step').notNull(),
    payload: jsonb('payload').notNull(),
    isDraft: boolean('is_draft').notNull().default(true),
    createdAt
  },
  (table) => ({
    stepIdx: index('seo_inputs_project_step_substep_idx').on(table.projectId, table.stepNumber, table.subStep)
  })
);

export const seoDiagnoses = pgTable(
  'seo_diagnoses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    inputId: uuid('input_id')
      .references(() => seoInputs.id, { onDelete: 'set null' }),
    primaryProblemType: primaryProblemTypeEnum('primary_problem_type').notNull(),
    secondaryProblemType: primaryProblemTypeEnum('secondary_problem_type'),
    severity: severityEnum('severity').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }).notNull(),
    diagnosisSummary: text('diagnosis_summary').notNull(),
    rootCause: text('root_cause').notNull(),
    evidence: jsonb('evidence').notNull().default([]),
    businessImpact: jsonb('business_impact').notNull().default({}),
    campaignReadiness: campaignReadinessEnum('campaign_readiness').notNull(),
    recommendedNextStep: text('recommended_next_step').notNull(),
    objectiveDirection: text('objective_direction').notNull(),
    technicalHealthScore: integer('technical_health_score'),
    aiVisibilityScore: integer('ai_visibility_score'),
    crawlErrorsData: jsonb('crawl_errors_data').notNull().default({}),
    coreWebVitalsData: jsonb('core_web_vitals_data').notNull().default({}),
    mobileUsabilityData: jsonb('mobile_usability_data').notNull().default({}),
    dataSourcesStatus: jsonb('data_sources_status').notNull().default({}),
    technicalSection: jsonb('technical_section').notNull().default({}),
    keywordSection: jsonb('keyword_section').notNull().default({}),
    aiOverviewSection: jsonb('ai_overview_section').notNull().default({}),
    businessImpactSection: jsonb('business_impact_section').notNull().default({}),
    notRecommendedActions: jsonb('not_recommended_actions').notNull().default([]),
    warnings: jsonb('warnings').notNull().default([]),
    rawLlmOutput: jsonb('raw_llm_output').notNull().default({}),
    modelUsed: text('model_used').notNull(),
    status: diagnosisStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt,
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => ({
    projectCreatedIdx: index('seo_diagnoses_project_created_idx').on(table.projectId, table.createdAt),
    statusIdx: index('seo_diagnoses_status_idx').on(table.status)
  })
);

export const seoObjectives = pgTable(
  'seo_objectives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    diagnosisId: uuid('diagnosis_id')
      .references(() => seoDiagnoses.id, { onDelete: 'set null' }),
    inputId: uuid('input_id')
      .references(() => seoInputs.id, { onDelete: 'set null' }),
    objectiveType: objectiveTypeEnum('objective_type').notNull(),
    smartObjective: text('smart_objective').notNull(),
    businessGoalAlignment: text('business_goal_alignment'),
    inputMetrics: jsonb('input_metrics').notNull().default({}),
    outputMetrics: jsonb('output_metrics').notNull().default({}),
    outcomeMetrics: jsonb('outcome_metrics').notNull().default({}),
    baseline: jsonb('baseline').notNull().default({}),
    target: jsonb('target').notNull().default({}),
    timePeriod: text('time_period'),
    achievabilityScore: achievabilityScoreEnum('achievability_score'),
    achievabilityPercent: numeric('achievability_percent', { precision: 5, scale: 2 }),
    riskNotes: jsonb('risk_notes').notNull().default([]),
    pillar: text('pillar'),
    checklistSummary: text('checklist_summary'),
    estimatedCompletion: text('estimated_completion'),
    linkedTechnicalErrors: jsonb('linked_technical_errors').notNull().default([]),
    actionItems: jsonb('action_items').notNull().default([]),
    targetMetrics: jsonb('target_metrics').notNull().default({}),
    roiEstimate: text('roi_estimate'),
    reasoning: text('reasoning'),
    nextStep: text('next_step'),
    rawLlmOutput: jsonb('raw_llm_output').notNull().default({}),
    modelUsed: text('model_used').notNull(),
    status: diagnosisStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt,
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => ({
    projectCreatedIdx: index('seo_objectives_project_created_idx').on(table.projectId, table.createdAt),
    diagnosisIdx: index('seo_objectives_diagnosis_idx').on(table.diagnosisId)
  })
);

export const campaignProgress = pgTable(
  'campaign_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    status: campaignStatusEnum('status').notNull().default('not_started'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => ({
    uniqueProgress: uniqueIndex('campaign_progress_project_step_unique').on(table.projectId, table.stepNumber)
  })
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    impact: taskImpactEnum('impact').notNull().default('medium'),
    status: taskStatusEnum('status').notNull().default('pending'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    projectStatusIdx: index('tasks_project_status_idx').on(table.projectId, table.status)
  })
);

export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: integrationProviderEnum('provider').notNull(),
    status: integrationStatusEnum('status').notNull().default('disconnected'),
    credentialsEncrypted: text('credentials_encrypted'),
    metadata: jsonb('metadata').notNull().default({}),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    userProviderUnique: uniqueIndex('integrations_user_provider_unique').on(table.userId, table.provider)
  })
);

export const psiAudits = pgTable(
  'psi_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    auditedUrl: text('audited_url').notNull(),
    strategy: text('strategy').notNull().default('mobile'),
    lcpValue: numeric('lcp_value'),
    lcpScore: text('lcp_score'),
    clsValue: numeric('cls_value'),
    clsScore: text('cls_score'),
    inpValue: numeric('inp_value'),
    inpScore: text('inp_score'),
    performanceScore: integer('performance_score'),
    accessibilityScore: integer('accessibility_score'),
    bestPracticesScore: integer('best_practices_score'),
    seoScore: integer('seo_score'),
    overallPass: boolean('overall_pass').notNull().default(false),
    auditsFailed: jsonb('audits_failed').notNull().default([]),
    rawResponse: jsonb('raw_response').notNull().default({}),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt
  },
  (table) => ({
    projectIdx: index('idx_psi_audits_project').on(table.projectId),
    fetchedIdx: index('idx_psi_audits_fetched').on(table.fetchedAt)
  })
);

export const gscInspectionResults = pgTable(
  'gsc_inspection_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalUrlsInspected: integer('total_urls_inspected').notNull().default(0),
    crawlErrorsTotal: integer('crawl_errors_total').notNull().default(0),
    crawlErrorsBreakdown: jsonb('crawl_errors_breakdown').notNull().default({}),
    mobileUsabilityIssuesTotal: integer('mobile_usability_issues_total').notNull().default(0),
    mobileUsabilityBreakdown: jsonb('mobile_usability_breakdown').notNull().default({}),
    robotsBlockedCount: integer('robots_blocked_count').notNull().default(0),
    affectedUrls: jsonb('affected_urls').notNull().default([]),
    rawResponse: jsonb('raw_response').notNull().default({}),
    inspectedAt: timestamp('inspected_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt
  },
  (table) => ({
    projectIdx: index('idx_gsc_inspection_project').on(table.projectId),
    inspectedIdx: index('idx_gsc_inspection_inspected').on(table.inspectedAt)
  })
);

export const oauthConnections = pgTable(
  'oauth_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    service: oauthServiceEnum('service').notNull(),
    status: oauthConnectionStatusEnum('status').notNull().default('connected'),
    googleEmail: text('google_email'),
    googleName: text('google_name'),
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    scopes: jsonb('scopes').notNull().default([]),
    connectedResource: jsonb('connected_resource').notNull().default({}),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    userServiceUnique: uniqueIndex('oauth_connections_user_service_unique').on(table.userId, table.service),
    userIdx: index('oauth_connections_user_idx').on(table.userId),
    statusIdx: index('oauth_connections_status_idx').on(table.status)
  })
);

export const gscMetrics = pgTable(
  'gsc_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    metricType: text('metric_type').notNull(),
    metricValue: jsonb('metric_value').notNull(),
    dataSource: text('data_source').notNull().default('mock'),
    dateRange: text('date_range'),
    sourceConnectionId: uuid('source_connection_id').references(() => oauthConnections.id, {
      onDelete: 'set null'
    }),
    measuredAt: timestamp('measured_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt
  },
  (table) => ({
    projectIdx: index('gsc_metrics_project_idx').on(table.projectId, table.measuredAt),
    sourceIdx: index('gsc_metrics_source_idx').on(table.sourceConnectionId, table.measuredAt)
  })
);

export const ga4Metrics = pgTable(
  'ga4_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    metricType: text('metric_type').notNull(),
    metricValue: jsonb('metric_value').notNull(),
    dataSource: text('data_source').notNull().default('mock'),
    dateRange: text('date_range'),
    sourceConnectionId: uuid('source_connection_id').references(() => oauthConnections.id, {
      onDelete: 'set null'
    }),
    measuredAt: timestamp('measured_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt
  },
  (table) => ({
    projectIdx: index('ga4_metrics_project_idx').on(table.projectId, table.measuredAt),
    sourceIdx: index('ga4_metrics_source_idx').on(table.sourceConnectionId, table.measuredAt)
  })
);

export const technicalErrors = pgTable(
  'technical_errors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    diagnosisId: uuid('diagnosis_id').references(() => seoDiagnoses.id, { onDelete: 'set null' }),
    source: text('source').notNull(),
    errorType: text('error_type').notNull(),
    errorCount: integer('error_count').notNull().default(0),
    affectedUrls: jsonb('affected_urls').notNull().default([]),
    screenshots: jsonb('screenshots').notNull().default([]),
    severity: severityEnum('severity').notNull().default('medium'),
    status: text('status').notNull().default('open'),
    fixedAt: timestamp('fixed_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    projectIdx: index('technical_errors_project_idx').on(table.projectId, table.createdAt),
    statusIdx: index('technical_errors_status_idx').on(table.status)
  })
);

export const auditTasks = pgTable(
  'audit_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('dataforseo'),
    externalTaskId: text('external_task_id'),
    targetUrl: text('target_url').notNull(),
    maxCrawlPages: integer('max_crawl_pages').notNull().default(500),
    status: text('status').notNull().default('queued'),
    pagesCrawled: integer('pages_crawled').notNull().default(0),
    pagesTotal: integer('pages_total'),
    progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }).notNull().default('0'),
    totalErrorsFound: integer('total_errors_found').notNull().default(0),
    errorsBySeverity: jsonb('errors_by_severity').notNull().default({}),
    estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 4 }),
    actualCostUsd: numeric('actual_cost_usd', { precision: 10, scale: 4 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),
    rawSummary: jsonb('raw_summary'),
    createdAt,
    updatedAt
  },
  (table) => ({
    projectIdx: index('idx_audit_tasks_project').on(table.projectId),
    statusIdx: index('idx_audit_tasks_status').on(table.status),
    externalIdx: index('idx_audit_tasks_external_id').on(table.externalTaskId)
  })
);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    environment: apiKeyEnvironmentEnum('environment').notNull().default('live'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    userIdx: index('api_keys_user_idx').on(table.userId),
    hashIdx: index('api_keys_key_hash_idx').on(table.keyHash)
  })
);

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'set null' }),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    requestPayload: jsonb('request_payload').notNull().default({}),
    responsePayload: jsonb('response_payload').notNull().default({}),
    errorMessage: text('error_message'),
    createdAt,
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => ({
    projectIdx: index('jobs_project_idx').on(table.projectId),
    statusCreatedIdx: index('jobs_status_created_idx').on(table.status, table.createdAt)
  })
);

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: usageEventTypeEnum('event_type').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt
  },
  (table) => ({
    userEventIdx: index('usage_events_user_event_created_idx').on(table.userId, table.eventType, table.createdAt)
  })
);

export const aiInsights = pgTable(
  'ai_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'set null' }),
    kind: aiInsightKindEnum('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    actionLabel: text('action_label'),
    actionUrl: text('action_url'),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    createdAt
  },
  (table) => ({
    userDismissedIdx: index('ai_insights_user_dismissed_created_idx').on(table.userId, table.dismissedAt, table.createdAt)
  })
);

export const schema = {
  users,
  projects,
  seoInputs,
  seoDiagnoses,
  seoObjectives,
  campaignProgress,
  tasks,
  integrations,
  oauthConnections,
  gscMetrics,
  ga4Metrics,
  technicalErrors,
  auditTasks,
  psiAudits,
  gscInspectionResults,
  apiKeys,
  jobs,
  usageEvents,
  aiInsights
};

export type DatabaseSchema = typeof schema;

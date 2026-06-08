"use client";

import Link from 'next/link';
import { ArrowRight, Clock3, ShieldCheck, Target } from 'lucide-react';
import { ConfidenceGauge } from '@/components/ui/confidence-gauge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { getAppCopy, type Locale } from '@/lib/i18n';
import type { DiagnosisDashboardData } from '@/types/diagnosis';
import type { TechnicalErrorRecord } from '@/types/wizard';
import { useGA4Metrics } from '../_hooks/useGA4Metrics';
import { useGSCKeywords } from '../_hooks/useGSCKeywords';
import { useKeywordOwning } from '../_hooks/useKeywordOwning';
import { useAIVisibilityMetrics } from '../_hooks/useAIVisibilityMetrics';
import { useTechnicalErrors } from '../_hooks/useTechnicalErrors';
import { AIOverviewSection, calculateAIVisibilityMetrics } from '../sections/AIOverviewSection';
import { BusinessImpactSection } from '../sections/BusinessImpactSection';
import { KeywordPositionSection } from '../sections/KeywordPositionSection';
import {
  TechnicalIssueSection,
  calculateTechnicalHealthScore
} from '../sections/TechnicalIssueSection';

const problemTypeLabels: Record<Locale, Record<string, string>> = {
  en: {
    technical_bottleneck: 'Technical Bottleneck',
    relevance_gap: 'Relevance & Traffic Gap',
    authority_deficit: 'Authority Deficit',
    conversion_pitfall: 'Conversion Pitfall',
    from_scratch: 'From Scratch',
    mixed: 'Mixed Issues'
  },
  id: {
    technical_bottleneck: 'Bottleneck Teknis',
    relevance_gap: 'Kesenjangan Relevansi & Traffic',
    authority_deficit: 'Defisit Authority',
    conversion_pitfall: 'Hambatan Konversi',
    from_scratch: 'Dari Nol',
    mixed: 'Masalah Campuran'
  }
};

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function formatProblemType(value: unknown, locale: Locale) {
  if (typeof value !== 'string' || !value) {
    return problemTypeLabels[locale].mixed;
  }

  return problemTypeLabels[locale][value] ?? value.replace(/_/g, ' ');
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

function Tag({
  label,
  value,
  tone = 'bg-primary-fixed text-on-primary-fixed-variant'
}: {
  label?: string;
  value: string;
  tone?: string;
}) {
  return (
    <span className={['inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', tone].join(' ')}>
      {label ? <span className="opacity-80">{label}</span> : null}
      {value}
    </span>
  );
}

export function DiagnosisDashboard({
  diagnosisId,
  diagnosis,
  projectId,
  projectName,
  locale,
  data
}: {
  diagnosisId: string;
  diagnosis: Record<string, unknown>;
  projectId: string;
  projectName: string;
  locale: Locale;
  data: DiagnosisDashboardData;
}) {
  const copy = getAppCopy(locale).diagnosis;
  const problemType = formatProblemType(diagnosis.primary_problem_type, locale);
  const severity = toText(diagnosis.severity, 'medium') as 'low' | 'medium' | 'high' | 'critical';
  const confidence = Number(diagnosis.confidence_score ?? 0) || 0;
  const summary = toText(
    diagnosis.diagnosis_summary,
    locale === 'id'
      ? 'Masalah utama terdeteksi dari sinyal teknis, keyword, dan bisnis.'
      : 'The main issue is detected from the technical, keyword, and business signals.'
  );
  const recommendedNextStep = toText(
    diagnosis.recommended_next_step,
    locale === 'id'
      ? 'Prioritaskan perbaikan teknis sebelum memperluas konten.'
      : 'Prioritize technical fixes before expanding content.'
  );
  const objectiveDirection = toText(
    diagnosis.objective_direction,
    locale === 'id'
      ? 'Gunakan diagnosis ini sebagai dasar objective yang terukur.'
      : 'Use this diagnosis as the basis for a measurable objective.'
  );
  const analyzedAt = formatDate(diagnosis.completed_at ?? diagnosis.created_at);
  const technicalErrors = useTechnicalErrors(projectId, data.technicalErrors);
  const gscKeywords = useGSCKeywords(data.keywordPositions);
  const aiVisibility = useAIVisibilityMetrics(data.aiVisibility.gemini, data.aiVisibility.chatgpt);
  const ga4 = useGA4Metrics(data.ga4);
  const keywordOwning = useKeywordOwning(data.keywordOwning);

  const technicalHealthScore = calculateTechnicalHealthScore(technicalErrors.errors);
  const aiScoreAggregate = calculateAIVisibilityMetrics(aiVisibility.gemini);
  const aiVisibilityScore = aiScoreAggregate.visibilityScore;

  return (
    <div className="relative overflow-hidden px-4 py-6 md:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(78,70,229,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(255,255,255,0))]"
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag value={problemType} />
                <SeverityBadge severity={severity} label={locale === 'id' ? `Tingkat: ${severity}` : `Severity: ${severity}`} />
                <Tag value={locale === 'id' ? 'Campaign ready' : 'Campaign ready'} tone="bg-emerald-50 text-emerald-700" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                  {locale === 'id' ? 'Diagnosis' : 'Diagnosis'}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                  {projectName}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">{summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {locale === 'id' ? 'Technical Health' : 'Technical Health'}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-on-surface">{technicalHealthScore}/100</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {technicalErrors.fixedCount}/{technicalErrors.errors.length} issues fixed
                  </p>
                </div>
                <div className="rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {locale === 'id' ? 'AI Visibility' : 'AI Visibility'}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-on-surface">{aiVisibilityScore}/100</p>
                  <p className="mt-1 text-xs text-on-surface-variant">Gemini visibility aggregate</p>
                </div>
                <div className="rounded-[24px] border border-outline-variant bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {locale === 'id' ? 'Confidence' : 'Confidence'}
                  </p>
                  <div className="mt-2">
                    <ConfidenceGauge value={confidence} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[28px] border border-outline-variant bg-white p-5 shadow-sm lg:min-w-[320px]">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Clock3 className="h-4 w-4 text-primary" />
                {locale === 'id' ? 'Analysis Snapshot' : 'Analysis Snapshot'}
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">
                {locale === 'id'
                  ? 'Gunakan diagnosis ini untuk memprioritaskan perbaikan yang paling berdampak.'
                  : 'Use this diagnosis to prioritize the highest-impact fixes first.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Tag value={formatDate(diagnosis.completed_at ?? diagnosis.created_at)} tone="bg-surface-container-low text-on-surface-variant" />
                <Tag value={`Diag ${diagnosisId.slice(0, 8)}`} tone="bg-surface-container-low text-on-surface-variant" />
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  {locale === 'id' ? 'Recommended next step' : 'Recommended next step'}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface">{recommendedNextStep}</p>
              </div>
              <Link
                href={`/projects/${projectId}/objective`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                {locale === 'id' ? 'Generate Objective dari rekomendasi ini' : 'Generate Objective from this recommendation'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <TechnicalIssueSection
            projectId={projectId}
            errors={technicalErrors.errors}
            healthScore={technicalHealthScore}
            loading={technicalErrors.loading}
            onToggleStatus={technicalErrors.updateStatus}
            onSelectError={() => undefined}
          />

          <KeywordPositionSection rows={gscKeywords} />

          <AIOverviewSection geminiRows={aiVisibility.gemini} chatgptRows={aiVisibility.chatgpt} />

          <BusinessImpactSection ga4={ga4} keywordOwning={keywordOwning} />
        </div>

        <div className="rounded-[28px] border border-indigo-200 bg-indigo-50 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
                {locale === 'id' ? 'Recommendation CTA' : 'Recommendation CTA'}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-on-surface">
                {toText(diagnosis.recommended_next_step, copy.failedTitle)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{objectiveDirection}</p>
            </div>
            <Link
              href={`/projects/${projectId}/objective`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
            >
              {locale === 'id' ? 'Generate Objective dari rekomendasi ini' : 'Generate Objective from this recommendation'}
              <Target className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <footer className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span>
                {locale === 'id' ? 'Project: ' : 'Project: '}
                <span className="font-semibold text-on-surface">{projectName}</span>
              </span>
              <span>
                {locale === 'id' ? 'Dianalisis: ' : 'Analyzed: '}
                <span className="font-semibold text-on-surface">{analyzedAt}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                {locale === 'id' ? 'Model: ' : 'Model: '}
                <span className="rounded bg-surface-container px-2 py-1 font-semibold text-on-surface">
                  {toText(diagnosis.model_used, 'n8n')}
                </span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {locale === 'id' ? 'System Status: Optimal' : 'System Status: Optimal'}
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

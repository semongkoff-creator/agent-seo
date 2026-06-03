"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Globe,
  HelpCircle,
  Save,
  Sparkles,
  TerminalSquare
} from 'lucide-react';
import {
  buildStepState,
  identifyStepConfigs,
  identifyStepOrder,
  parseTags,
  serializeStepState,
  type IdentifyStepNumber
} from './identify-wizard-data';

type IdentifyWizardProps = {
  projectId: string;
  projectName: string;
  projectUrl: string;
  currentStep: IdentifyStepNumber;
  initialDrafts: Record<string, unknown>;
};

type FieldState = Record<string, unknown>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeForKey(step: IdentifyStepNumber) {
  return `step-${step}`;
}

function optionHint(value: string) {
  const hints: Record<string, string> = {
    from_scratch: 'No live site yet, we will shorten the flow.',
    new: 'Live but still early, with thin SEO data.',
    existing: 'We can pull live signals from an active site.',
    weak: 'CTA is unclear or not compelling yet.',
    medium: 'CTA is usable but could be sharper.',
    strong: 'CTA is clear and benefit-driven.',
    yes: 'Confirmed.',
    no: 'Not present or not working.',
    unknown: 'Not sure yet.',
    increasing: 'Traffic is moving up.',
    decreasing: 'Traffic trend is down.',
    flat: 'Traffic is flat.'
  };

  return hints[value] ?? 'Select the best fit.';
}

function TagInput({
  values,
  onChange,
  placeholder
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  function commit() {
    const next = parseTags(value);
    if (next.length === 0) {
      setValue('');
      return;
    }
    onChange(Array.from(new Set([...values, ...next])));
    setValue('');
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-3">
      <div className="flex flex-wrap gap-2">
        {values.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(values.filter((item) => item !== tag))}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {tag}
            <span aria-hidden="true">x</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="min-h-11 flex-1 rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={commit}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">Press Enter or comma to add an item.</p>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-2xl border px-4 py-3 text-left text-sm transition-all',
              active
                ? 'border-primary bg-primary/10 text-on-surface shadow-sm'
                : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-low'
            )}
          >
            <span className="block font-semibold text-on-surface">{option.label}</span>
            <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{optionHint(option.value)}</span>
          </button>
        );
      })}
    </div>
  );
}

function BooleanField({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-white px-4 py-4">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          'inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors',
          value ? 'bg-primary' : 'bg-surface-container-high'
        )}
        aria-pressed={value}
      >
        <span className={cn('h-6 w-6 rounded-full bg-white shadow-sm transition-transform', value && 'translate-x-6')} />
      </button>
    </label>
  );
}

export function IdentifyWizard({
  projectId,
  projectName,
  projectUrl,
  currentStep,
  initialDrafts
}: IdentifyWizardProps) {
  const router = useRouter();
  const config = identifyStepConfigs[currentStep];
  const stepData = useMemo(() => buildStepState(currentStep, initialDrafts), [currentStep, initialDrafts]);
  const [formState, setFormState] = useState<FieldState>(() => stepData);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const hasMounted = useRef(false);
  const isFromScratch = String(initialDrafts.website_stage ?? stepData.website_stage ?? '') === 'from_scratch';
  const totalSteps = isFromScratch ? 2 : 6;

  useEffect(() => {
    setFormState(stepData);
  }, [stepData]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const persistDraft = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/identify/step/${currentStep}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          payload: serializeStepState(currentStep, formState)
        })
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to save draft');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }, [currentStep, formState, projectId]);

  useEffect(() => {
    if (!hasMounted.current) {
      return;
    }

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      void persistDraft();
    }, 1000);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [formState, persistDraft]);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await persistDraft();

      if (currentStep < totalSteps) {
        router.push(`/projects/${projectId}/identify/step/${currentStep + 1}`);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/identify/submit`, {
        method: 'POST'
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to submit identify flow');
      }

      setMessage('Analysis queued. Redirecting to diagnosis...');
      router.push(`/diagnosis/${body?.data?.diagnosisId ?? body?.data?.diagnosis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit identify flow');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAndExit() {
    await persistDraft();
    router.push('/dashboard');
  }

  const stepProgress = identifyStepOrder.filter((step) => step <= totalSteps);
  const currentIndex = stepProgress.indexOf(currentStep) + 1;

  const currentValues = formState;

  function updateField(name: string, value: unknown) {
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-24 lg:pb-0">
        <div className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Identify Problem</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
                Diagnose {projectName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant md:text-base">
                Step {currentIndex} of {totalSteps} - {config.title}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                We collect the site context first, then send the finished payload to n8n so diagnosis can run with
                enough signal to be useful.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-left text-sm shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Progress</p>
                <p className="mt-1 text-lg font-semibold text-on-surface">
                  {currentIndex} / {totalSteps}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <Save className="h-4 w-4" />
                Save & Exit
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Globe className="h-3.5 w-3.5" />
                {projectUrl}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                <Clock3 className="h-3.5 w-3.5" />
                Auto-save every second
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Draft saved to Supabase
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="hidden rounded-[28px] border border-outline-variant bg-surface-container-low p-4 shadow-sm xl:block">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Sparkles className="h-4 w-4 text-primary" />
              Step Rail
            </div>
            <div className="mt-4 space-y-2">
              {stepProgress.map((stepNumber) => {
                const stepMeta = identifyStepConfigs[stepNumber as IdentifyStepNumber];
                const active = stepNumber === currentStep;
                const completed = stepNumber < currentStep;
                return (
                  <div
                    key={stepNumber}
                    className={cn(
                      'rounded-2xl border px-3 py-3',
                      active
                        ? 'border-primary bg-primary/10'
                        : completed
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-outline-variant bg-white'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          active
                            ? 'bg-primary text-on-primary'
                            : completed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-surface-container-high text-on-surface-variant'
                        )}
                      >
                        {completed ? <Check className="h-4 w-4" /> : stepNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                          Step {stepNumber}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">{stepMeta.eyebrow}</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{stepMeta.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">{config.eyebrow}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-on-surface md:text-2xl">{config.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                  {config.description}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-outline-variant bg-white px-4 py-3 text-right text-sm md:block">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Progress</p>
                <p className="mt-1 text-lg font-semibold text-on-surface">
                  {currentIndex} / {totalSteps}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {config.fields.map((field) => {
                if (field.type === 'textarea') {
                  return (
                    <label key={field.name} className="md:col-span-2">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                        {field.label}
                      </span>
                      <textarea
                        rows={4}
                        value={String(currentValues[field.name] ?? '')}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-28 w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  );
                }

                if (field.type === 'number') {
                  return (
                    <label key={field.name} className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                        {field.label}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={String(currentValues[field.name] ?? '')}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  );
                }

                if (field.type === 'tags') {
                  return (
                    <div key={field.name} className="md:col-span-2">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                          {field.label}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {parseTags(currentValues[field.name]).length > 0
                            ? `${parseTags(currentValues[field.name]).length} items`
                            : '0 items'}
                        </span>
                      </div>
                      <TagInput
                        values={parseTags(currentValues[field.name])}
                        onChange={(next) => updateField(field.name, next)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                }

                if (field.type === 'boolean') {
                  return (
                    <BooleanField
                      key={field.name}
                      label={field.label}
                      value={Boolean(currentValues[field.name])}
                      onChange={(next) => updateField(field.name, next)}
                    />
                  );
                }

                if (field.type === 'tri-state') {
                  return (
                    <div key={field.name} className="md:col-span-2">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                        {field.label}
                      </div>
                      <SegmentedControl
                        value={String(currentValues[field.name] ?? 'unknown')}
                        options={field.options ?? []}
                        onChange={(next) => updateField(field.name, next)}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.name} className={field.type === 'radio' ? 'md:col-span-2' : ''}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      {field.label}
                    </div>
                    {field.type === 'radio' ? (
                      <SegmentedControl
                        value={String(currentValues[field.name] ?? '')}
                        options={field.options ?? []}
                        onChange={(next) => updateField(field.name, next)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(currentValues[field.name] ?? '')}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-12 w-full rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {error ? (
              <p className="mt-5 rounded-2xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <div className="mt-6 hidden items-center justify-between border-t border-outline-variant pt-5 lg:flex">
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <Save className="h-4 w-4" />
                Save & Exit
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => router.push(currentStep === 1 ? '/identify' : `/projects/${projectId}/identify/step/${currentStep - 1}`)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving || submitting}
                  onClick={handleContinue}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {currentStep === totalSteps ? 'Submit & Analyze' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <aside className="hidden rounded-[28px] border border-outline-variant bg-surface-container-low p-5 shadow-sm xl:block">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <HelpCircle className="h-4 w-4 text-primary" />
              Why this matters
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-on-surface-variant">
              <p>
                Identify is the intake layer for diagnosis. The more complete the context, the better the problem
                classification and the handoff to n8n.
              </p>

              <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  Flow snapshot
                </p>
                <ol className="mt-3 space-y-2">
                  <li>1. Draft autosaves to Supabase</li>
                  <li>2. Final submit creates diagnosis + job</li>
                  <li>3. n8n runs in the background</li>
                  <li>4. Diagnosis updates in realtime</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-on-surface">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <TerminalSquare className="h-4 w-4" />
                  Current project
                </div>
                <p className="mt-2 text-sm font-medium text-on-surface">{projectName}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{projectUrl}</p>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Draft state</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Auto-save runs every second, so you can move between steps without losing progress.
                </p>
              </div>
            </div>

          </aside>
        </div>

        <details className="rounded-[28px] border border-outline-variant bg-surface-container-low p-4 shadow-sm xl:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-on-surface">Help</summary>
          <div className="mt-3 space-y-3 text-sm leading-6 text-on-surface-variant">
            <p>The wizard auto-saves every second, so you can navigate across steps without losing data.</p>
            <p>On from-scratch projects, the flow shortens to the first two steps.</p>
          </div>
        </details>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-outline-variant bg-white/92 px-4 py-4 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => router.push(currentStep === 1 ? '/identify' : `/projects/${projectId}/identify/step/${currentStep - 1}`)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={saving || submitting}
                onClick={handleContinue}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {currentStep === totalSteps ? 'Submit' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="text-center text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              Save & Exit
            </button>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="rounded-[28px] border border-outline-variant bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Sparkles className="h-4 w-4 text-primary" />
              Step progress
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {stepProgress.map((stepNumber) => {
                const active = stepNumber === currentStep;
                const completed = stepNumber < currentStep;
                return (
                  <div
                    key={normalizeForKey(stepNumber)}
                    className={cn(
                      'min-w-24 rounded-full px-3 py-2 text-center text-xs font-semibold',
                      active
                        ? 'bg-primary text-on-primary'
                        : completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-on-surface-variant'
                    )}
                  >
                    {stepNumber}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import {
  AUDIENCE_OPTIONS,
  formatBusinessGoalLabel,
  INDUSTRY_OPTIONS,
  MAIN_BUSINESS_GOAL_OPTIONS,
  PRODUCT_OPTIONS,
  type AudienceValue,
  type IndustryValue,
  type MainBusinessGoalValue
} from '@/types/wizard';

type ProjectFormState = {
  name: string;
  websiteUrl: string;
  industry: IndustryValue | '';
  industryOther: string;
  targetLocation: string;
  targetAudience: AudienceValue | '';
  targetAudienceOther: string;
  mainProductOrService: string;
  mainProductOrServiceOther: string;
  websiteStage: 'new' | 'existing';
  mainBusinessGoal: MainBusinessGoalValue;
};

const initialState: ProjectFormState = {
  name: '',
  websiteUrl: '',
  industry: '',
  industryOther: '',
  targetLocation: 'Indonesia',
  targetAudience: '',
  targetAudienceOther: '',
  mainProductOrService: '',
  mainProductOrServiceOther: '',
  websiteStage: 'existing',
  mainBusinessGoal: 'leads'
};

function getSelectedOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getProductOptions(industry: ProjectFormState['industry']) {
  if (!industry) {
    return [];
  }

  if (industry === 'other') {
    return PRODUCT_OPTIONS.default;
  }

  return PRODUCT_OPTIONS[industry] ?? PRODUCT_OPTIONS.default;
}

export function CreateProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleIndustryChange(nextIndustry: ProjectFormState['industry']) {
    setForm((current) => ({
      ...current,
      industry: nextIndustry,
      industryOther: nextIndustry === 'other' ? current.industryOther : '',
      mainProductOrService: '',
      mainProductOrServiceOther: ''
    }));
  }

  function handleAudienceChange(nextAudience: ProjectFormState['targetAudience']) {
    setForm((current) => ({
      ...current,
      targetAudience: nextAudience,
      targetAudienceOther: nextAudience === 'other' ? current.targetAudienceOther : ''
    }));
  }

  function handleMainProductChange(nextValue: string) {
    setForm((current) => ({
      ...current,
      mainProductOrService: nextValue,
      mainProductOrServiceOther: nextValue === 'other' ? current.mainProductOrServiceOther : ''
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          websiteUrl: form.websiteUrl,
          industry:
            form.industry === 'other'
              ? form.industryOther.trim() || undefined
              : form.industry
                ? getSelectedOptionLabel(INDUSTRY_OPTIONS, form.industry)
                : undefined,
          targetLocation: form.targetLocation.trim() || undefined,
          targetAudience:
            form.targetAudience === 'other'
              ? form.targetAudienceOther.trim() || undefined
              : form.targetAudience
                ? getSelectedOptionLabel(AUDIENCE_OPTIONS, form.targetAudience)
                : undefined,
          mainProductOrService:
            form.mainProductOrService === 'other'
              ? form.mainProductOrServiceOther.trim() || undefined
              : form.mainProductOrService
                ? getSelectedOptionLabel(getProductOptions(form.industry), form.mainProductOrService)
                : undefined,
          websiteStage: form.websiteStage,
          mainBusinessGoal: form.mainBusinessGoal
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Failed to create project');
      }

      const projectId = body?.data?.id as string | undefined;
      setMessage('Project created. Opening Identify now...');
      setForm(initialState);

      if (projectId) {
        router.push(`/projects/${projectId}/identify/step/1`);
        router.refresh();
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6"
    >
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold text-on-surface">Project details</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        Add the project details here, then we&apos;ll take you straight into the Identify wizard.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Project Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Kaitech Studio"
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Website URL</span>
          <input
            required
            type="url"
            value={form.websiteUrl}
            onChange={(event) => updateField('websiteUrl', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="https://yourdomain.com"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Industry</span>
          <select
            value={form.industry}
            onChange={(event) => handleIndustryChange(event.target.value as ProjectFormState['industry'])}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.industry === 'other' ? (
            <input
              required
              value={form.industryOther}
              onChange={(event) => updateField('industryOther', event.target.value)}
              className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Specify industry"
            />
          ) : null}
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Target Location
          </span>
          <input
            value={form.targetLocation}
            onChange={(event) => updateField('targetLocation', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Indonesia"
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Target Audience
          </span>
          <select
            value={form.targetAudience}
            onChange={(event) => handleAudienceChange(event.target.value as ProjectFormState['targetAudience'])}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select audience</option>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.targetAudience === 'other' ? (
            <input
              required
              value={form.targetAudienceOther}
              onChange={(event) => updateField('targetAudienceOther', event.target.value)}
              className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Specify audience"
            />
          ) : null}
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Main Product or Service
          </span>
          <select
            value={form.mainProductOrService}
            onChange={(event) => handleMainProductChange(event.target.value)}
            disabled={!form.industry}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">
              {form.industry ? 'Select product or service' : 'Select industry first'}
            </option>
            {getProductOptions(form.industry).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.mainProductOrService === 'other' ? (
            <input
              required
              value={form.mainProductOrServiceOther}
              onChange={(event) => updateField('mainProductOrServiceOther', event.target.value)}
              className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Specify product or service"
            />
          ) : null}
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Website Stage</span>
          <select
            value={form.websiteStage}
            onChange={(event) => updateField('websiteStage', event.target.value as ProjectFormState['websiteStage'])}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="new">New Website</option>
            <option value="existing">Existing Website</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Main Goal</span>
          <select
            value={form.mainBusinessGoal}
            onChange={(event) =>
              updateField('mainBusinessGoal', event.target.value as ProjectFormState['mainBusinessGoal'])
            }
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {MAIN_BUSINESS_GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
          Main goal preview: <span className="font-semibold text-on-surface">{formatBusinessGoalLabel(form.mainBusinessGoal)}</span>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-on-surface-variant">
          The project is saved to Supabase, then we&apos;ll open the Identify workflow automatically.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Project
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, Plus } from 'lucide-react';

type ProjectFormState = {
  name: string;
  websiteUrl: string;
  industry: string;
  targetLocation: string;
  targetAudience: string;
  mainProductOrService: string;
  websiteStage: 'from_scratch' | 'new' | 'existing';
  mainBusinessGoal: 'traffic' | 'leads' | 'sales' | 'awareness' | 'local_visibility';
};

const initialState: ProjectFormState = {
  name: '',
  websiteUrl: '',
  industry: '',
  targetLocation: '',
  targetAudience: '',
  mainProductOrService: '',
  websiteStage: 'existing',
  mainBusinessGoal: 'leads'
};

export function CreateProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
          industry: form.industry || undefined,
          targetLocation: form.targetLocation || undefined,
          targetAudience: form.targetAudience || undefined,
          mainProductOrService: form.mainProductOrService || undefined,
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
        <h2 className="text-lg font-semibold text-on-surface">Create New Project</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        Add a project here, then we will take you straight into the Identify wizard.
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
            placeholder="https://example.com"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Industry</span>
          <input
            value={form.industry}
            onChange={(event) => updateField('industry', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="SaaS / Software"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Target Location
          </span>
          <input
            value={form.targetLocation}
            onChange={(event) => updateField('targetLocation', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Jakarta, Indonesia"
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Target Audience
          </span>
          <input
            value={form.targetAudience}
            onChange={(event) => updateField('targetAudience', event.target.value)}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Founders, marketers, and operators who need better SEO visibility."
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Main Product or Service
          </span>
          <textarea
            rows={3}
            value={form.mainProductOrService}
            onChange={(event) => updateField('mainProductOrService', event.target.value)}
            className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Managed SEO audits, content strategy, and technical fixes"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Website Stage</span>
          <select
            value={form.websiteStage}
            onChange={(event) => updateField('websiteStage', event.target.value as ProjectFormState['websiteStage'])}
            className="min-h-12 rounded-2xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="from_scratch">From Scratch</option>
            <option value="new">New</option>
            <option value="existing">Existing</option>
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
            <option value="traffic">Traffic</option>
            <option value="leads">Leads</option>
            <option value="sales">Sales</option>
            <option value="awareness">Awareness</option>
            <option value="local_visibility">Local Visibility</option>
          </select>
        </label>
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
          The project is created in Supabase, then we’ll open the Identify workflow automatically.
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

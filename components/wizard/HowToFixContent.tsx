import { getHowToFixGuide } from '@/lib/dataforseo/how-to-fix';

export function HowToFixContent({ errorType }: { errorType: string }) {
  const guide = getHowToFixGuide(errorType);

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">How to Fix</p>
        <h4 className="mt-1 text-base font-semibold text-on-surface">{errorType}</h4>
      </div>
      <p className="text-sm leading-6 text-on-surface-variant">{guide.summary}</p>

      <div className="rounded-2xl bg-white p-4">
        <p className="text-sm font-semibold text-on-surface">Why it matters</p>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{guide.whyItMatters}</p>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <p className="text-sm font-semibold text-on-surface">Fix steps</p>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
          {guide.steps.map((step, index) => (
            <li key={`${errorType}-${index}`} className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

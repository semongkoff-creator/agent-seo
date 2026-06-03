type PageHeroProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PageHero({ title, description, eyebrow = 'SEO Agent' }: PageHeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-on-surface md:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant md:text-base">{description}</p>
      </div>
    </section>
  );
}

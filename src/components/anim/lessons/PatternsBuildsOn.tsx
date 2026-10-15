/**
 * Static "builds on" view for a pattern lesson: the earlier lessons it combines, each with the one job it does here.
 * No hooks and no client directive. Plain links, so it works without JavaScript.
 */
export interface BuildsOnPart {
  /** Lesson number as written in the syllabus, such as "5.4". */
  n: string;
  title: string;
  href: string;
  /** What this lesson contributes to the pattern. */
  job: string;
}

export default function PatternsBuildsOn({ pattern, parts }: { pattern: string; parts: BuildsOnPart[] }) {
  return (
    <figure className="not-prose my-8 rounded-xl border border-line bg-surface/40 p-4" aria-label={`${pattern} builds on these lessons`}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-accent px-3 py-1 font-medium text-accent">{pattern}</span>
        <span className="text-muted">is built from these earlier lessons</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {parts.map((p) => (
          <li key={p.href}>
            <a href={p.href} className="flex h-full gap-3 rounded-lg border border-line bg-bg p-3 no-underline transition-colors hover:border-accent/60">
              <span className="mt-0.5 shrink-0 font-mono text-[13px] tabular-nums text-accent">{p.n}</span>
              <span className="min-w-0 text-[0.95rem] leading-snug">
                <span className="block font-medium text-fg">{p.title}</span>
                <span className="block text-muted">{p.job}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </figure>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { DIFF, PLANTED, score } from './Ai15AgentDiffLogic';

/** Review drill. Click the lines you would push back on, then check. Illustrative diff. */
export default function Ai15AgentDiffReview() {
  const [flagged, setFlagged] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const result = score(flagged);

  const toggle = (i: number) => {
    if (checked) return;
    setFlagged((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]));
  };
  const reset = () => {
    setFlagged([]);
    setChecked(false);
  };

  return (
    <CacheWidgetFrame title="Review this agent diff" hint="Illustrative diff: click lines you would push back on.">
      <p className="mb-3 text-sm">
        Task given to the agent: "add a CSV export for invoices". It reports "done, all tests pass". Five lines below deserve a question. Click the ones you would raise, then check.
      </p>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface font-mono text-[13px] leading-relaxed">
        {DIFF.map((l, i) => {
          if (l.kind === 'file') {
            return (
              <div key={i} className="border-b border-line bg-bg px-3 py-1 text-muted">
                {l.text}
              </div>
            );
          }
          if (l.kind === 'del') {
            return (
              <div key={i} className="whitespace-pre px-3 py-1" style={{ background: 'color-mix(in srgb, var(--bad) 10%, transparent)' }}>
                {l.text}
              </div>
            );
          }
          const on = flagged.includes(i);
          const planted = PLANTED.includes(i);
          let ring = 'transparent';
          if (checked && planted) ring = on ? 'var(--ok)' : 'var(--bad)';
          else if (checked && on) ring = 'var(--warn)';
          else if (on) ring = 'var(--accent)';
          const tint = l.kind === 'add' ? 'color-mix(in srgb, var(--ok) 10%, transparent)' : 'color-mix(in srgb, var(--bad) 10%, transparent)';
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              disabled={checked}
              onClick={() => toggle(i)}
              className="block w-full whitespace-pre px-3 py-1 text-left"
              style={{ background: tint, boxShadow: `inset 3px 0 0 ${ring}`, outline: 'none' }}
            >
              {l.text}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {!checked ? (
          <button type="button" onClick={() => setChecked(true)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white">
            Check my review
          </button>
        ) : (
          <button type="button" onClick={reset} className="rounded-md border border-line px-3 py-1.5 text-xs">
            Try again
          </button>
        )}
        <span className="text-muted" aria-live="polite">
          {checked ? `You caught ${result.caught.length} of ${PLANTED.length}. False alarms: ${result.falseAlarms.length}.` : `${flagged.length} line${flagged.length === 1 ? '' : 's'} flagged`}
        </span>
      </div>
      {checked && (
        <ul className="mt-3 space-y-2 text-sm">
          {PLANTED.map((i) => {
            const f = DIFF[i].flag!;
            const hit = result.caught.includes(i);
            return (
              <li key={i} className="rounded-lg border p-3" style={{ borderColor: hit ? 'var(--ok)' : 'var(--bad)' }}>
                <p className="font-medium">
                  {hit ? 'Caught: ' : 'Missed: '}
                  {f.title}
                </p>
                <p className="mt-1 text-muted">{f.why}</p>
              </li>
            );
          })}
          {result.falseAlarms.length > 0 && (
            <li className="rounded-lg border p-3 text-muted" style={{ borderColor: 'var(--warn)' }}>
              You also flagged lines that are fine here (marked in amber). A false alarm costs a question, not a bug. Keep the list short, or you will stop reading your own flags.
            </li>
          )}
        </ul>
      )}
    </CacheWidgetFrame>
  );
}

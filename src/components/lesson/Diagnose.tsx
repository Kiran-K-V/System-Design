import { useMemo, useState } from 'react';
import { seededOrder } from '../../lib/mastery';

interface Step {
  /** Extra facts that appear only for this step (a second card in the same puzzle). */
  context?: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

interface Props {
  id: string;
  title: string;
  scenario: string;
  /** Dashboard lines shown in a monospace block. */
  facts?: string[];
  steps: Step[];
}

/** Multi-step diagnosis: read the evidence, pick the cause, then pick the fix. Options are shuffled per attempt. */
export default function Diagnose({ id, title, scenario, facts, steps }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => steps.map(() => null));
  const orders = useMemo(() => steps.map((s, i) => seededOrder(s.options.length, `${id}:${i}:${attempt}`)), [id, steps, attempt]);

  const current = picks.findIndex((p) => p === null);
  const finished = current === -1;
  const firstTry = picks.filter((p, i) => p === steps[i].answer).length;

  return (
    <div className="not-prose my-6 rounded-xl border border-line p-4">
      <p className="font-mono text-[12px] uppercase tracking-wide text-muted">Prove it · {title}</p>
      <p className="mt-2 font-medium">{scenario}</p>
      {facts && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">{facts.join('\n')}</pre>
      )}
      <div className="mt-4 space-y-5">
        {steps.map((step, si) => {
          if (si > (finished ? steps.length : current)) return null;
          const pick = picks[si];
          return (
            <div key={si}>
              {step.context && <p className="mb-2 rounded-lg bg-surface p-3 text-sm">{step.context}</p>}
              <p className="text-sm font-medium">
                <span className="mr-2 text-muted">{si + 1}/{steps.length}</span>
                {step.prompt}
              </p>
              <ul className="mt-2 space-y-2">
                {orders[si].map((orig) => {
                  const state = pick === null ? 'idle' : orig === step.answer ? 'right' : orig === pick ? 'wrong' : 'dim';
                  return (
                    <li key={orig}>
                      <button
                        type="button"
                        disabled={pick !== null}
                        onClick={() => setPicks((p) => p.map((v, i) => (i === si ? orig : v)))}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          state === 'idle'
                            ? 'border-line hover:bg-surface'
                            : state === 'right'
                              ? 'border-ok bg-ok/10'
                              : state === 'wrong'
                                ? 'border-bad bg-bad/10'
                                : 'border-line opacity-50'
                        }`}
                      >
                        {step.options[orig]}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {pick !== null && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  <span className={pick === step.answer ? 'font-semibold text-ok' : 'font-semibold text-bad'}>
                    {pick === step.answer ? 'Yes. ' : 'Not this one. '}
                  </span>
                  {step.explain}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {finished && (
        <div className="mt-5 flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
          <span>
            {firstTry === steps.length ? (
              <strong className="text-ok">Clean solve.</strong>
            ) : (
              <>
                <strong>{firstTry}</strong> of {steps.length} right.
              </>
            )}
          </span>
          {firstTry < steps.length && (
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setPicks(steps.map(() => null));
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

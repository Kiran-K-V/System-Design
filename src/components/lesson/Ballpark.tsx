import { useState } from 'react';

interface Step {
  prompt: string;
  unit?: string;
  answer: number;
  /** Pass when guess and answer differ by less than this factor. Default 3. Use 1.1 for small exact integers. */
  within?: number;
  /** Final steps can use a log slider over [low, high] instead of typing. */
  slider?: [number, number];
  explain: string;
}

interface Props {
  title: string;
  scenario: string;
  facts?: string[];
  steps: Step[];
}

/** "1,200", "1.2k", "3M", "2e3" -> number. Returns NaN when it cannot read the text. */
export function parseNumber(text: string): number {
  const m = text.trim().toLowerCase().replace(/[,\s_]/g, '').match(/^(\d*\.?\d+(?:e[+-]?\d+)?)([kmbt]?)$/);
  if (!m) return NaN;
  return parseFloat(m[1]) * ({ '': 1, k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[m[2] as '' | 'k' | 'm' | 'b' | 't'] ?? 1);
}

const fmt = (n: number) =>
  n >= 10 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 100) / 100);

const SLIDER_STEPS = 1000;
const fromSlider = (t: number, [lo, hi]: [number, number]) => lo * Math.pow(hi / lo, t / SLIDER_STEPS);

/** Fermi estimate chain. Each step is graded by ratio, so the exact digits do not matter. */
export default function Ballpark({ title, scenario, facts, steps }: Props) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [slide, setSlide] = useState(SLIDER_STEPS / 2);
  const [results, setResults] = useState<{ guess: number; ok: boolean }[]>([]);

  const step = steps[index];
  const finished = index >= steps.length;
  const guess = step?.slider ? fromSlider(slide, step.slider) : parseNumber(text);
  const bad = !step?.slider && Number.isNaN(guess);

  const check = () => {
    if (bad || guess <= 0) return;
    const ratio = Math.max(guess / step.answer, step.answer / guess);
    setResults((r) => [...r, { guess, ok: ratio <= (step.within ?? 3) }]);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setText('');
    setSlide(SLIDER_STEPS / 2);
  };

  const reset = () => {
    setIndex(0);
    setResults([]);
    setText('');
    setSlide(SLIDER_STEPS / 2);
  };

  const right = results.filter((r) => r.ok).length;

  return (
    <div className="not-prose my-6 rounded-xl border border-line p-4">
      <p className="font-mono text-[12px] uppercase tracking-wide text-muted">Prove it · {title}</p>
      <p className="mt-2 font-medium">{scenario}</p>
      {facts && <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">{facts.join('\n')}</pre>}

      <div className="mt-4 space-y-5">
        {steps.slice(0, Math.min(index + 1, steps.length)).map((s, si) => {
          const r = results[si];
          const active = si === index && !finished;
          return (
            <div key={si}>
              <p className="text-sm font-medium">
                <span className="mr-2 text-muted">{si + 1}/{steps.length}</span>
                {s.prompt}
              </p>
              {active && !r && (
                <form
                  className="mt-2 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    check();
                  }}
                >
                  {s.slider ? (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={SLIDER_STEPS}
                        value={slide}
                        onChange={(e) => setSlide(+e.target.value)}
                        aria-label="Your estimate, log scale"
                        className="min-w-[10rem] flex-1 accent-[var(--accent)]"
                      />
                      <span className="w-24 text-right font-mono text-sm tabular-nums">{fmt(guess)}</span>
                    </>
                  ) : (
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      inputMode="decimal"
                      placeholder="e.g. 1,200 or 1.2k"
                      aria-label="Your answer"
                      className="w-44 rounded-md border border-line bg-bg px-2 py-1 font-mono text-sm"
                    />
                  )}
                  {s.unit && <span className="text-sm text-muted">{s.unit}</span>}
                  <button type="submit" disabled={bad || !text.trim() && !s.slider} className="rounded-md border border-line px-3 py-1 text-sm hover:bg-surface disabled:opacity-50">
                    Check
                  </button>
                </form>
              )}
              {r && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  <span className={r.ok ? 'font-semibold text-ok' : 'font-semibold text-bad'}>
                    {r.ok ? 'Close enough. ' : 'Off. '}
                  </span>
                  You said <span className="font-mono">{fmt(r.guess)}</span>; answer is about{' '}
                  <span className="font-mono">{fmt(s.answer)}</span>. {s.explain}
                </p>
              )}
              {r && si === index && !finished && (
                <button type="button" onClick={next} className="mt-2 text-sm text-accent hover:underline">
                  {index === steps.length - 1 ? 'See result' : 'Next step'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {finished && (
        <div className="mt-5 flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
          <span>
            {right === steps.length ? <strong className="text-ok">Clean solve.</strong> : <><strong>{right}</strong> of {steps.length} within range.</>}
          </span>
          <button type="button" className="text-accent hover:underline" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

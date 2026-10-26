import { useEffect, useState } from 'react';
import { loadLabs, saveLab, verifyCode, type Lab, type LabProgress } from '../../lib/labs';
import { recordActivity } from '../../lib/mastery';
import { celebrate } from '../../lib/confetti';

type Props = Pick<Lab, 'id' | 'dir' | 'predict' | 'steps' | 'rules' | 'hints' | 'reflect'> & { codespaceUrl: string };

/** Interactive part of a lab page: predict, steps, hints, completion code, reflection. Progress stays in this browser. */
export default function LabRunner({ id, dir, predict, steps, rules, hints, reflect, codespaceUrl }: Props) {
  const [p, setP] = useState<LabProgress>({});
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState<'idle' | 'bad'>('idle');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setP(loadLabs()[id] ?? {});
    sync();
    addEventListener('sd-labs', sync);
    return () => removeEventListener('sd-labs', sync);
  }, [id]);

  const predicted = p.predicted !== undefined;
  const hintsShown = p.hints ?? 0;

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const submit = async () => {
    if (await verifyCode(id, code)) {
      saveLab(id, { done: Date.now() });
      recordActivity();
      celebrate();
    } else {
      setCodeState('bad');
    }
  };

  const section = 'mt-12';
  const h2 = 'text-xl font-semibold tracking-tight';

  return (
    <div className="not-prose" data-pagefind-ignore>
      <section className={section} aria-labelledby="predict">
        <h2 id="predict" className={h2}>1. Predict first</h2>
        <p className="mt-2 text-sm text-muted">Commit to an answer before you run anything. The lab then shows if you were right.</p>
        <div className="mt-4 rounded-xl border border-line p-4">
          <p className="font-medium">{predict.question}</p>
          <ul className="mt-3 space-y-2">
            {predict.options.map((o, i) => {
              const chosen = p.predicted === i;
              const right = i === predict.answer;
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={predicted}
                    onClick={() => saveLab(id, { predicted: i })}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      !predicted
                        ? 'border-line hover:border-fg/30'
                        : right
                          ? 'border-ok text-ok'
                          : chosen
                            ? 'border-bad text-bad'
                            : 'border-line text-muted'
                    }`}
                  >
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
          {predicted && <p className="mt-3 text-sm leading-relaxed">{predict.explain} Now run the lab and see it.</p>}
        </div>
      </section>

      <section className={section} aria-labelledby="run">
        <h2 id="run" className={h2}>2. Run it</h2>
        <p className="mt-2 text-sm text-muted">
          Needs Docker with about 2 CPU cores and 4 GB RAM. No Docker?{' '}
          <a href={codespaceUrl} className="font-medium text-accent hover:underline" target="_blank" rel="noopener">
            Open in GitHub Codespaces
          </a>{' '}
          (free tier is enough). First, go to the lab folder: <code className="font-mono text-[13px]">cd labs/{dir}</code>
        </p>
        <ol className="mt-5 space-y-5">
          {steps.map((s, i) => {
            const isFile = !s.cmd.startsWith('./');
            return (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--body)]">{s.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-surface px-3 py-2 font-mono text-[13px]">
                      {isFile ? `edit ${s.cmd}` : `$ ${s.cmd}`}
                    </code>
                    {!isFile && (
                      <button type="button" onClick={() => copy(s.cmd, i)} className="press shrink-0 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-fg">
                        {copied === i ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={section} aria-labelledby="rules">
        <h2 id="rules" className={h2}>3. What the check tests</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-muted" aria-hidden="true">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={section} aria-labelledby="hints">
        <h2 id="hints" className={h2}>Stuck? Hints</h2>
        <p className="mt-2 text-sm text-muted">One at a time. Each gives away a little more. The same hints come from <code className="font-mono text-[13px]">./lab hint</code>.</p>
        <ol className="mt-4 space-y-3">
          {hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="rounded-lg bg-surface px-4 py-3 text-sm leading-relaxed">
              <span className="mr-2 font-mono text-[12px] text-muted">
                {i + 1}/{hints.length}
              </span>
              {h}
            </li>
          ))}
        </ol>
        {hintsShown < hints.length && (
          <button type="button" onClick={() => saveLab(id, { hints: hintsShown + 1 })} className="press mt-3 rounded-md border border-line px-3 py-1.5 text-sm hover:border-fg/30">
            {hintsShown === 0 ? 'Show a hint' : 'Next hint'}
          </button>
        )}
      </section>

      <section className={section} aria-labelledby="done">
        <h2 id="done" className={h2}>4. Prove it</h2>
        {p.done ? (
          <p className="mt-4 rounded-lg border border-ok px-4 py-3 text-sm font-medium text-ok">
            ✓ Passed on {new Date(p.done).toLocaleDateString()}.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              <code className="font-mono text-[13px]">./lab check</code> prints a code when all rules pass. Paste it here.
            </p>
            <form
              className="mt-4 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeState('idle');
                }}
                placeholder={`UPT-${id}-XXXXXXXXXX`}
                aria-label="Completion code"
                aria-invalid={codeState === 'bad'}
                className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 font-mono text-sm uppercase"
              />
              <button type="submit" className="press rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent">
                Submit
              </button>
            </form>
            {codeState === 'bad' && <p className="mt-2 text-sm text-bad">That code is not valid for this lab. Copy the whole line from ./lab check.</p>}
          </>
        )}
      </section>

      <section className={section} aria-labelledby="reflect">
        <h2 id="reflect" className={h2}>5. Reflect</h2>
        <p className="mt-2 text-sm text-muted">Write one or two lines each. Saved in this browser.</p>
        <div className="mt-4 space-y-5">
          {reflect.map((q, i) => (
            <label key={i} className="block">
              <span className="text-sm font-medium">{q}</span>
              <textarea
                rows={2}
                defaultValue={p.reflect?.[i] ?? ''}
                key={`${i}-${p.reflect?.[i] !== undefined}`}
                onBlur={(e) => saveLab(id, { reflect: { ...p.reflect, [i]: e.target.value } })}
                className="mt-2 block w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

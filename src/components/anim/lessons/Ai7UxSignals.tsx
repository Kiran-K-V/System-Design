import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { APPROVE_RATE, LINES, QUESTIONS, RISKY_STEPS, STEPS_IN_RUN, fatigue, summary, type Signal } from './Ai7UxLogic';

const SIGNALS: { id: Signal; label: string }[] = [
  { id: 'plan', label: 'Plan up front' },
  { id: 'steps', label: 'Step stream' },
  { id: 'cost', label: 'Cost and time so far' },
  { id: 'undo', label: 'Undo bar' },
  { id: 'approve', label: 'Approve risky steps' },
];

const STEP_NAMES = ['Read repo', 'Read tests', 'Edit limiter.py', 'Edit config.py', 'Run tests', 'Fix import', 'Run tests', 'Edit README', 'Delete old.py', 'Run linter', 'Push branch', 'Open PR'];
const RISKY = new Set([2, 8, 10]);

export default function Ai7UxSignals() {
  const [on, setOn] = useState<Signal[]>(['steps']);
  const [prompts, setPrompts] = useState(12);
  const toggle = (s: Signal) => setOn((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]));
  const sum = summary(on);
  const f = fatigue(prompts);
  const has = (s: Signal) => on.includes(s);

  return (
    <CacheWidgetFrame title="What does the UI show during a run?" hint={`Illustrative run: ${STEPS_IN_RUN} steps, ${RISKY_STEPS} risky.`}>
      <div className="mb-4 flex flex-wrap gap-2">
        {SIGNALS.map((s) => (
          <label key={s.id} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] ${has(s.id) ? 'border-accent bg-accent-soft' : 'border-line'}`}>
            <input type="checkbox" checked={has(s.id)} onChange={() => toggle(s.id)} className="accent-[var(--accent)]" />
            {s.label} <span className="font-mono text-muted">+{LINES[s.id]}</span>
          </label>
        ))}
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed">
          <p className="text-muted">Agent: add rate limiting</p>
          {has('plan') && <p className="mt-1">Plan: 1 read code, 2 edit limiter, 3 run tests, 4 clean up, 5 open PR</p>}
          {has('cost') && <p className="mt-1 text-muted">elapsed and spend so far: shown</p>}
          {has('steps') ? (
            <ul className="mt-1">
              {STEP_NAMES.map((n, k) => (
                <li key={n + k}>
                  {k + 1}. {n}
                  {has('approve') && RISKY.has(k) ? <span style={{ color: 'var(--warn)' }}> [approve?]</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">Working...</p>
          )}
          {!has('steps') && has('approve') && <p className="mt-1" style={{ color: 'var(--warn)' }}>{RISKY_STEPS} approval prompts appear with no context</p>}
          {has('undo') && <p className="mt-1 text-muted">[ Undo to before this run ]</p>}
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Questions the user can answer</p>
          <ul className="mt-2 space-y-1">
            {QUESTIONS.map((q) => {
              const yes = sum.answered.includes(q.id);
              return (
                <li key={q.id} style={{ color: yes ? 'var(--ok)' : 'var(--muted)' }}>
                  {yes ? 'Yes' : 'No'}: {q.label}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 font-mono text-[13px]">
            answered {sum.answered.length} of {QUESTIONS.length} · screen lines {sum.lines}
          </p>
          <p className="mt-1 text-muted">More signals answer more questions and add more lines to read. Counts come from this made-up run.</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-line p-3 text-sm">
        <label htmlFor="ai7-prompts" className="flex justify-between text-xs text-muted">
          <span>Approval prompts in one run</span>
          <span className="tabular-nums text-fg">{prompts}</span>
        </label>
        <input id="ai7-prompts" type="range" min={0} max={60} step={1} value={prompts} onChange={(e) => setPrompts(+e.target.value)} className="w-full accent-[var(--accent)]" />
        <p className="mt-2 font-mono text-[13px]">
          expected rejections = {prompts} x (1 - {APPROVE_RATE}) = <span className="font-semibold">{f.rejections.toFixed(2)}</span>
        </p>
        <p className="mt-1 text-muted">
          At a 97% approval rate, about {Math.round(f.perRejection)} prompts pass for each rejection (1 / 0.03). Applying Anthropic's Claude Code rate to this run is an assumption.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}

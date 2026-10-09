import { useState } from 'react';

const STEPS = ['Requirements', 'Core entities', 'API or interface', 'Data flow (optional)', 'High-level design', 'Deep dives', 'Intro and wrap-up'];
const COLORS = ['var(--accent)', 'var(--purple)', 'var(--ok)', 'var(--muted)', 'var(--warn)', 'var(--bad)', 'var(--node-stroke)'];
const TOTAL = 45;

const PRESETS: Record<string, number[]> = {
  'Typical split': [5, 2, 5, 3, 12, 12, 6],
  'Skip data flow': [5, 2, 5, 0, 13, 14, 6],
  'Over-engineered HLD': [3, 1, 3, 0, 30, 3, 5],
};

export default function TimeBudget() {
  const [m, setM] = useState<number[]>(PRESETS['Typical split']);
  const sum = m.reduce((a, b) => a + b, 0);
  const left = TOTAL - sum;
  const set = (i: number, d: number) => setM((p) => p.map((v, k) => (k === i ? Math.max(0, v + d) : v)));
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface/40">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="mr-auto text-[15px] font-semibold">A 45-minute budget (approximate, varies)</span>
        {Object.keys(PRESETS).map((k) => (
          <button key={k} type="button" onClick={() => setM(PRESETS[k])} className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:border-accent/50 hover:text-fg">
            {k}
          </button>
        ))}
      </div>
      <div className="bg-bg px-4 py-4">
        <div className="flex h-9 overflow-hidden rounded-lg border border-line" role="img" aria-label="Time bar">
          {m.map((v, i) => (
            <div key={i} title={`${STEPS[i]}: ${v} min`} style={{ width: `${(v / Math.max(TOTAL, sum)) * 100}%`, background: COLORS[i] }} className="grid place-items-center overflow-hidden text-[12px] font-semibold text-white transition-[width] duration-300 motion-reduce:transition-none">
              {v >= 3 ? v : ''}
            </div>
          ))}
        </div>
        <p className={`m-0 mt-2 text-[13px] ${left === 0 ? 'text-ok' : left > 0 ? 'text-warn' : 'text-bad'}`}>
          {left === 0 ? 'Exactly 45 minutes.' : left > 0 ? `${left} min unspent.` : `${-left} min over budget.`}
        </p>
        <ul className="m-0 mt-3 list-none space-y-2 p-0">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-[14px]">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS[i] }} />
              <span className="flex-1">{s}</span>
              <button type="button" aria-label={`Less time for ${s}`} onClick={() => set(i, -1)} className="h-8 w-8 rounded-lg border border-line text-muted hover:text-fg">−</button>
              <span className="w-12 text-center tabular-nums">{m[i]} min</span>
              <button type="button" aria-label={`More time for ${s}`} onClick={() => set(i, 1)} className="h-8 w-8 rounded-lg border border-line text-muted hover:text-fg">+</button>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-3 text-[13px] leading-snug text-muted">
          {m[4] > 18 && m[5] < 8 ? 'Warning: a long high-level design leaves little time for deep dives, and deep dives carry the non-functional requirements. ' : ''}
          {m[0] < 3 ? 'Warning: under 3 minutes on requirements risks designing the wrong system. ' : ''}
        </p>
      </div>
    </figure>
  );
}

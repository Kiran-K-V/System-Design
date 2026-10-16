import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { fanOut, single } from './Ai6SubMath';

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1000)}K`);
const usd = (n: number) => `$${n.toFixed(2)}`;

/** Subagent count versus tokens, dollars, and wall time. Our model: independent topics, equal work. */
export default function Ai6SubSim() {
  const [k, setK] = useState(3);
  const [n, setN] = useState(10);
  const [g, setG] = useState(3000);
  const [dup, setDup] = useState(0);
  const [overhead, setOverhead] = useState(3000);

  const o = { k, n, g, parent: 8000, overhead, brief: 500, summary: 1500, dup, out: 300, sec: 6 };
  const a = single(o);
  const b = fanOut(o);
  const ratio = b.inputTokens / a.inputTokens;

  const slider = (id: string, label: string, val: string, min: number, max: number, st: number, v: number, set: (x: number) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{val}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
  const card = (title: string, s: typeof a, id: string) => (
    <div className="rounded-lg border border-line p-3">
      <div className="text-xs text-muted">{title}</div>
      <div data-testid={id} className="font-mono text-sm leading-relaxed">
        input {fmt(s.inputTokens)} · {usd(s.cost)}
        <br />
        wall time {s.seconds} s · largest window {fmt(s.peakWindow)}{s.peakWindow > 200000 ? ' (over 200K: does not fit)' : ''}
      </div>
    </div>
  );

  return (
    <CacheWidgetFrame title="One agent or a fan-out" hint="our model, all sizes illustrative, Sonnet 5.5 prices, no cache">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a610-k', 'Independent topics = subagents', String(k), 1, 10, 1, k, setK)}
          {slider('a610-n', 'Model calls per topic', String(n), 1, 20, 1, n, setN)}
          {slider('a610-g', 'Tool result per call', `${g.toLocaleString('en-US')} tokens`, 500, 6000, 500, g, setG)}
          {slider('a610-ov', 'Subagent start-up (prompt + tools)', `${overhead.toLocaleString('en-US')} tokens`, 1000, 10000, 500, overhead, setOverhead)}
          {slider('a610-dup', 'Repeated work between subagents', `${dup}%`, 0, 300, 25, dup, setDup)}
        </div>
        <div className="space-y-2" aria-live="polite">
          {card('One agent, one window, topics in sequence', a, 'single')}
          {card(`${k} subagents in parallel, then a summary`, b, 'fan')}
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Fan-out input tokens versus one agent</div>
            <div data-testid="ratio" className="font-mono text-xl">{ratio.toFixed(2)}x</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: the parent holds 8,000 tokens. Each brief is 500 tokens and each summary 1,500. A call takes 6 seconds. One agent works through all topics in order, so its window keeps growing. Subagents work at the same time, each in a small window.
      </p>
    </CacheWidgetFrame>
  );
}

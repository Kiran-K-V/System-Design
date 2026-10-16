import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { SPREAD, UNIFORM, meanPass, passAtK, passHatK, runCost, type TaskGroup } from './Ai8TrajMath';

type Mix = 'uniform' | 'spread';
const GROUPS: Record<Mix, TaskGroup[]> = { uniform: UNIFORM, spread: SPREAD };

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Bar({ label, value, color, strong }: { label: string; value: number; color: string; strong?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums" style={{ color }}>{pct(value)}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded bg-bg">
        <div className="h-full" style={{ width: `${Math.max(value * 100, 0.5)}%`, background: color, opacity: strong ? 1 : 0.6 }} />
      </div>
    </div>
  );
}

/** pass@k versus pass^k for one agent, with a cost readout for the extra trials. */
export default function Ai8TrajPassK() {
  const [mix, setMix] = useState<Mix>('uniform');
  const [k, setK] = useState(4);
  const [tasks, setTasks] = useState(100);
  const [cost, setCost] = useState(0.3);
  const g = GROUPS[mix];
  const hat = passHatK(g, k);
  const at = passAtK(g, k);
  const spread = Array.from({ length: 8 }, (_, i) => passHatK(g, i + 1));

  return (
    <CacheWidgetFrame title="One pass rate, many reliabilities" hint="Illustrative task mix. Mean pass rate fixed at 61.2%, the tau-bench retail figure for gpt-4o.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Task mix" value={mix} onChange={setMix} options={[{ id: 'uniform', label: 'Every task passes 61.2% of runs' }, { id: 'spread', label: 'Mixed: solid, flaky, never' }]} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="a85-k" className="mb-1 flex justify-between text-xs text-muted"><span>Trials per task (k)</span><span className="tabular-nums text-fg">{k}</span></label>
          <input id="a85-k" type="range" min={1} max={8} step={1} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a85-t" className="mb-1 flex justify-between text-xs text-muted"><span>Tasks in the eval</span><span className="tabular-nums text-fg">{tasks}</span></label>
          <input id="a85-t" type="range" min={20} max={500} step={10} value={tasks} onChange={(e) => setTasks(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a85-c" className="mb-1 flex justify-between text-xs text-muted"><span>Cost per run</span><span className="tabular-nums text-fg">${cost.toFixed(2)}</span></label>
          <input id="a85-c" type="range" min={0.05} max={2} step={0.05} value={cost} onChange={(e) => setCost(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-2">
          <Bar label="Mean pass rate (pass^1)" value={meanPass(g)} color="var(--accent)" />
          <Bar label={`pass@${k}: at least one of ${k} runs passes`} value={at} color="var(--muted)" />
          <Bar label={`pass^${k}: all ${k} runs pass`} value={hat} color={hat < 0.3 ? 'var(--bad)' : hat < 0.6 ? 'var(--warn)' : 'var(--ok)'} strong />
          <div className="rounded-lg border border-line p-2.5">
            <p className="text-xs text-muted">Eval cost for this run</p>
            <p className="mt-0.5 font-mono text-lg tabular-nums">${runCost(tasks, k, cost).toFixed(2)}</p>
            <p className="text-xs text-muted">{tasks} tasks x {k} trials x ${cost.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-muted">pass^k for k = 1 to 8 (the chosen k is solid)</p>
          <div className="flex h-24 items-end gap-1" role="img" aria-label="pass to the k for k from 1 to 8">
            {spread.map((v, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
                <span className="mb-0.5 font-mono text-[11px] tabular-nums text-muted">{Math.round(v * 100)}</span>
                <div className="w-full rounded-sm" style={{ height: `${Math.max(v * 78, 1)}%`, background: 'var(--accent)', opacity: i + 1 === k ? 1 : 0.4 }} />
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted">
          Model: task groups with a fixed chance per run. pass^k = average over tasks of p^k. pass@k = average of 1 - (1 - p)^k. "Every task 61.2%": pass^8 = 0.612^8 = 2.0%. "Mixed" is 50% of tasks at 0.90, 30% at 0.54, 20% at 0: same mean, pass^8 = 21.7%. The tau-bench paper reports pass^8 below 25% for gpt-4o in retail, so the real task mix is uneven, not uniform.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}

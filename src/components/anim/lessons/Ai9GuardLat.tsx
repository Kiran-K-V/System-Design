import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { CHECKS, simulateLatency } from './Ai9GuardLogic';

export default function Ai9GuardLat() {
  const [on, setOn] = useState<Record<string, boolean>>({ rules: true, inject: true, guard: true, judge: false, pii: false });
  const chosen = CHECKS.filter((c) => on[c.id]);
  const r = useMemo(() => simulateLatency(chosen), [on]); // eslint-disable-line react-hooks/exhaustive-deps
  const scale = Math.max(r.serialP95, r.sumOfP95, 100) * 1.05;
  const bars = [
    { label: 'Serial, p95', v: r.serialP95, color: 'var(--bad)' },
    { label: 'Parallel, p95', v: r.parallelP95, color: 'var(--ok)' },
    { label: 'Sum of each check p95', v: r.sumOfP95, color: 'var(--muted)' },
  ];
  return (
    <CacheWidgetFrame title="Serial versus parallel guard checks" hint="Illustrative latencies, except the guard model median.">
      <div className="mb-3 flex flex-col gap-1.5 text-sm">
        {CHECKS.map((c) => (
          <label key={c.id} className="flex items-center gap-2">
            <input type="checkbox" checked={!!on[c.id]} onChange={(e) => setOn({ ...on, [c.id]: e.target.checked })} className="accent-[var(--accent)]" />
            <span>{c.label}</span>
            <span className="ml-auto font-mono text-xs text-muted">median {c.median} ms, p95 {c.p95} ms</span>
          </label>
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-line bg-surface p-3 text-sm" aria-live="polite">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs">
              <span>{b.label}</span>
              <span className="tabular-nums">{Math.round(b.v)} ms</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded bg-bg">
              <div className="h-full" style={{ width: `${(b.v / scale) * 100}%`, background: b.color }} />
            </div>
          </div>
        ))}
        <p className="pt-1 font-mono text-[13px]">
          median: serial {Math.round(r.serialP50)} ms, parallel {Math.round(r.parallelP50)} ms. Saved at p95: {Math.max(0, Math.round(r.serialP95 - r.parallelP95))} ms.
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: each check takes a random time that follows a lognormal curve (a long right tail) fitted to its median and p95. The checks are independent. Serial adds the times. Parallel takes the largest. 20,000 draws, fixed seed. Fan-out overhead is ignored, so a real parallel run is a little slower.
      </p>
    </CacheWidgetFrame>
  );
}

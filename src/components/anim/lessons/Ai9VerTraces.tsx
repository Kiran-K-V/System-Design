import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { N_TRACES, RELEASES, failSlots, failTotal, halfWidth95, type Reason } from './Ai9VerLogic';

const REASONS: { id: Reason; label: string }[] = [
  { id: 'wrong_tool', label: 'Wrong tool chosen' },
  { id: 'bad_format', label: 'Bad answer format' },
  { id: 'no_answer', label: 'No answer given' },
];

export default function Ai9VerTraces() {
  const [sel, setSel] = useState(3);
  const r = RELEASES[sel];
  const total = failTotal(r);
  const rate = (total / N_TRACES) * 100;
  const slots = failSlots(N_TRACES, total, 11 + sel);
  const hw = halfWidth95(total / N_TRACES, N_TRACES);

  return (
    <CacheWidgetFrame title="Failure rate by release" hint="Illustrative: 300 traces per release, one change per release.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Release" value={sel} options={RELEASES.map((x, i) => ({ id: i, label: `${x.label}: ${x.change}` }))} onChange={setSel} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-muted">Failure rate of every release. The selected one is highlighted.</p>
          <div className="flex h-28 items-end gap-3" role="img" aria-label="Failure rate per release">
            {RELEASES.map((x, i) => {
              const p = failTotal(x) / N_TRACES;
              return (
                <div key={x.id} className="flex min-w-0 flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
                  <span className="mb-1 text-xs tabular-nums">{(p * 100).toFixed(0)}%</span>
                  <div className="w-full" style={{ height: `${(p / 0.3) * 100}%`, background: i === sel ? 'var(--bad)' : 'var(--accent)', opacity: i === sel ? 1 : 0.5 }}>
                  </div>
                  <span className="mt-1 text-xs text-muted">{x.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: r.id === 'r4' ? 'var(--bad)' : 'var(--border)' }}>
          <p className="font-mono text-[13px]">
            {r.label} ({r.change}): {total} of {N_TRACES} traces failed = {rate.toFixed(1)}% (plus or minus {hw.toFixed(1)} points)
          </p>
          <div className="mt-2 grid gap-px" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }} aria-hidden="true">
            {slots.map((bad, i) => (
              <div key={i} className="aspect-square" style={{ background: bad ? 'var(--bad)' : 'var(--ok)', opacity: bad ? 1 : 0.35 }} />
            ))}
          </div>
          <ul className="mt-3 space-y-1">
            {REASONS.map((x) => (
              <li key={x.id} className="flex justify-between">
                <span>{x.label}</span>
                <span className="tabular-nums">{r.fails[x.id]}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted">Each release changed one thing. Compare r3 and r4: the total doubled and almost all of the growth is in "wrong tool chosen". That points at the tool text, not the prompt or the index.</p>
      </div>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { TOOLS, deltaIfAdded, surface } from './Ai10InjMath';

export default function Ai10InjSurface() {
  const [on, setOn] = useState<Record<string, boolean>>({ calc: true, kb: true, send: true });
  const s = surface(on);
  const toggle = (id: string) => setOn((cur) => ({ ...cur, [id]: !cur[id] }));
  const worst = s.pairs >= 12;

  return (
    <CacheWidgetFrame title="Attack surface as tools are added" hint="Illustrative tool set. Tick tools to add them.">
      <div className="grid gap-2 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const d = deltaIfAdded(on, t.id);
          return (
            <label key={t.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm ${on[t.id] ? 'border-accent bg-accent-soft' : 'border-line'}`}>
              <input type="checkbox" checked={!!on[t.id]} onChange={() => toggle(t.id)} className="mt-1 accent-[var(--accent)]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-[12px] text-muted">{t.sources} in, {t.exits} out</span>
                </span>
                <span className="block text-xs text-muted">{t.note}</span>
                {!on[t.id] && <span className="block font-mono text-[12px]" style={{ color: d > 0 ? 'var(--warn)' : 'var(--muted)' }}>adds {d} pairs</span>}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Outside text sources</div><div className="text-lg font-semibold tabular-nums">{s.sources}</div></div>
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Exits</div><div className="text-lg font-semibold tabular-nums">{s.exits}</div></div>
        <div className="rounded-lg border p-2.5" style={{ borderColor: worst ? 'var(--bad)' : 'var(--border)' }}><div className="text-xs text-muted">Pairs (sources x exits)</div><div className="text-lg font-semibold tabular-nums" style={{ color: worst ? 'var(--bad)' : undefined }}>{s.pairs}</div></div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: an attacker who controls one source may be able to steer the agent to one exit. So {s.sources} sources x {s.exits} exits = {s.pairs} paths to test, as an upper bound. Real paths are fewer, because some pairs make no sense. Sources add up with tools, and pairs multiply.
      </p>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { VIEWS } from './Ai10RedData';

export default function Ai10RedBars() {
  const [id, setId] = useState<(typeof VIEWS)[number]['id']>('stack');
  const v = VIEWS.find((x) => x.id === id)!;
  return (
    <CacheWidgetFrame title="How well attacks work, from published tests" hint="Switch the view. Bars are percent.">
      <div className="mb-3">
        <Seg label="View" value={id} options={VIEWS.map((x) => ({ id: x.id, label: x.tab }))} onChange={setId} />
      </div>
      <p className="mb-3 text-sm font-medium">{v.title}</p>
      <ul className="space-y-3" aria-live="polite">
        {v.rows.map((r) => (
          <li key={r.label}>
            <p className="mb-1 text-[13px]">{r.label}</p>
            {[{ name: v.aName, val: r.a, color: v.id === 'defence' && r.a < 10 ? 'var(--ok)' : 'var(--bad)' }, ...(r.b !== undefined && v.bName ? [{ name: v.bName, val: r.b, color: 'var(--warn)' }] : [])].map((bar) => (
              <div key={bar.name} className="mb-1 flex items-center gap-2">
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface" role="img" aria-label={`${bar.name}: ${bar.val} percent`}>
                  <div className="h-full" style={{ width: `${Math.max(bar.val, 0.8)}%`, background: bar.color }} />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-[13px] tabular-nums">{bar.val}%</span>
                {v.bName && <span className="hidden w-24 shrink-0 text-[12px] text-muted sm:inline">{bar.name}</span>}
              </div>
            ))}
          </li>
        ))}
      </ul>
      {!v.bName && <p className="mt-3 text-[13px] text-muted">{v.aName}</p>}
      <p className="mt-3 text-[13px] text-muted">Source: {v.source}</p>
    </CacheWidgetFrame>
  );
}

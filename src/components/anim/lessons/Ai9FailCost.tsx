import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { MODELS, perRequest } from './Ai9FailCostMath';

const usd = (v: number) => `$${v.toFixed(5)}`;

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toLocaleString('en-US')}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Cost of one request on the primary and on each backup, with the cache warm and cold. */
export default function Ai9FailCost() {
  const [primaryId, setPrimaryId] = useState('sonnet55');
  const [prefix, setPrefix] = useState(800);
  const [user, setUser] = useState(300);
  const [out, setOut] = useState(400);
  const primary = MODELS.find((m) => m.id === primaryId)!;
  const base = perRequest(primary, prefix, user, out, 'hit');
  const rows = MODELS.filter((m) => m.id !== primaryId).map((m) => {
    const warm = perRequest(m, prefix, user, out, 'hit');
    const cold = perRequest(m, prefix, user, out, 'write');
    return { m, warm, cold };
  });

  return (
    <CacheWidgetFrame title="What one request costs after a switch" hint="prices and minimums as of 2026-10-16, Claude API">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Primary</span>
        <Seg label="Primary model" value={primaryId} options={MODELS.map((m) => ({ id: m.id, label: m.name }))} onChange={setPrimaryId} />
      </div>
      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
        <Slider id="a9f-prefix" label="Repeated first part (tokens)" value={prefix} min={200} max={6000} step={100} onChange={setPrefix} />
        <Slider id="a9f-user" label="New text per request (tokens)" value={user} min={50} max={3000} step={50} onChange={setUser} />
        <Slider id="a9f-out" label="Answer length (tokens)" value={out} min={50} max={2000} step={50} onChange={setOut} />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">{primary.name} (primary, cache warm)</p>
          <p className="mt-2 text-lg font-semibold tabular-nums" data-testid="base">{usd(base.usd)}</p>
          <p className="text-xs text-muted">Needs {primary.min.toLocaleString('en-US')} tokens to cache. {base.cached ? 'Cached.' : 'Not cached.'}</p>
        </div>
        {rows.map(({ m, warm, cold }) => (
          <div key={m.id} className="rounded-lg border p-3" style={{ borderColor: warm.cached ? 'var(--line)' : 'var(--bad)' }} data-testid={`row-${m.id}`}>
            <p className="text-xs uppercase tracking-wide text-muted">{m.name} (backup)</p>
            <p className="mt-2 tabular-nums">
              first request, cold: <span className="font-semibold">{usd(cold.usd)}</span>
            </p>
            <p className="tabular-nums">
              later, warm: <span className="font-semibold">{usd(warm.usd)}</span> <span className="text-muted">({(warm.usd / base.usd).toFixed(2)}x primary)</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: warm.cached ? 'var(--muted)' : 'var(--bad)' }}>
              Needs {m.min.toLocaleString('en-US')} tokens to cache. {warm.cached ? 'Your prefix is long enough.' : `Your prefix is ${prefix.toLocaleString('en-US')}, so it is NOT cached, and no error tells you.`}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Model: cost = prefix at its rate + new text at the input rate + answer at the output rate. Cold means the prefix is being written to the cache (1.25 times the input price). Warm means a cache hit.</p>
    </CacheWidgetFrame>
  );
}

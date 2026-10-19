import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { AI_COST, bestIdx, evaluate } from './Ai13SupportHandoffMath';

const KINDS = [
  { id: 'answer', label: 'Answer only (error $20)', error: 20 },
  { id: 'small', label: 'Small refund (error $60)', error: 60 },
  { id: 'large', label: 'Large refund (error $500)', error: 500 },
];

const usd = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;

/** Handoff-policy simulator: threshold slider against cost per ticket and wrong-outcome rate. Inputs are illustrative. */
export default function Ai13SupportHandoff() {
  const [kind, setKind] = useState('small');
  const [idx, setIdx] = useState(3);
  const [human, setHuman] = useState(10);
  const errorCost = KINDS.find((k) => k.id === kind)!.error;
  const best = bestIdx(human, errorCost);
  const rows = Array.from({ length: 11 }, (_, i) => evaluate({ idx: i, humanCost: human, errorCost }));
  const r = rows[idx];
  const max = Math.max(...rows.map((x) => x.cost));
  const min = rows[best].cost;
  const onBest = idx === best;

  return (
    <CacheWidgetFrame title="Handoff threshold simulator" hint="Illustrative inputs. Move the sliders.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Ticket kind:</span>
        <Seg label="Ticket kind" value={kind} options={KINDS.map((k) => ({ id: k.id, label: k.label }))} onChange={setKind} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="a13h-t" className="mb-1 flex justify-between text-xs text-muted">
            <span>Handoff threshold (AI keeps a chat only at or above this score)</span>
            <span className="tabular-nums text-fg">{(idx / 10).toFixed(1)}</span>
          </label>
          <input id="a13h-t" type="range" min={0} max={10} step={1} value={idx} onChange={(e) => setIdx(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a13h-h" className="mb-1 flex justify-between text-xs text-muted">
            <span>Cost of a ticket a person handles (assumption)</span>
            <span className="tabular-nums text-fg">{usd(human)}</span>
          </label>
          <input id="a13h-h" type="range" min={2} max={30} step={1} value={human} onChange={(e) => setHuman(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: onBest ? 'var(--ok)' : 'var(--border)' }} aria-live="polite">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: onBest ? 'var(--ok)' : 'var(--warn)' }} data-testid="ho-verdict">
            {onBest ? 'This is the cheapest threshold.' : `Cheapest is ${(best / 10).toFixed(1)}, at ${usd(min)} per ticket.`}
          </span>
          <span className="font-semibold tabular-nums" data-testid="ho-cost">
            {usd(r.cost)} per ticket
          </span>
        </div>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Expected cost per ticket at each handoff threshold from 0.0 to 1.0">
          {rows.map((x, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end" title={`Threshold ${(i / 10).toFixed(1)}: ${usd(x.cost)}`}>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(4, (x.cost / max) * 100)}%`,
                  background: i === best ? 'var(--ok)' : 'var(--muted)',
                  opacity: i === idx ? 1 : 0.45,
                  outline: i === idx ? '2px solid var(--accent)' : 'none',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[11px] tabular-nums text-muted">
          {rows.map((_, i) => (
            <span key={i} className="flex-1 text-center">
              {(i / 10).toFixed(1)}
            </span>
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">AI keeps</dt>
            <dd className="tabular-nums" data-testid="ho-kept">{pct(r.kept, 0)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Resolved by AI, correct</dt>
            <dd className="tabular-nums" data-testid="ho-resolved">{pct(r.resolved)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Wrong among AI-kept</dt>
            <dd className="tabular-nums" data-testid="ho-wrong">{pct(r.wrongRate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Sent to people</dt>
            <dd className="tabular-nums" data-testid="ho-human">{pct(r.human, 0)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: cost per ticket = AI cost ({usd(AI_COST)}, paid on every chat while the AI is on) + share sent to people x person cost + share the AI gets wrong x error cost. The ten score buckets and their accuracy are made up and assume a calibrated score. People are assumed never wrong, which flatters the human side. Green bar is the cheapest threshold. The accent outline is your setting.
      </p>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import {
  KB_PER_PASSAGE,
  LIGHT_US_PER_CANDIDATE,
  LINK_GB_PER_S,
  RETRIEVE_MS,
  SHAPES,
  breakdown,
  lightMs,
  neuralMs,
  noFunnelMs,
  type Inputs,
} from './Ai14VespaFunnelMath';

const fmt = (n: number) => n.toLocaleString('en-US');
const ms = (n: number) => (n >= 100 ? `${n.toFixed(0)} ms` : n >= 10 ? `${n.toFixed(1)} ms` : `${n.toFixed(2)} ms`);

const PARTS = [
  { id: 'retrieveMs', label: 'Retrieval', color: 'var(--muted)' },
  { id: 'lightMs', label: 'Light ranker', color: 'var(--accent)' },
  { id: 'neuralMs', label: 'Neural rerank', color: 'var(--ok)' },
  { id: 'networkMs', label: 'Network (round trips and bytes)', color: 'var(--bad)' },
] as const;

/** Ranking funnel and hop budget. Every input is illustrative: the Vespa page publishes none of them. */
export default function Ai14VespaFunnel() {
  const [n0, setN0] = useState(1000);
  const [n1, setN1] = useState(100);
  const [n2, setN2] = useState(10);
  const [pair, setPair] = useState(4);
  const [rtt, setRtt] = useState(0.5);

  const n1e = Math.min(n1, n0);
  const n2e = Math.min(n2, n1e);
  const inp: Inputs = { n0, n1: n1e, n2: n2e, msPerPair: pair, parallel: 10, rttMs: rtt };
  const rows = SHAPES.map((s) => ({ shape: s, b: breakdown(s.id, inp) }));
  const max = Math.max(...rows.map((r) => r.b.totalMs));
  const flat = noFunnelMs(inp);
  const stages = [
    { id: 'ret', label: 'Retrieved', n: n0, note: `hybrid retrieval, about ${RETRIEVE_MS} ms`, color: 'var(--muted)' },
    { id: 'light', label: 'After the light ranker', n: n1e, note: `${fmt(n0)} x ${LIGHT_US_PER_CANDIDATE} µs = ${ms(lightMs(inp))}`, color: 'var(--accent)' },
    { id: 'neural', label: 'After the neural rerank', n: n2e, note: `${fmt(n1e)} x ${pair} ms / 10 = ${ms(neuralMs(n1e, inp))}`, color: 'var(--ok)' },
  ];

  const sl = (id: string, label: string, v: number, set: (x: number) => void, min: number, max2: number, step: number, unit = '') => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg" data-testid={`${id}-v`}>{fmt(v)}{unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max2} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );

  return (
    <CacheWidgetFrame title="Ranking funnel and hop budget" hint="Illustrative inputs. Not Perplexity's numbers.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {sl('vf-n0', 'Candidates retrieved', n0, setN0, 100, 10000, 100)}
        {sl('vf-n1', 'Kept by the light ranker', n1, setN1, 10, 500, 10)}
        {sl('vf-n2', 'Kept by the neural rerank', n2, setN2, 3, 30, 1)}
        {sl('vf-pair', 'Neural time per pair', pair, setPair, 1, 20, 1, ' ms')}
        {sl('vf-rtt', 'One network round trip', rtt, setRtt, 0.1, 5, 0.1, ' ms')}
      </div>

      <div className="mb-4 rounded-lg border border-line p-3" aria-live="polite">
        <p className="mb-2 text-sm font-medium">The funnel</p>
        <div className="space-y-2">
          {stages.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-2 text-sm">
                <span>{s.label}: <span className="font-semibold tabular-nums" data-testid={`vf-n-${s.id}`}>{fmt(s.n)}</span></span>
                <span className="text-xs text-muted">{s.note}</span>
              </div>
              <div className="h-3 w-full rounded bg-surface">
                <div className="h-3 rounded" style={{ width: `${Math.max((s.n / n0) * 100, 1.5)}%`, background: s.color, opacity: 0.85 }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm">
          With no funnel, the neural model scores all {fmt(n0)}: <span className="font-semibold tabular-nums" data-testid="vf-flat">{ms(flat)}</span> against <span className="font-semibold tabular-nums" data-testid="vf-funnel">{ms(rows[2].b.totalMs)}</span> for the funnel in one engine.
        </p>
      </div>

      <div className="rounded-lg border border-line p-3" aria-live="polite">
        <p className="mb-2 text-sm font-medium">One request, three designs</p>
        <div className="space-y-4">
          {rows.map(({ shape, b }) => (
            <div key={shape.id}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-2 text-sm">
                <span>{shape.label}</span>
                <span className="font-semibold tabular-nums" data-testid={`vf-total-${shape.id}`}>{ms(b.totalMs)}</span>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded bg-surface" style={{ width: `${(b.totalMs / max) * 100}%` }}>
                {PARTS.map((p) => (
                  <div key={p.id} style={{ width: `${(b[p.id] / b.totalMs) * 100}%`, background: p.color, opacity: 0.85 }} title={`${p.label}: ${ms(b[p.id])}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">
                {b.calls} calls, {b.hops} round trips in a row, <span data-testid={`vf-net-${shape.id}`}>{ms(b.networkMs)}</span> network ({ms(b.rttPartMs)} round trips + {ms(b.payloadMs)} for {b.megabytes < 1 ? b.megabytes.toFixed(2) : b.megabytes.toFixed(1)} MB). Chance one call is in its slowest 1%: <span data-testid={`vf-slow-${shape.id}`}>{(b.pSlowCall * 100).toFixed(1)}%</span>.
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {PARTS.map((p) => (
            <li key={p.id} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
              {p.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-muted">
        Model (ours, illustrative): retrieval takes {RETRIEVE_MS} ms in every design. The light ranker costs {LIGHT_US_PER_CANDIDATE} µs per retrieved candidate. The neural reranker scores 10 pairs at a time, so its time is pairs x time per pair / 10. A hop costs one round trip. The bytes that cross the wire cost {KB_PER_PASSAGE} KB per passage at {LINK_GB_PER_S} GB/s (a 10 Gbit/s link, so real transfers are slower). Separate stores ship each candidate list twice, in to the answer service and out to the next service: 2 x retrieved + 2 x kept by the light ranker. One engine with the reranker outside ships 2 x kept by the light ranker. One engine with inference inside ships only the final passages. The same-data-centre round trip of about 0.5 ms is from the Numbers to Know lesson. Everything else is an assumption: the page gives no candidate counts, hop counts or milliseconds. The chance of a slow call is 1 - 0.99^calls, and it assumes calls are independent.
      </p>
    </CacheWidgetFrame>
  );
}

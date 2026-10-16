import { useState } from 'react';
import { BATCH_TABLE, OUT_TOKENS, batchRow } from './ai2MathA';

const MAXTOK = batchRow(BATCH_TABLE.length - 1).tokS;
const MAXLAT = batchRow(BATCH_TABLE.length - 1).lat;

function Bar({ label, value, text, frac, color, tid }: { label: string; value?: number; text: string; frac: number; color: string; tid: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr_6.5rem] items-center gap-2 text-xs sm:grid-cols-[11rem_1fr_7.5rem]">
      <span className="text-muted">{label}</span>
      <span className="h-4 rounded bg-line/40">
        <span className="block h-4 rounded" style={{ width: `${Math.max(2, frac * 100)}%`, background: color }} />
      </span>
      <span className="text-right tabular-nums" data-testid={tid} data-value={value}>{text}</span>
    </div>
  );
}

export default function Ai2BatSlider() {
  const [i, setI] = useState(0);
  const r = batchRow(i);
  const prev = i > 0 ? batchRow(i - 1) : null;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="bat-slider">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Batch size: throughput up, latency up</span>
        <span className="text-xs text-muted">MPT-7B, 1 x A100, 512 tokens in, 64 out (Databricks, Table 2)</span>
      </div>
      <label htmlFor="bs-b" className="mb-1 flex justify-between text-xs text-muted">
        <span>Batch size</span>
        <span className="tabular-nums text-fg" data-testid="bs-b">{r.b}</span>
      </label>
      <input id="bs-b" type="range" min={0} max={BATCH_TABLE.length - 1} step={1} value={i} onChange={(e) => setI(+e.target.value)} className="w-full accent-[var(--accent)]" />
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted" aria-hidden="true">
        {BATCH_TABLE.map((x) => (
          <span key={x.b}>{x.b}</span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Bar label="Throughput (output tokens/s)" value={r.tokS} text={`${r.tokS.toFixed(0)} tok/s`} frac={r.tokS / MAXTOK} color="var(--ok)" tid="bs-tok" />
        <Bar label="Time per request (derived)" value={r.lat} text={`${r.lat.toFixed(2)} s`} frac={r.lat / MAXLAT} color="var(--warn)" tid="bs-lat" />
        <Bar label="Time per output token (derived)" value={r.perTokMs} text={`${r.perTokMs.toFixed(0)} ms`} frac={r.perTokMs / ((MAXLAT / OUT_TOKENS) * 1000)} color="var(--bad)" tid="bs-ptok" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Requests per second</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="bs-rps">{r.rps}</div>
          <div className="text-xs text-muted">from the table</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Throughput vs batch 1</div>
          <div className="text-lg font-semibold tabular-nums text-ok" data-testid="bs-thrx">{r.thrX.toFixed(1)}x</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Latency vs batch 1</div>
          <div className="text-lg font-semibold tabular-nums text-warn" data-testid="bs-latx">{r.latX.toFixed(1)}x</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Doubling step</div>
          <div className="text-sm font-semibold tabular-nums" data-testid="bs-step">
            {prev ? `+${((r.rps / prev.rps - 1) * 100).toFixed(0)}% tput, +${((r.lat / prev.lat - 1) * 100).toFixed(0)}% latency` : 'baseline'}
          </div>
          <div className="text-xs text-muted">vs the previous batch size</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Throughput = requests/s x 64 output tokens. Latency is derived: a full static batch of b requests finishes together, so latency = b / (requests/s), including prefill. Databricks reports "latency increases by 4x while throughput increases by 14x" at batch 64; the derived value is {batchRow(BATCH_TABLE.length - 1).latX.toFixed(1)}x, which agrees to within rounding of their text. Batch sizes between the points are not measured.
      </p>
    </div>
  );
}

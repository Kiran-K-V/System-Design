import { useState } from 'react';
import { GIB, GPUS, MODELS, PRECISIONS, budget, gpu, model, precision } from './ai2MathA';

const CTX = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const COUNTS = [1, 2, 4, 8];
const gb = (b: number) => `${(b / 1e9).toFixed(b >= 1e11 ? 0 : 1)} GB`;
const gib = (b: number) => `${(b / GIB).toFixed(b / GIB >= 10 ? 1 : 2)} GiB`;

function Sel({ id, label, value, onChange, children }: { id: string; label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block text-xs text-muted">
      {label}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
        {children}
      </select>
    </label>
  );
}

function Card({ title, value, note, tone, tid }: { title: string; value: string; note?: string; tone?: string; tid?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone ?? ''}`} data-testid={tid}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

export default function Ai2MemCalc() {
  const [mid, setMid] = useState('70b');
  const [pid, setPid] = useState('bf16');
  const [gid, setGid] = useState('h100');
  const [n, setN] = useState(4);
  const [reservePct, setReservePct] = useState(10);
  const [ci, setCi] = useState(3);

  const m = model(mid);
  const g = gpu(gid);
  const p = precision(pid);
  const ctx = CTX[ci];
  const b = budget(m, p.bytes, g, n, reservePct / 100, ctx);
  const used = b.weights + b.reserve;
  const scale = Math.max(b.total, used);
  const pct = (v: number) => `${Math.max(0, (v / scale) * 100)}%`;
  const over = Math.max(0, used - b.total);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="mem-calc">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">GPU memory budget</span>
        <span className="text-xs text-muted">weights are split evenly across GPUs (tensor parallel)</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Sel id="mc-model" label="Model" value={mid} onChange={setMid}>
          {MODELS.map((x) => (
            <option key={x.id} value={x.id}>{x.label}</option>
          ))}
        </Sel>
        <Sel id="mc-prec" label="Weight precision" value={pid} onChange={setPid}>
          {PRECISIONS.map((x) => (
            <option key={x.id} value={x.id}>{x.label} ({x.bytes} B)</option>
          ))}
        </Sel>
        <Sel id="mc-gpu" label="GPU" value={gid} onChange={setGid}>
          {GPUS.map((x) => (
            <option key={x.id} value={x.id}>{x.label}</option>
          ))}
        </Sel>
        <Sel id="mc-n" label="GPUs" value={n} onChange={(v) => setN(+v)}>
          {COUNTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Sel>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label htmlFor="mc-res" className="block text-xs text-muted">
          <span className="flex justify-between"><span>Reserve for activations and runtime (assumption)</span><span className="tabular-nums text-fg" data-testid="mc-res-v">{reservePct}%</span></span>
          <input id="mc-res" type="range" min={0} max={20} step={1} value={reservePct} onChange={(e) => setReservePct(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label htmlFor="mc-ctx" className="block text-xs text-muted">
          <span className="flex justify-between"><span>Context length per sequence</span><span className="tabular-nums text-fg" data-testid="mc-ctx-v">{ctx.toLocaleString('en-US')} tokens</span></span>
          <input id="mc-ctx" type="range" min={0} max={CTX.length - 1} step={1} value={ci} onChange={(e) => setCi(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>

      <div className="mt-4" role="img" aria-label="Memory bar: weights, reserve, KV room">
        <div className="flex h-7 overflow-hidden rounded-md border border-line bg-line/40">
          <div style={{ width: pct(Math.min(b.weights, b.total)), background: 'var(--accent)' }} className="opacity-70" title="Weights" />
          <div style={{ width: pct(Math.min(b.reserve, Math.max(0, b.total - b.weights))), background: 'var(--warn)' }} className="opacity-70" title="Reserve" />
          <div style={{ width: pct(Math.max(0, b.kvRoom)), background: 'var(--ok)' }} className="opacity-70" title="KV room" />
          {over > 0 && <div style={{ width: pct(over), background: 'var(--bad)' }} title="Over capacity" />}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--accent)' }} />weights {gb(b.weights)}</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--warn)' }} />reserve {gb(b.reserve)}</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--ok)' }} />KV room {gb(Math.max(0, b.kvRoom))}</span>
          {over > 0 && <span className="text-bad">over by {gb(over)}</span>}
          <span className="ml-auto">total {gb(b.total)}</span>
        </div>
      </div>

      <p className={`mt-3 text-[15px] ${b.fits ? 'text-ok' : 'text-bad'}`} data-testid="mc-fit">
        {b.fits ? `Fits. ${gb(b.kvRoom)} (${gib(b.kvRoom)}) is left for the KV cache.` : `Does not fit. Weights plus reserve are ${gb(used)} but you have ${gb(b.total)}. Use at least ${b.minGpus} of this GPU.`}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card title="Weights" value={gb(b.weights)} note={`${(m.params / 1e9).toFixed(0)}B x ${p.bytes} bytes`} tid="mc-weights" />
        <Card title="KV room" value={b.fits ? gb(b.kvRoom) : '0 GB'} note="total - weights - reserve" tid="mc-room" />
        <Card title="KV per token" value={`${b.kvPerToken / 1024} KiB`} note="BF16 cache, 2 x L x kv heads x dim x 2" tid="mc-kvtok" />
        <Card title={`KV per ${ctx >= 1024 ? ctx / 1024 + 'K' : ctx}-token sequence`} value={gib(b.kvPerSeq)} tid="mc-kvseq" />
        <Card title="Max concurrent sequences" value={String(b.maxSeqs)} note="KV room / KV per sequence" tone={b.maxSeqs > 0 ? 'text-ok' : 'text-bad'} tid="mc-seqs" />
        <Card title="Time to read the weights once" value={`${b.readMs.toFixed(1)} ms`} note={`${gb(b.weights / n)} per GPU at ${(g.bw / 1e12).toFixed(2)} TB/s`} tid="mc-read" />
      </div>
      <p className="mt-3 text-xs text-muted">
        {m.active < m.params
          ? `Memory follows all ${(m.params / 1e9).toFixed(0)}B parameters. Compute per token follows the ${(m.active / 1e9).toFixed(0)}B active ones.`
          : 'Dense model: every parameter is used for every token.'}{' '}
        Assumptions: KV cache in BF16 (2 bytes), no weight sharing across sequences beyond the weights themselves, perfect even split across GPUs. GB means 10^9 bytes; GiB means 2^30 bytes.
      </p>
    </div>
  );
}

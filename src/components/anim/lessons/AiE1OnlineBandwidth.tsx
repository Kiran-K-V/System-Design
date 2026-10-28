import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { load, type Dtype } from './AiE1OnlineLogic';

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
/** Log slider: 0..100 maps to 1,000..1,000,000 touched IDs. */
const idsAt = (i: number) => Math.round(1000 * Math.pow(1000, i / 100));

/** What does a sparse sync cost? The widget does the arithmetic. */
export default function AiE1OnlineBandwidth() {
  const [pos, setPos] = useState(67);
  const [dims, setDims] = useState(512);
  const [dtype, setDtype] = useState<Dtype>('float32');
  const [every, setEvery] = useState(1);
  const [copies, setCopies] = useState(10);
  const ids = idsAt(pos);
  const l = load(ids, dims, dtype, every, copies);

  return (
    <CacheWidgetFrame title="How big is a sparse update?" hint="Illustrative: raw values only, no compression">
      <div className="mb-3">
        <Seg label="Number format" value={dtype} options={[{ id: 'float32', label: '4 bytes per value' }, { id: 'float16', label: '2 bytes per value' }]} onChange={setDtype} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="e19-i" label="IDs touched since the last sync" value={pos} min={0} max={100} step={1} show={fmt(ids)} onChange={setPos} />
        <Slider id="e19-d" label="Embedding size (values per ID)" value={dims} min={64} max={2048} step={64} show={String(dims)} onChange={setDims} />
        <Slider id="e19-e" label="Minutes between syncs" value={every} min={1} max={60} step={1} show={`${every}`} onChange={setEvery} />
        <Slider id="e19-c" label="Serving copies to update" value={copies} min={1} max={50} step={1} show={String(copies)} onChange={setCopies} />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">One sync</p>
          <p className="mt-1 font-mono text-lg">{`${fmt(l.perSyncMB)} MB`}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Per day, to one copy</p>
          <p className="mt-1 font-mono text-lg">{`${fmt(l.perDayGB)} GB`}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Steady rate, all copies</p>
          <p className="mt-1 font-mono text-lg">{`${fmt(l.mbpsAll)} Mbit/s`}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: IDs x values per ID x bytes per value. It leaves out keys, optimizer state, and headers, and it assumes the trainer sends the full payload to each copy. The Monolith paper's own example (100,000 IDs, 1,024 values, 4 bytes each) comes to about 400 MB per minute. Lower precision and longer gaps cut the size. A real system also compresses.
      </p>
    </CacheWidgetFrame>
  );
}

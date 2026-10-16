import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { TRACE_PARTS, caught, leakedPerDay, spans, type Detector } from './Ai8FlyMath';

const fmt = (n: number) => n.toLocaleString('en-US');
const TAG = { name: 'NAME', email: 'EMAIL', phone: 'PHONE', address: 'ADDRESS' } as const;

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

/** Toy redaction demo plus a leak calculator. Illustrative. */
export default function Ai8FlyRedact() {
  const [det, setDet] = useState<Detector>('pattern');
  const [traces, setTraces] = useState(100000);
  const [per, setPer] = useState(2);
  const [recall, setRecall] = useState(99);

  const all = spans();
  const n = all.filter((s) => caught(s, det)).length;
  const leak = leakedPerDay(traces, per, recall / 100);

  return (
    <CacheWidgetFrame title="Redaction: what slips through" hint="illustrative trace and detectors">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg
          label="Detector"
          value={det}
          options={[
            { id: 'none', label: 'No redaction' },
            { id: 'pattern', label: 'Pattern rules' },
            { id: 'model', label: 'Rules + model' },
          ]}
          onChange={setDet}
        />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <p className="rounded-lg border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed">
          {TRACE_PARTS.map((p, i) =>
            typeof p === 'string' ? (
              <span key={i}>{p}</span>
            ) : caught(p, det) ? (
              <span key={i} className="rounded px-1" style={{ background: 'var(--ok)', color: 'var(--bg)' }}>[{TAG[p.kind]}]</span>
            ) : (
              <span key={i} className="rounded px-1" style={{ outline: '2px solid var(--bad)' }}>{p.text}</span>
            ),
          )}
        </p>
        <p className="font-mono text-[13px]">
          masked {n} of {all.length} personal details · {all.length - n} left in the stored trace
        </p>
        <p className="text-muted">Green tags are masked. Red outlines are still in the data. The order number is not personal data, so it stays: engineers need it.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Slider id="a89-t" label="Traces per day" value={traces} min={10000} max={1000000} step={10000} show={fmt(traces)} onChange={setTraces} />
          <Slider id="a89-s" label="Personal details per trace" value={per} min={0.5} max={5} step={0.5} show={String(per)} onChange={setPer} />
          <Slider id="a89-r" label="Share of details your redactor finds" value={recall} min={90} max={99.9} step={0.1} show={`${recall}%`} onChange={setRecall} />
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Details that stay in the stored data</p>
          <p className="mt-1 font-mono text-[13px]">
            {fmt(traces)} x {per} x {(100 - recall).toFixed(1)}% = {fmt(leak)} per day · {fmt(leak * 365)} per year
          </p>
        </div>
        <p className="text-muted">Model: every trace has the same number of personal details, and the redactor misses each one with the same chance. Real data vary, so measure the miss rate on a labeled sample.</p>
      </div>
    </CacheWidgetFrame>
  );
}

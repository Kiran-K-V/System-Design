import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { SketchBox, SketchSvg, HandText, TEXT_SIZES, seedOf } from '../sketch';
import { BINS, liveView } from './AiE1DriftLogic';

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

const X0 = 60;
const BW = 46;
const BASE = 200;
const SCALE = 600;

/** Train versus live histogram for one feature, with a shape distance and a coverage check. Illustrative data. */
export default function AiE1DriftHist() {
  const [shift, setShift] = useState(0);
  const [spread, setSpread] = useState(1);
  const [missing, setMissing] = useState(0);
  const v = liveView(shift, spread, missing);
  const shapeAlert = v.distance > 0.15;
  const covAlert = v.coverage < 0.9;

  return (
    <CacheWidgetFrame title="One feature: training data against live traffic" hint="Illustrative data">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="e17-s" label="Shift of the average" value={shift} min={0} max={4} step={0.5} show={`${shift} bins`} onChange={setShift} />
        <Slider id="e17-w" label="Spread of the values" value={spread} min={0.6} max={2} step={0.1} show={`${spread.toFixed(1)}x`} onChange={setSpread} />
        <Slider id="e17-m" label="Rows with the value missing" value={missing} min={0} max={50} step={2} show={`${missing}%`} onChange={setMissing} />
      </div>
      <SketchSvg width={720} height={250} label="Two bar charts overlaid. Training bars are grey. Live bars are blue.">
        {v.train.map((t, i) => {
          const l = v.live[i] * v.coverage;
          const cx = X0 + i * (BW + 6) + BW / 2;
          const th = Math.max(2, t * SCALE);
          const lh = Math.max(2, l * SCALE);
          return (
            <g key={i}>
              <SketchBox cx={cx - 10} cy={BASE - th / 2} w={20} h={th} r={4} seed={seedOf(`dh-t${i}`)} stroke="var(--muted)" fill="var(--muted)" />
              <SketchBox cx={cx + 10} cy={BASE - lh / 2} w={20} h={lh} r={4} seed={seedOf(`dh-l${i}`)} stroke="var(--accent)" fill="var(--accent)" />
            </g>
          );
        })}
        <HandText x={X0} y={236} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          {`feature value, ${BINS} bins`}
        </HandText>
        <HandText x={560} y={24} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          grey: training
        </HandText>
        <HandText x={560} y={44} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">
          blue: live
        </HandText>
      </SketchSvg>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: shapeAlert ? 'var(--bad)' : 'var(--ok)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">Shape distance (0 same, 1 no overlap)</p>
          <p className="mt-1 font-mono text-lg">{v.distance.toFixed(2)}</p>
          <p className="mt-1 text-muted">{shapeAlert ? 'Alert: the live shape left the training shape.' : 'Quiet: the shape matches.'}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: covAlert ? 'var(--bad)' : 'var(--ok)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">Coverage (rows with a value)</p>
          <p className="mt-1 font-mono text-lg">{Math.round(v.coverage * 100)}%</p>
          <p className="mt-1 text-muted">{covAlert ? 'Alert: many rows lost the feature.' : 'Quiet: the feature is filled in.'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        The shape distance is the total variation distance of the two normalised histograms. The 0.15 and 90% alert lines are illustrative. Set your own from history. Set missing rows to 40% and note that the shape distance stays at 0: only the coverage check sees that failure.
      </p>
    </CacheWidgetFrame>
  );
}

import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { SIZES, LLAMA_RATE, perDay, mtbfHours, cleanRun, effectiveShare, sampleDay, type SimIn } from './AiE2FailureLogic';

const pct = (n: number) => `${(n * 100).toFixed(n >= 0.995 || n < 0.01 ? 1 : 0)}%`;
function span(h: number): string {
  if (h >= 48) return `${Math.round(h / 24).toLocaleString('en-US')} days`;
  if (h >= 2) return `${h.toFixed(1)} hours`;
  return `${Math.round(h * 60)} minutes`;
}

function Slider({ id, label, value, display, min, max, step, onChange }: { id: string; label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{display}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Cluster size against time between interruptions. Illustrative model; logic in AiE2FailureLogic.ts. */
export default function AiE2FailureSim() {
  const [si, setSi] = useState(5);
  const [mult, setMult] = useState(1);
  const [restart, setRestart] = useState(5);
  const [ckpt, setCkpt] = useState(20);
  const inp: SimIn = { gpus: SIZES[si], rateMult: mult, restartMin: restart, ckptMin: ckpt };
  const day = useMemo(() => sampleDay(inp), [si, mult]); // eslint-disable-line react-hooks/exhaustive-deps
  const eff = effectiveShare(inp);
  const rows: [string, string][] = [
    ['Interruptions per day (average)', perDay(inp) < 0.1 ? perDay(inp).toFixed(2) : perDay(inp).toFixed(1)],
    ['Average time between interruptions', span(mtbfHours(inp))],
    ['Chance a 1-hour stretch has none', pct(cleanRun(inp, 1))],
    ['Chance a 24-hour stretch has none', pct(cleanRun(inp, 24))],
    ['Share of time spent on useful training', pct(eff)],
  ];

  return (
    <CacheWidgetFrame title="Cluster size against time between interruptions" hint="Illustrative model. Move the sliders.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="e26-gpus" label="GPUs in one job" value={si} display={SIZES[si].toLocaleString('en-US')} min={0} max={SIZES.length - 1} step={1} onChange={setSi} />
        <Slider id="e26-mult" label="Failure rate per GPU, against the Llama 3 figure" display={`${mult.toFixed(2)}x`} value={mult} min={0.25} max={4} step={0.25} onChange={setMult} />
        <Slider id="e26-restart" label="Detect, replace and restart" display={`${restart} min`} value={restart} min={1} max={60} step={1} onChange={setRestart} />
        <Slider id="e26-ckpt" label="Time between checkpoints" display={`${ckpt} min`} value={ckpt} min={5} max={120} step={5} onChange={setCkpt} />
      </div>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <tbody>
            {rows.map(([k, v], r) => (
              <tr key={k} className="border-b border-line/60">
                <td className="py-1.5 pr-2 text-muted">{k}</td>
                <td className="py-1.5 tabular-nums" data-testid={`e26-row-${r}`} style={{ color: r === 4 ? (eff >= 0.9 ? 'var(--ok)' : 'var(--warn)') : undefined }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <div className="mb-1 text-xs text-muted">One sample day, 24 hours. Each red mark is one interruption ({day.length} in this sample).</div>
        <div className="relative h-8 rounded bg-line" role="img" aria-label={`One sample day with ${day.length} interruptions`}>
          {day.map((t, k) => (
            <div key={k} className="absolute top-0 h-full w-[2px]" style={{ left: `${(t / 24) * 100}%`, background: 'var(--bad)' }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0 h</span><span>12 h</span><span>24 h</span></div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model, all illustrative. At 1.00x the rate comes from one published figure: 419 unexpected interruptions in 54 days on 16,384 GPUs (Llama 3 paper), which is about {(LLAMA_RATE * 1e4).toFixed(1)} per 10,000 GPU-hours. We spread that rate evenly over GPUs, although it also counts hosts, cables and software. Interruptions arrive at random and independently. Each costs the restart time plus, on average, half a checkpoint interval of lost work. The useful share is one divided by one plus interruptions per useful hour times hours lost per interruption. The sample day uses a fixed random seed. These are our assumptions, not Meta data.
      </p>
    </CacheWidgetFrame>
  );
}

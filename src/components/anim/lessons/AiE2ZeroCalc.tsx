import { useState } from 'react';
import { GPU_BYTES, TRAIN_MODELS, commVolume, model, perGpuState, type Stage } from './AiE2MemLogic';

const NDS = [1, 4, 8, 16, 32, 64, 128, 256, 1024];
const STAGES: { s: Stage; label: string }[] = [
  { s: 0, label: 'Plain data parallel' },
  { s: 1, label: 'ZeRO-1: optimizer' },
  { s: 2, label: 'ZeRO-2: + gradients' },
  { s: 3, label: 'ZeRO-3: + weights' },
];
const fmt = (b: number) => (b >= 1e12 ? `${(b / 1e12).toFixed(2)} TB` : `${(b / 1e9).toFixed(b < 1e10 ? 1 : 0)} GB`);

/** Per-GPU model-state memory for a model, a ZeRO stage, and a data-parallel size. Activations not counted. */
export default function AiE2ZeroCalc() {
  const [mid, setMid] = useState('70b');
  const [stage, setStage] = useState<Stage>(3);
  const [nd, setNd] = useState(128);
  const m = model(mid);
  const per = perGpuState(m.params, stage, nd);
  const fits = per < GPU_BYTES;
  const pct = Math.min(100, (per / GPU_BYTES) * 100);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="zero-calc">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Per-GPU state under ZeRO</span>
        <span className="text-xs text-muted">80 GB GPU, activations not counted</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor="zc-model" className="block text-xs text-muted">
          Model
          <select id="zc-model" value={mid} onChange={(e) => setMid(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {TRAIN_MODELS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </label>
        <label htmlFor="zc-nd" className="block text-xs text-muted">
          GPUs sharing the states
          <select id="zc-nd" value={nd} onChange={(e) => setNd(+e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {NDS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stage">
        {STAGES.map((x) => (
          <button
            key={x.s}
            type="button"
            onClick={() => setStage(x.s)}
            aria-pressed={x.s === stage}
            className={`rounded-lg border px-3 py-1.5 text-xs ${x.s === stage ? 'border-accent bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg'}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-4" role="img" aria-label="Per-GPU state against 80 GB">
        <div className="h-6 overflow-hidden rounded-md border border-line bg-line/40">
          <div style={{ width: `${pct}%`, background: fits ? 'var(--ok)' : 'var(--bad)' }} className="h-full opacity-70" />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted"><span>0</span><span>80 GB per GPU</span></div>
      </div>
      <p className={`mt-2 text-[15px] ${fits ? 'text-ok' : 'text-bad'}`} data-testid="zc-fit">
        {fits ? `Fits. ${fmt(per)} of states per GPU, ${fmt(GPU_BYTES - per)} left for activations.` : `Does not fit. ${fmt(per)} of states per GPU is more than 80 GB.`}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted">
            <tr><th className="py-1 pr-3 font-normal">Stage</th><th className="py-1 pr-3 font-normal">State per GPU</th><th className="py-1 font-normal">Traffic per step</th></tr>
          </thead>
          <tbody>
            {STAGES.map((x) => (
              <tr key={x.s} className={x.s === stage ? 'text-fg' : 'text-muted'}>
                <td className="py-1 pr-3">{x.label}</td>
                <td className="py-1 pr-3 tabular-nums" data-testid={`zc-row-${x.s}`}>{fmt(perGpuState(m.params, x.s, nd))}</td>
                <td className="py-1 tabular-nums">{commVolume(x.s)} x parameters</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: 16 bytes per parameter, sharded as the ZeRO paper describes. The traffic column follows the paper's counts (stage 3 is 1.5 times the others). Real runs also need room for activations and buffers, and the traffic matters most when the GPUs sit on a slow link.
      </p>
    </div>
  );
}

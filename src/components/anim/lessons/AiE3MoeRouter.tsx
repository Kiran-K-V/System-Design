import { useState } from 'react';
import { A2A_SHARE, EXPERTS, GPUS, HOT, balance, distinctExperts, expertLoads, gpuLoads, slowdown } from './AiE3ParLogic';

const BATCHES = [1, 4, 16, 64, 256, 1024];

function Slider({ id, label, value, min, max, step, onChange, shown }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; shown: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function AiE3MoeRouter() {
  const [bi, setBi] = useState(4);
  const [hotPct, setHotPct] = useState(40);
  const [copies, setCopies] = useState(0);
  const batch = BATCHES[bi];
  const hot = hotPct / 100;
  const loads = gpuLoads(batch, hot, copies);
  const exp = expertLoads(batch, hot);
  const max = Math.max(...loads);
  const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
  const sd = slowdown(loads);
  const touched = distinctExperts(batch);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="moe-sim">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">{`MoE layer: ${EXPERTS} experts on ${GPUS} GPUs, 2 experts per token`}</span>
        <span className="text-xs text-muted">Illustrative model. Expert {HOT + 1} is the hot one.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider id="moe-b" label="Tokens in the step" value={bi} min={0} max={BATCHES.length - 1} step={1} onChange={setBi} shown={String(batch)} />
        <Slider id="moe-h" label={`Share of routing to expert ${HOT + 1} (even is 12.5%)`} value={hotPct} min={13} max={50} step={1} onChange={setHotPct} shown={`${hotPct}%`} />
        <Slider id="moe-c" label="Extra copies of the hot expert" value={copies} min={0} max={3} step={1} onChange={setCopies} shown={String(copies)} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {loads.map((l, g) => {
          const isMax = l === max && max / avg > 1.02;
          return (
            <div key={g} className="rounded-lg border border-line bg-surface p-2">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{`GPU ${g + 1}`}</span>
                <span className="tabular-nums" data-testid={`moe-load-${g}`}>{l.toFixed(0)}</span>
              </div>
              <div className="flex h-20 items-end rounded bg-line/30">
                <div className="w-full rounded" style={{ height: `${(l / (max * 1.05)) * 100}%`, background: isMax ? 'var(--bad)' : 'var(--ok)', opacity: 0.85 }} />
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {`experts ${2 * g + 1}, ${2 * g + 2}`}
                {g === Math.floor(HOT / 2) ? ' (hot)' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Step time vs balanced</div>
          <div className={`text-lg font-semibold tabular-nums ${sd > 1.2 ? 'text-bad' : 'text-ok'}`} data-testid="moe-slow">{sd.toFixed(2)}x</div>
          <div className="text-xs text-muted">follows the busiest GPU</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Balance, average over max</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="moe-bal">{balance(loads).toFixed(2)}</div>
          <div className="text-xs text-muted">1.00 is even</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Busiest expert alone</div>
          <div className="text-lg font-semibold tabular-nums">{Math.max(...exp).toFixed(0)}</div>
          <div className="text-xs text-muted">tokens this step</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Experts read from memory</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="moe-touched">{touched.toFixed(1)} of {EXPERTS}</div>
          <div className="text-xs text-muted">if routing were even</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model. Each token picks 2 experts. Experts sit in pairs on GPUs. The expert part of the step takes as long as the busiest GPU. The all-to-all exchange is a fixed {A2A_SHARE * 100}% of a balanced step (illustrative). A copy of the hot expert goes on the lightest GPU and splits its tokens; it costs memory on that GPU for every MoE layer. With one expert far above the average GPU load, moving experts between GPUs cannot help, because that expert alone is the load. Tokens are expected counts, not a random draw.
      </p>
    </div>
  );
}

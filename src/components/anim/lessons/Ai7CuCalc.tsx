import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CU_MODELS, cuRun, type Policy } from './Ai7CuMath';

const money = (v: number) => (v >= 10 ? `$${v.toFixed(2)}` : v >= 0.1 ? `$${v.toFixed(2)}` : `$${v.toFixed(3)}`);

/** Cost, time, and success of an n-step computer-use task. Image tokens only. */
export default function Ai7CuCalc() {
  const [steps, setSteps] = useState(30);
  const [tok, setTok] = useState(1400);
  const [policy, setPolicy] = useState<Policy>('all');
  const [model, setModel] = useState('sonnet55');
  const [sec, setSec] = useState(5);
  const [p, setP] = useState(98);

  const m = CU_MODELS.find((x) => x.id === model)!;
  const r = cuRun(steps, tok, policy, m.input, sec, p / 100);

  return (
    <CacheWidgetFrame title="Computer-use task calculator" hint="image tokens only, input prices as of 2026-10-16, seconds and success rate are your own assumptions">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a75-steps" className="mb-1 flex justify-between text-xs text-muted">
              <span>Steps (one screenshot each)</span>
              <span className="tabular-nums text-fg">{steps}</span>
            </label>
            <input id="a75-steps" type="range" min={5} max={100} step={1} value={steps} onChange={(e) => setSteps(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a75-tok" className="mb-1 flex justify-between text-xs text-muted">
              <span>Tokens per screenshot (docs: roughly 1,000 to 1,800)</span>
              <span className="tabular-nums text-fg">{tok.toLocaleString('en-US')}</span>
            </label>
            <input id="a75-tok" type="range" min={1000} max={1800} step={50} value={tok} onChange={(e) => setTok(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a75-sec" className="mb-1 flex justify-between text-xs text-muted">
              <span>Seconds per step (illustrative)</span>
              <span className="tabular-nums text-fg">{sec}</span>
            </label>
            <input id="a75-sec" type="range" min={1} max={20} step={1} value={sec} onChange={(e) => setSec(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a75-p" className="mb-1 flex justify-between text-xs text-muted">
              <span>Chance each step goes right (illustrative)</span>
              <span className="tabular-nums text-fg">{p}%</span>
            </label>
            <input id="a75-p" type="range" min={90} max={100} step={1} value={p} onChange={(e) => setP(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div className="space-y-2 text-xs text-muted">
            <div className="flex flex-wrap items-center gap-2">
              <span>Old screenshots</span>
              <Seg label="Screenshot policy" value={policy} onChange={setPolicy} options={[{ id: 'all', label: 'Resend all' }, { id: 'last3', label: 'Keep last 3' }]} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>Model</span>
              <Seg label="Model" value={model} onChange={setModel} options={CU_MODELS.map((x) => ({ id: x.id, label: `${x.name.split(' (')[0]} $${x.input}` }))} />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Screenshot sends</div>
              <div className="text-lg font-semibold tabular-nums">{r.sends.toLocaleString('en-US')}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Image input tokens</div>
              <div className="text-lg font-semibold tabular-nums">{r.imageTokens.toLocaleString('en-US')}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Image cost (no cache)</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{money(r.dollars)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Wall-clock time</div>
              <div className="text-lg font-semibold tabular-nums">{r.seconds >= 120 ? `${(r.seconds / 60).toFixed(1)} min` : `${r.seconds} s`}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Chance the whole task succeeds</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: r.success < 0.5 ? 'var(--bad)' : r.success < 0.8 ? 'var(--warn)' : 'var(--ok)' }}>
              {(r.success * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted">{p / 100} to the power {steps}, if steps fail independently</div>
          </div>
          <p className="text-xs text-muted">
            Sends: with "Resend all", step k carries k screenshots, so n steps send n(n+1)/2. With "Keep last 3", step k carries min(k, 3). Text, the system prompt, and output tokens are left out, so real bills are higher.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

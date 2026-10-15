import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { API_MODELS, GPU, HOURS_PER_MONTH, breakEven, crossover } from './ai0Math';

const fmt$ = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : `$${v.toFixed(2)}`);
const fmtTok = (v: number) => (v >= 1e10 ? `${Math.round(v / 1e9)}B` : v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${Math.round(v / 1e6)}M`);

const W = 720;
const H = 300;
const L = 70;
const R = 20;
const T = 16;
const B = 44;
const X_LO = 6;
const X_HI = 11;
const Y_LO = 2;
const Y_HI = 7;
const YL: Record<number, string> = { 2: '$100', 3: '$1K', 4: '$10K', 5: '$100K', 6: '$1M', 7: '$10M' };
const px = (lt: number) => L + ((lt - X_LO) / (X_HI - X_LO)) * (W - L - R);
const py = (lv: number) => T + (1 - (Math.min(Math.max(lv, Y_LO), Y_HI) - Y_LO) / (Y_HI - Y_LO)) * (H - T - B);

/** API cost against self-hosted GPU cost. Output tokens only. Log-log chart. */
export default function Ai0CostCrossover() {
  const [modelId, setModelId] = useState('haiku55');
  const [logT, setLogT] = useState(8.3);
  const [util, setUtil] = useState(50);
  const [failover, setFailover] = useState(false);

  const m = API_MODELS.find((x) => x.id === modelId)!;
  const u = util / 100;
  const minGpus = failover ? 2 : 1;
  const tokens = Math.pow(10, logT);
  const c = crossover(tokens, m.output, u, GPU.perHour, minGpus);
  const be = breakEven(m.output, u, GPU.perHour, minGpus, 1e6, 1e11);
  const selfPerM = (GPU.perHour * HOURS_PER_MONTH) / ((GPU.tokensPerSec * u * 86400 * 30) / 1e6);

  const apiPts: string[] = [];
  const selfPts: string[] = [];
  for (let i = 0; i <= 150; i++) {
    const lt = X_LO + ((X_HI - X_LO) * i) / 150;
    const x = Math.pow(10, lt);
    const r = crossover(x, m.output, u, GPU.perHour, minGpus);
    apiPts.push(`${px(lt).toFixed(1)},${py(Math.log10(r.apiMonthly)).toFixed(1)}`);
    selfPts.push(`${px(lt).toFixed(1)},${py(Math.log10(r.selfMonthly)).toFixed(1)}`);
  }
  const cheaper = c.apiMonthly <= c.selfMonthly ? 'API' : 'Self-host';

  return (
    <CacheWidgetFrame title="API versus self-hosted GPU" hint="output tokens only, prices as of 2026-10-15">
      <div className="grid gap-4 text-sm">
        <div className="space-y-3">
          <div>
            <label htmlFor="a0x-model" className="mb-1 block text-xs text-muted">API model (output price)</label>
            <select id="a0x-model" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {API_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.provider} {x.name} (${x.output}/1M)</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a0x-t" className="mb-1 flex justify-between text-xs text-muted">
              <span>Output tokens per day</span>
              <span className="tabular-nums text-fg">{fmtTok(tokens)}</span>
            </label>
            <input id="a0x-t" type="range" min={6} max={11} step={0.05} value={logT} onChange={(e) => setLogT(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a0x-u" className="mb-1 flex justify-between text-xs text-muted">
              <span>GPU utilization</span>
              <span className="tabular-nums text-fg">{util}%</span>
            </label>
            <input id="a0x-u" type="range" min={5} max={100} step={5} value={util} onChange={(e) => setUtil(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={failover} onChange={(e) => setFailover(e.target.checked)} className="accent-[var(--accent)]" />
            Keep 2 GPUs for failover
          </label>
          <p className="text-xs text-muted">GPU: {GPU.name}, ${GPU.perHour} per hour, {GPU.tokensPerSec.toLocaleString('en-US')} tokens/s measured for an 8B model.</p>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">API per month</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{fmt$(c.apiMonthly)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Self-host ({c.gpus} GPU{c.gpus === 1 ? '' : 's'})</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }}>{fmt$(c.selfMonthly)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Cheaper on price</div>
              <div className="text-lg font-semibold">{cheaper}</div>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly cost of API and self-hosted GPUs against tokens per day, log scale">
            {[2, 3, 4, 5, 6, 7].map((e) => (
              <g key={e}>
                <line x1={L} x2={W - R} y1={py(e)} y2={py(e)} stroke="var(--border)" />
                <text x={L - 8} y={py(e) + 4} textAnchor="end" fontSize={14} fill="var(--muted)">{YL[e]}</text>
              </g>
            ))}
            {[6, 7, 8, 9, 10, 11].map((e) => (
              <g key={e}>
                <line x1={px(e)} x2={px(e)} y1={T} y2={H - B} stroke="var(--border)" />
                <text x={px(e)} y={H - B + 20} textAnchor="middle" fontSize={14} fill="var(--muted)">{fmtTok(Math.pow(10, e))}</text>
              </g>
            ))}
            <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={14} fill="var(--muted)">output tokens per day</text>
            <polyline points={apiPts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
            <polyline points={selfPts.join(' ')} fill="none" stroke="var(--warn)" strokeWidth={2.2} />
            {be && <circle cx={px(Math.log10(be))} cy={py(Math.log10(crossover(be, m.output, u, GPU.perHour, minGpus).selfMonthly))} r={6} fill="var(--bg)" stroke="var(--fg)" strokeWidth={2} />}
            <line x1={px(logT)} x2={px(logT)} y1={T} y2={H - B} stroke="var(--fg)" strokeDasharray="4 4" />
            <text x={L + 8} y={T + 14} fontSize={14} fill="var(--accent)">API</text>
            <text x={L + 44} y={T + 14} fontSize={14} fill="var(--warn)">self-host</text>
          </svg>
          <p className="text-xs leading-relaxed text-muted">
            {be ? `Break-even: about ${fmtTok(be)} output tokens per day (circle). Above it, self-hosting costs less on price alone.` : 'No break-even in range: at this utilization the GPU costs more per token than the API.'} Self-hosted cost per 1M output tokens at {util}% busy: ${selfPerM.toFixed(2)}. API: ${m.output}.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

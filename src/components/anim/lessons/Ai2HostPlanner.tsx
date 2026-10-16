import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { API_MODELS } from './ai0Math';
import { MEASURED_TOK_PER_SEC, OUTPUT_ONLY_TOK_PER_SEC, plan } from './Ai2HostMath';

const money = (v: number) => (v >= 1000 ? `$${Math.round(v).toLocaleString('en-US')}` : `$${v.toFixed(2)}`);
const GPU_PRICES = [
  { id: 'lam8', label: 'Lambda H100 SXM, 8x config: $3.99', v: 3.99 },
  { id: 'lam1', label: 'Lambda H100 SXM, 1x config: $4.29', v: 4.29 },
  { id: 'runc', label: 'RunPod H100 SXM community: $2.69', v: 2.69 },
];

/** Peak QPS, tokens per request, tokens/s per GPU and target utilization -> GPUs, monthly cost, $/M tokens against an API. */
export default function Ai2HostPlanner() {
  const [peak, setPeak] = useState(50);
  const [ratio, setRatio] = useState(30);
  const [tokReq, setTokReq] = useState(400);
  const [rate, setRate] = useState(MEASURED_TOK_PER_SEC);
  const [util, setUtil] = useState(70);
  const [gpuId, setGpuId] = useState('lam8');
  const [apiId, setApiId] = useState('haiku55');
  const [spare, setSpare] = useState(false);

  const api = API_MODELS.find((x) => x.id === apiId)!;
  const gpu = GPU_PRICES.find((x) => x.id === gpuId)!;
  const o = plan({ peakQps: peak, avgOverPeak: ratio / 100, tokensPerRequest: tokReq, tokPerGpu: rate, targetUtil: util / 100, gpuHour: gpu.v, apiOutPrice: api.output, spare: spare ? 1 : 0 });
  const cheaper = o.monthlySelf < o.monthlyApi ? 'Self-host' : 'API';

  return (
    <CacheWidgetFrame title="Capacity planner: GPUs and cost against an API" hint="output tokens only, prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="a27-peak" label="Peak requests per second" value={peak} min={1} max={500} step={1} on={setPeak} show={String(peak)} />
          <Slider id="a27-ratio" label="Average load as share of peak" value={ratio} min={5} max={100} step={5} on={setRatio} show={`${ratio}%`} />
          <Slider id="a27-tok" label="Output tokens per request" value={tokReq} min={50} max={2000} step={50} on={setTokReq} show={String(tokReq)} />
          <Slider id="a27-rate" label="Tokens per second per GPU (measure yours)" value={rate} min={500} max={12000} step={100} on={setRate} show={rate.toLocaleString('en-US')} />
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => setRate(MEASURED_TOK_PER_SEC)} className="rounded-md border border-line px-2 py-1 text-muted hover:bg-surface">Benchmark as cited in A0.4: {MEASURED_TOK_PER_SEC.toLocaleString('en-US')}</button>
            <button type="button" onClick={() => setRate(OUTPUT_ONLY_TOK_PER_SEC)} className="rounded-md border border-line px-2 py-1 text-muted hover:bg-surface">Output only, 35.04 req/s x 128: {OUTPUT_ONLY_TOK_PER_SEC.toLocaleString('en-US')}</button>
          </div>
          <Slider id="a27-util" label="Target utilization at peak" value={util} min={30} max={100} step={5} on={setUtil} show={`${util}%`} />
          <div>
            <label htmlFor="a27-gpu" className="mb-1 block text-xs text-muted">GPU price per hour</label>
            <select id="a27-gpu" value={gpuId} onChange={(e) => setGpuId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {GPU_PRICES.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a27-api" className="mb-1 block text-xs text-muted">API to compare (output price)</label>
            <select id="a27-api" value={apiId} onChange={(e) => setApiId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {API_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.provider} {x.name} (${x.output}/1M)</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={spare} onChange={(e) => setSpare(e.target.checked)} className="accent-[var(--accent)]" />
            Add one spare GPU for failover
          </label>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Peak tokens per second" value={Math.round(o.peakTokPerSec).toLocaleString('en-US')} />
            <Tile label="GPUs before headroom" value={String(o.gpusNoHeadroom)} />
            <Tile label="GPUs to provision" value={String(o.gpus)} color="var(--accent)" />
            <Tile label="Average utilization" value={`${Math.round(o.avgUtil * 100)}%`} color={o.avgUtil < 0.3 ? 'var(--bad)' : 'var(--ok)'} />
            <Tile label="Self-host per month" value={money(o.monthlySelf)} color="var(--warn)" />
            <Tile label="API per month" value={money(o.monthlyApi)} color="var(--accent)" />
            <Tile label="Self-host per 1M tokens" value={money(o.selfPerM)} />
            <Tile label="Cheaper on price" value={cheaper} />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            GPUs = ceil(peak tokens/s / (tokens/s per GPU x target utilization)). Cost per 1M tokens is the monthly GPU bill divided by the tokens you actually serve at average load, so a quiet night raises it. {api.provider} {api.name} costs ${api.output} per 1M output tokens. Compare quality on your eval, not on price alone.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, on, show }: { id: string; label: string; value: number; min: number; max: number; step: number; on: (v: number) => void; show: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

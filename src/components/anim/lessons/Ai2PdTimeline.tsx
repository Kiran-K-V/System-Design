import { useState } from 'react';
import { budget, gpu, model, requestTimes } from './ai2MathA';

const M = model('70b');
const PROMPTS = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const OUTS = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const GROUPS = [
  { id: '2h100', label: '2 x H100', g: 'h100', n: 2 },
  { id: '4h100', label: '4 x H100', g: 'h100', n: 4 },
  { id: '8h100', label: '8 x H100', g: 'h100', n: 8 },
  { id: '2h200', label: '2 x H200', g: 'h200', n: 2 },
];
const k = (n: number) => (n >= 1024 ? `${n / 1024}K` : String(n));
const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(v >= 100 ? 0 : 1)} ms`);

export default function Ai2PdTimeline() {
  const [pi, setPi] = useState(4);
  const [oi, setOi] = useState(5);
  const [gid, setGid] = useState('2h100');
  const grp = GROUPS.find((x) => x.id === gid)!;
  const g = gpu(grp.g);
  const prompt = PROMPTS[pi];
  const out = OUTS[oi];
  const r = requestTimes(M, 2, g, grp.n, prompt, out);
  const room = budget(M, 2, g, grp.n, 0.1, 1).kvRoom;
  const need = (prompt + out) * budget(M, 2, g, grp.n, 0.1, 1).kvPerToken;
  const fits = need <= room;
  const pre = Math.max(1.5, (r.ttft / r.total) * 100);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="pd-timeline">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">One request, prefill then decode (Llama 3 70B, BF16)</span>
        <span className="text-xs text-muted">floors: real systems are slower</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label htmlFor="pd-p" className="block text-xs text-muted">
          <span className="flex justify-between"><span>Prompt length</span><span className="tabular-nums text-fg" data-testid="pd-p-v">{prompt.toLocaleString('en-US')} tokens</span></span>
          <input id="pd-p" type="range" min={0} max={PROMPTS.length - 1} step={1} value={pi} onChange={(e) => setPi(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label htmlFor="pd-o" className="block text-xs text-muted">
          <span className="flex justify-between"><span>Output length</span><span className="tabular-nums text-fg" data-testid="pd-o-v">{out.toLocaleString('en-US')} tokens</span></span>
          <input id="pd-o" type="range" min={0} max={OUTS.length - 1} step={1} value={oi} onChange={(e) => setOi(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label htmlFor="pd-g" className="block text-xs text-muted">
          GPU group (tensor parallel)
          <select id="pd-g" value={gid} onChange={(e) => setGid(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {GROUPS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5" role="img" aria-label="Timeline: prefill block then decode block">
        <div className="relative flex h-9 overflow-hidden rounded-md border border-line">
          <div style={{ width: `${pre}%`, background: 'var(--accent)' }} className="shrink-0 opacity-70" />
          <div
            className="h-full flex-1"
            style={{ background: 'repeating-linear-gradient(90deg, color-mix(in srgb, var(--ok) 35%, var(--bg)) 0 6px, var(--bg) 6px 9px)' }}
          />
        </div>
        <div className="relative mt-1 h-10 text-xs">
          <span className="absolute left-0 text-accent">prefill: all {k(prompt)} prompt tokens in one pass</span>
          <span className="absolute right-0 top-5 text-ok">decode: one token per pass, {out.toLocaleString('en-US')} passes</span>
          <span className="absolute top-5 text-muted" style={{ left: `${Math.min(pre, 70)}%` }}>| first token appears (TTFT)</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">TTFT floor</div>
          <div className="text-lg font-semibold tabular-nums text-accent" data-testid="pd-ttft">{ms(r.ttft)}</div>
          <div className="text-xs text-muted">{r.computeBound ? 'compute-bound' : 'memory-bound'}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">TPOT floor</div>
          <div className="text-lg font-semibold tabular-nums text-ok" data-testid="pd-tpot">{ms(r.tpot)}</div>
          <div className="text-xs text-muted">{r.tokPerSec.toFixed(0)} tokens/s per user</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Total latency</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="pd-total">{ms(r.total)}</div>
          <div className="text-xs text-muted">TTFT + TPOT x output</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Time in decode</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="pd-share">{(r.decodeShare * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted">of the total</div>
        </div>
      </div>
      {!fits && (
        <p className="mt-3 text-[15px] text-bad" data-testid="pd-fit">
          The KV cache for this one request ({((need) / 2 ** 30).toFixed(1)} GiB) is more than the {(Math.max(0, room) / 2 ** 30).toFixed(1)} GiB of room after weights and a 10% reserve. It would not run on this group.
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        Model: batch 1, tensor parallel with perfect scaling and no link cost. TTFT floor = max(compute time, weight-read time), compute = (2 N p + 4 p² d L) / (GPUs x 989 TFLOPS). TPOT floor = (weight bytes + KV bytes at the mean context) / (GPUs x bandwidth).
      </p>
    </div>
  );
}

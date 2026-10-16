import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { BATCH_MODELS, MAX_PER_BATCH, TIER_LIMITS, batchesNeeded, cost, fmtDuration, syncMinutes } from './Ai3BatchMath';

const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);
const num = (v: number) => Math.round(v).toLocaleString('en-US');

/** Sync versus batch calculator. Same job, two ways to run it. */
export default function Ai3BatchCalc() {
  const [modelId, setModelId] = useState('sonnet55');
  const [tierId, setTierId] = useState('start');
  const [logN, setLogN] = useState(4.5);
  const [inTok, setInTok] = useState(1000);
  const [outTok, setOutTok] = useState(200);
  const [cache, setCache] = useState(0);

  const m = BATCH_MODELS.find((x) => x.id === modelId)!;
  const t = TIER_LIMITS.find((x) => x.id === tierId)!;
  const n = Math.round(Math.pow(10, logN));
  const j = { requests: n, inTokens: inTok, outTokens: outTok, cacheShare: cache / 100 };
  const sync = cost(m, j, false);
  const batch = cost(m, j, true);
  const st = syncMinutes(t, j);
  const nb = batchesNeeded(n);
  const queueOver = n > t.queue;

  return (
    <CacheWidgetFrame title="Sync or batch: cost and wait" hint="prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a3b-m" className="mb-1 block text-xs text-muted">Model</label>
            <select id="a3b-m" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {BATCH_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.name}: ${x.inStd} in, ${x.outStd} out per 1M</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a3b-t" className="mb-1 block text-xs text-muted">Rate limit tier</label>
            <select id="a3b-t" value={tierId} onChange={(e) => setTierId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {TIER_LIMITS.map((x) => (
                <option key={x.id} value={x.id}>{x.name}: {num(x.rpm)} RPM, {x.itpm / 1e6}M ITPM, {x.otpm / 1e3}K OTPM</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a3b-n" className="mb-1 flex justify-between text-xs text-muted"><span>Requests</span><span className="tabular-nums text-fg">{num(n)}</span></label>
            <input id="a3b-n" type="range" min={2} max={6.5} step={0.05} value={logN} onChange={(e) => setLogN(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3b-i" className="mb-1 flex justify-between text-xs text-muted"><span>Input tokens per request</span><span className="tabular-nums text-fg">{num(inTok)}</span></label>
            <input id="a3b-i" type="range" min={100} max={20000} step={100} value={inTok} onChange={(e) => setInTok(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3b-o" className="mb-1 flex justify-between text-xs text-muted"><span>Output tokens per request</span><span className="tabular-nums text-fg">{num(outTok)}</span></label>
            <input id="a3b-o" type="range" min={10} max={4000} step={10} value={outTok} onChange={(e) => setOutTok(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3b-c" className="mb-1 flex justify-between text-xs text-muted"><span>Share of input read from cache</span><span className="tabular-nums text-fg">{cache}%</span></label>
            <input id="a3b-c" type="range" min={0} max={90} step={5} value={cache} onChange={(e) => setCache(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Sync cost</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a3b-sync">{money(sync)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Batch cost</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--ok)' }} data-testid="a3b-batch">{money(batch)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Saved by batch</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="a3b-saved">{money(sync - batch)} ({sync > 0 ? Math.round(((sync - batch) / sync) * 100) : 0}%)</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Sync: time at full budget</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a3b-time">{fmtDuration(st.minutes)}</div>
              <div className="text-xs text-muted">{st.binding} binds</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Batch: window</div>
              <div className="text-lg font-semibold tabular-nums">up to 24 h</div>
              <div className="text-xs text-muted">most under 1 h, not promised</div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted" data-testid="a3b-note">
            Needs {nb} batch{nb === 1 ? '' : 'es'} at {num(MAX_PER_BATCH)} requests each.{' '}
            {queueOver ? `The ${t.name} queue holds ${num(t.queue)} batch requests, so submit in waves. ` : ''}
            Sync time assumes you use the whole tier budget with no other traffic. It ignores the delay of single calls and retries. Cache writes are ignored in both costs. Cache hits in batches are best effort (the page says 30% to 98% in practice).
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

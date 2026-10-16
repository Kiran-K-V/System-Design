import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CACHE_MODELS, breakEvenReads, breakEvenWhole, cycleCost, hitRate } from './Ai2CacheMath';

const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);

/** Break-even calculator for a cached prefix: one write followed by k reads inside the TTL. */
export default function Ai2CacheCalc() {
  const [id, setId] = useState('sonnet55');
  const [tokens, setTokens] = useState(20000);
  const [reads, setReads] = useState(4);
  const [ttl, setTtl] = useState<'5m' | '1h'>('5m');
  const [perDay, setPerDay] = useState(1000);

  const m = CACHE_MODELS.find((x) => x.id === id)!;
  const has1h = m.write1h !== null;
  const wMult = ttl === '1h' && has1h ? (m.write1h as number) : m.write5;
  const rMult = m.read / m.input;
  const c = cycleCost(tokens, m.input, wMult, rMult, reads);
  const be = breakEvenReads(wMult, rMult);
  const beWhole = breakEvenWhole(wMult, rMult);
  const saving = 1 - c.cached / c.uncached;
  const cyclesPerDay = perDay / (reads + 1);
  const daily = (c.uncached - c.cached) * cyclesPerDay;

  return (
    <CacheWidgetFrame title="Prompt cache break-even" hint="input tokens of the shared prefix only, prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a25-model" className="mb-1 block text-xs text-muted">Model (base input price, read price)</label>
            <select id="a25-model" value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {CACHE_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.provider} {x.name}: ${x.input} in, ${x.read} read</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a25-tok" className="mb-1 flex justify-between text-xs text-muted">
              <span>Prefix size (tokens)</span>
              <span className="tabular-nums text-fg">{tokens.toLocaleString('en-US')}</span>
            </label>
            <input id="a25-tok" type="range" min={1000} max={200000} step={1000} value={tokens} onChange={(e) => setTokens(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a25-reads" className="mb-1 flex justify-between text-xs text-muted">
              <span>Reads per write, inside the TTL</span>
              <span className="tabular-nums text-fg">{reads} (hit rate {Math.round(hitRate(reads) * 100)}%)</span>
            </label>
            <input id="a25-reads" type="range" min={0} max={30} step={1} value={reads} onChange={(e) => setReads(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a25-day" className="mb-1 flex justify-between text-xs text-muted">
              <span>Requests per day</span>
              <span className="tabular-nums text-fg">{perDay.toLocaleString('en-US')}</span>
            </label>
            <input id="a25-day" type="range" min={100} max={100000} step={100} value={perDay} onChange={(e) => setPerDay(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>TTL</span>
            <Seg label="Cache lifetime" value={ttl} onChange={setTtl} options={[{ id: '5m', label: '5 min (write ' + m.write5 + 'x)' }, ...(has1h ? [{ id: '1h' as const, label: '1 hour (write 2x)' }] : [])]} />
          </div>
          <p className="text-xs text-muted">Write {wMult}x, read {Math.round(rMult * 1000) / 1000}x of the base price. Hit rate = reads / (reads + 1): each write is followed by that many reads before the entry expires.</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Without cache, per cycle</div>
              <div className="text-lg font-semibold tabular-nums">{money(c.uncached)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">With cache, per cycle</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{money(c.cached)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Saving on the prefix</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: saving >= 0 ? 'var(--ok)' : 'var(--bad)' }}>{Math.round(saving * 100)}%</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Break-even</div>
              <div className="text-lg font-semibold tabular-nums">{wMult <= 1 ? 'none needed' : `${be.toFixed(2)} reads`}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            {wMult <= 1
              ? 'This model charges no write premium, so the first hit already saves money.'
              : `The write costs ${(wMult - 1).toFixed(2)}x extra and each read saves ${(1 - rMult).toFixed(2)}x. That is ${be.toFixed(2)} reads, so you need ${beWhole} reuse${beWhole === 1 ? '' : 's'} before the cache wins.`}
            {' '}
            {reads < beWhole ? 'At the reads per write you chose, caching loses money.' : `At ${reads} reads per write it saves ${money(daily)} per day on the prefix at ${perDay.toLocaleString('en-US')} requests per day.`}
          </p>
          <p className="text-xs text-muted">The calculator prices the cached prefix only. New tokens and output are the same with or without a cache. It assumes every read lands inside the TTL.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

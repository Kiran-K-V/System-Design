import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CHAT_IN, CHAT_OUT, EFFORT_ROWS, MAX_CALLS, MAX_WORKERS, PRICES, inBand, runCost, type ModelId } from './Ai13ResearchCostMath';

const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(1)}`;
const secs = (n: number) => (n >= 120 ? `${(n / 60).toFixed(1)} min` : `${Math.round(n)} s`);
const fmt = (n: number) => n.toLocaleString('en-US');

const LEADS: ModelId[] = ['opus', 'sonnet'];
const WORKERS: ModelId[] = ['sonnet', 'haiku'];

/** Effort-scaling rule table with a cost per run at live prices. Inputs other than prices are illustrative. */
export default function Ai13ResearchEffort() {
  const [rowId, setRowId] = useState<(typeof EFFORT_ROWS)[number]['id']>('compare');
  const [workers, setWorkers] = useState(3);
  const [calls, setCalls] = useState(12);
  const [lead, setLead] = useState<ModelId>('opus');
  const [worker, setWorker] = useState<ModelId>('sonnet');
  const [cache, setCache] = useState(false);

  const row = EFFORT_ROWS.find((r) => r.id === rowId)!;
  const pick = (id: (typeof EFFORT_ROWS)[number]['id']) => {
    const r = EFFORT_ROWS.find((x) => x.id === id)!;
    setRowId(id);
    setWorkers(r.workers);
    setCalls(r.calls);
  };

  const mine = runCost({ workers, calls, lead, worker, cache });
  const rule = runCost({ workers: row.workers, calls: row.calls, lead, worker, cache });
  const ok = inBand(row, workers, calls);
  const ratio = mine.totalUsd / rule.totalUsd;
  const parts = [
    { id: 'workers', label: 'Subagent tokens', v: mine.workerUsd, color: 'var(--accent)' },
    { id: 'search', label: 'Search fees', v: mine.searchUsd, color: 'var(--warn)' },
    { id: 'lead', label: 'Lead agent', v: mine.leadUsd, color: 'var(--ok)' },
    { id: 'cite', label: 'Citation pass', v: mine.citeUsd, color: 'var(--muted)' },
  ];

  return (
    <CacheWidgetFrame title="Effort-scaling rule table" hint="Prices are live. Everything else is illustrative.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Query type:</span>
        <Seg label="Query type" value={rowId} options={EFFORT_ROWS.map((r) => ({ id: r.id, label: r.label }))} onChange={pick} />
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm" data-testid="ef-table">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1 pr-2 font-normal">Query</th>
              <th className="py-1 pr-2 font-normal">Rule (Anthropic)</th>
              <th className="py-1 pr-2 font-normal">We price</th>
              <th className="py-1 pr-2 text-right font-normal">Cost per run</th>
              <th className="py-1 text-right font-normal">Wall-clock</th>
            </tr>
          </thead>
          <tbody>
            {EFFORT_ROWS.map((r) => {
              const x = runCost({ workers: r.workers, calls: r.calls, lead, worker, cache });
              const on = r.id === rowId;
              return (
                <tr key={r.id} className="border-b border-line" style={{ background: on ? 'var(--accent-soft)' : undefined }}>
                  <td className="py-1.5 pr-2">{r.label}</td>
                  <td className="py-1.5 pr-2 text-muted">{r.rule}</td>
                  <td className="py-1.5 pr-2 tabular-nums">{`${r.workers} x ${r.calls} calls`}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums" data-testid={`ef-cost-${r.id}`}>{usd(x.totalUsd)}</td>
                  <td className="py-1.5 text-right tabular-nums">{secs(x.parallelS)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ef-w" className="mb-1 flex justify-between text-xs text-muted">
            <span>Subagents</span>
            <span className="tabular-nums text-fg" data-testid="ef-workers">{workers}</span>
          </label>
          <input id="ef-w" type="range" min={1} max={MAX_WORKERS} step={1} value={workers} onChange={(e) => setWorkers(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="ef-c" className="mb-1 flex justify-between text-xs text-muted">
            <span>Tool calls per subagent</span>
            <span className="tabular-nums text-fg" data-testid="ef-calls">{calls}</span>
          </label>
          <input id="ef-c" type="range" min={1} max={MAX_CALLS} step={1} value={calls} onChange={(e) => setCalls(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-muted">Lead:</span>
          <Seg label="Lead model" value={lead} options={LEADS.map((m) => ({ id: m, label: PRICES[m].name.replace('Claude ', '') }))} onChange={setLead} />
        </span>
        <span className="flex items-center gap-2">
          <span className="text-muted">Subagents:</span>
          <Seg label="Subagent model" value={worker} options={WORKERS.map((m) => ({ id: m, label: PRICES[m].name.replace('Claude ', '') }))} onChange={setWorker} />
        </span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cache} onChange={(e) => setCache(e.target.checked)} className="accent-[var(--accent)]" data-testid="ef-cache" />
          <span className="text-muted">Prompt caching, every hit</span>
        </label>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: ok ? 'var(--ok)' : 'var(--bad)' }} aria-live="polite">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }} data-testid="ef-verdict">
            {ok ? `Inside the rule for "${row.label.toLowerCase()}".` : `Outside the rule for "${row.label.toLowerCase()}": ${ratio >= 1 ? `${ratio.toFixed(1)}x` : `${ratio.toFixed(2)}x`} the rule price.`}
          </span>
          <span className="font-semibold tabular-nums" data-testid="ef-total">{usd(mine.totalUsd)} per run</span>
        </div>
        <div className="flex h-5 w-full overflow-hidden rounded" role="img" aria-label="Share of the run cost by part">
          {parts.map((p) => (
            <div key={p.id} title={`${p.label}: ${usd(p.v)}`} style={{ width: `${(p.v / mine.totalUsd) * 100}%`, background: p.color, opacity: 0.8 }} />
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {parts.map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {p.label} <span className="tabular-nums text-fg">{usd(p.v)}</span>
            </span>
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Tokens</dt>
            <dd className="tabular-nums" data-testid="ef-tokens">{fmt(mine.tokens)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Times a 5,000-token chat</dt>
            <dd className="tabular-nums" data-testid="ef-chatx">{fmt(Math.round(mine.chatMultiple))}x</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Searches</dt>
            <dd className="tabular-nums" data-testid="ef-searches">{mine.searches}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Wall-clock, parallel / one by one</dt>
            <dd className="tabular-nums" data-testid="ef-time">{secs(mine.parallelS)} / {secs(mine.serialS)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Prices as of 2026-10-20 (Anthropic pricing page): web search $10 per 1,000 searches, plus the tokens. Model: a subagent starts with 3,000 tokens, each tool call adds 3,300 (a 3,000-token result and 300 tokens it wrote), and every call re-reads the whole context. It returns 1,500 tokens. The lead writes a plan (2,000 in, 1,000 out), then merges (3,000 + 1,500 per subagent in, 3,000 out). A citation pass reads the report and 1,500 tokens per source. One call takes 8 s. The quoted bands come from Anthropic. The 15 calls for complex research and the token sizes are ours. Caching assumes every read hits. A 5,000-token chat ({fmt(CHAT_IN)} in, {fmt(CHAT_OUT)} out) is the unit for the "times a chat" line. Real hit rates are lower.
      </p>
    </CacheWidgetFrame>
  );
}

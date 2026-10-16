import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { A, WINDOW, queryCost } from './Ai5GraphMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const money = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);

/** Cost per query: put the whole corpus in the prompt, or retrieve a few chunks. */
export default function Ai5GraphCalc() {
  const [logC, setLogC] = useState(5.7);
  const [rag, setRag] = useState(5000);
  const [logQ, setLogQ] = useState(2);
  const corpus = Math.round(Math.pow(10, logC) / 1000) * 1000;
  const n = Math.round(Math.pow(10, logQ));
  const c = queryCost(corpus, rag, n);
  const bar = (v: number, tone: string, id: string, label: string) => (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="text-muted">{label}</span><span className="tabular-nums" data-testid={id}>{c.fits || id === 'a5g-rag' ? money(v) : 'does not fit'}</span></div>
      <div className="h-3 rounded bg-surface"><div className="h-3 rounded" style={{ width: `${Math.max(1, Math.min(100, (v / c.uncached) * 100))}%`, background: tone }} /></div>
    </div>
  );
  return (
    <CacheWidgetFrame title="Long context or RAG: cost per query" hint="Sonnet 5.5, as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a5g-c" className="mb-1 flex justify-between text-xs text-muted"><span>Corpus size (tokens)</span><span className="tabular-nums text-fg">{num(corpus)}</span></label>
            <input id="a5g-c" type="range" min={4} max={6.3} step={0.05} value={logC} onChange={(e) => setLogC(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5g-r" className="mb-1 flex justify-between text-xs text-muted"><span>Tokens retrieved per query (RAG)</span><span className="tabular-nums text-fg">{num(rag)}</span></label>
            <input id="a5g-r" type="range" min={1000} max={20000} step={500} value={rag} onChange={(e) => setRag(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5g-q" className="mb-1 flex justify-between text-xs text-muted"><span>Queries inside one cache window</span><span className="tabular-nums text-fg">{num(n)}</span></label>
            <input id="a5g-q" type="range" min={0} max={3} step={0.1} value={logQ} onChange={(e) => setLogQ(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <p className="text-xs text-muted">Window limit: {num(WINDOW)} tokens. {c.fits ? '' : 'This corpus does not fit in one prompt.'}</p>
        </div>
        <div className="space-y-3">
          {bar(c.uncached, 'var(--bad)', 'a5g-unc', 'Whole corpus, no cache')}
          {bar(c.cached, 'var(--warn)', 'a5g-cac', 'Whole corpus, cached')}
          {bar(c.rag, 'var(--ok)', 'a5g-rag', 'RAG: retrieved chunks')}
          <div className="rounded-lg border border-line bg-surface p-2.5 text-sm">
            Ratio, uncached to RAG: <span className="font-semibold tabular-nums" data-testid="a5g-ratio">{(c.uncached / c.rag).toFixed(0)}x</span>. Per 1,000 queries, RAG: <span className="tabular-nums" data-testid="a5g-k">{money(c.rag * 1000)}</span>.
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Model (ours): per query, input tokens x $2 per 1M, plus {A.question} question tokens and {A.answer} answer tokens at $10 per 1M. Cached: corpus read at $0.10 per 1M on every query, plus the $2.50 per 1M cache write spread over the queries in one window (the cache lives 5 minutes by default, so queries must arrive inside it). RAG excludes embedding and index cost. Retrieval and cache lookups add time that is not modeled. Cost says nothing about answer quality: a 500K-token prompt can lose facts in the middle, and top-k retrieval can miss them.
      </p>
    </CacheWidgetFrame>
  );
}

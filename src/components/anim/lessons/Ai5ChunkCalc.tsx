import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { CTX, chunkStats, contextCost } from './Ai5ChunkMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);

/** Chunk size and overlap against chunk count, duplicated tokens, and index cost. */
export default function Ai5ChunkCalc() {
  const [chunk, setChunk] = useState(800);
  const [overlap, setOverlap] = useState(0);
  const [logC, setLogC] = useState(8.3);
  const [ctx, setCtx] = useState(false);
  const corpus = Math.round(Math.pow(10, logC));
  const ov = Math.min(overlap, chunk - 1);
  const st = chunkStats(corpus, chunk, ov, ctx);
  const cc = ctx ? contextCost(corpus, chunk, ov) : 0;
  return (
    <CacheWidgetFrame title="Chunk size, overlap and index cost" hint="prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a5c-s" className="mb-1 flex justify-between text-xs text-muted"><span>Chunk size (tokens)</span><span className="tabular-nums text-fg">{num(chunk)}</span></label>
            <input id="a5c-s" type="range" min={100} max={2000} step={50} value={chunk} onChange={(e) => setChunk(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5c-o" className="mb-1 flex justify-between text-xs text-muted"><span>Overlap (tokens)</span><span className="tabular-nums text-fg">{num(ov)}</span></label>
            <input id="a5c-o" type="range" min={0} max={Math.min(1000, chunk - 50)} step={50} value={ov} onChange={(e) => setOverlap(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5c-c" className="mb-1 flex justify-between text-xs text-muted"><span>Corpus size (tokens)</span><span className="tabular-nums text-fg">{num(corpus)}</span></label>
            <input id="a5c-c" type="range" min={6} max={9} step={0.05} value={logC} onChange={(e) => setLogC(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={ctx} onChange={(e) => setCtx(e.target.checked)} className="accent-[var(--accent)]" />
            Add a {CTX.add}-token context prefix to each chunk
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Chunks</div><div className="text-lg font-semibold tabular-nums" data-testid="a5c-n">{num(st.chunks)}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Tokens embedded</div><div className="text-lg font-semibold tabular-nums" data-testid="a5c-emb">{num(st.embedded)}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Repeated by overlap</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a5c-dup">{num(st.duplicated)}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Embedding cost</div><div className="text-lg font-semibold tabular-nums" data-testid="a5c-ecost">{money(st.embedCost)}</div></div>
          <div className="col-span-2 rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Context step, one time</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--ok)' }} data-testid="a5c-ctx">{ctx ? money(cc) : 'off'}</div></div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Model (ours): chunks = corpus / (size - overlap), rounded up. Embedding price is OpenAI text-embedding-3-small, $0.02 per 1M tokens. The context step follows Anthropic's example: {num(CTX.doc)}-token documents, a {CTX.instr}-token instruction, {CTX.add} tokens of output per chunk, the document held in the prompt cache. It is priced here at Claude Haiku 5.5 rates ($0.10 in, $0.50 out, $0.125 cache write, $0.01 cache read per 1M tokens), so it will not match the post's $1.02 per million, which used older prices. The calculator shows cost only. Recall depends on your data: measure it.
      </p>
    </CacheWidgetFrame>
  );
}

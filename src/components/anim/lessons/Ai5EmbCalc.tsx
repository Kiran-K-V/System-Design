import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { EMB_MODELS, embedCost, storageBytes, vectorBytes } from './Ai5EmbMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);
const gb = (b: number) => (b >= 1e12 ? `${(b / 1e12).toFixed(2)} TB` : `${(b / 1e9).toFixed(1)} GB`);

/** Model chooser: corpus size, model, dimensions -> storage and embedding cost. */
export default function Ai5EmbCalc() {
  const [modelId, setModelId] = useState('small');
  const [logN, setLogN] = useState(7.7);
  const [tok, setTok] = useState(500);
  const [dimsPick, setDimsPick] = useState(1536);

  const m = EMB_MODELS.find((x) => x.id === modelId)!;
  const dims = m.shortenable ? Math.min(dimsPick, m.defaultDims) : m.defaultDims;
  const n = Math.round(Math.pow(10, logN));
  const cost = embedCost(n, tok, m.price);
  const bytes = storageBytes(n, dims);

  return (
    <CacheWidgetFrame title="Model chooser: storage and cost" hint="OpenAI prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a5e-m" className="mb-1 block text-xs text-muted">Model</label>
            <select id="a5e-m" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {EMB_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.name}: ${x.price} per 1M tokens, {x.defaultDims} dims</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a5e-n" className="mb-1 flex justify-between text-xs text-muted"><span>Chunks in the corpus</span><span className="tabular-nums text-fg">{num(n)}</span></label>
            <input id="a5e-n" type="range" min={4} max={9} step={0.05} value={logN} onChange={(e) => setLogN(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5e-t" className="mb-1 flex justify-between text-xs text-muted"><span>Tokens per chunk</span><span className="tabular-nums text-fg">{num(tok)}</span></label>
            <input id="a5e-t" type="range" min={100} max={2000} step={50} value={tok} onChange={(e) => setTok(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5e-d" className="mb-1 flex justify-between text-xs text-muted"><span>Dimensions kept {m.shortenable ? '(dimensions parameter)' : '(fixed for this model)'}</span><span className="tabular-nums text-fg">{dims}</span></label>
            <input id="a5e-d" type="range" min={64} max={3072} step={64} disabled={!m.shortenable} value={dims} onChange={(e) => setDimsPick(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Bytes per vector (float32)</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a5e-bytes">{num(vectorBytes(dims))}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Vector storage</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a5e-store">{gb(bytes)}</div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Tokens to embed</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a5e-tokens">{(n * tok / 1e9).toFixed(2)}B</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Cost to embed once</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a5e-cost">{money(cost)}</div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Switching models means paying the cost again for the whole corpus, because old and new vectors cannot be compared. Storage counts vectors only, with no index and no replicas. Cost is list price, with no retries, no rate-limit wait, and no batch discount.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

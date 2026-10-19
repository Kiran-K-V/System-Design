import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { UBER_LIMIT, allGoldRecall, inputCostUsd, kForRecall, promptTokens, singleRecall, tokensPerTable, type Detail } from './Ai13SqlMath';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Schema retrieval simulator: top-k tables vs the chance all gold tables arrive vs prompt tokens. */
export default function Ai13SqlKSlider() {
  const [n, setN] = useState(10000);
  const [k, setK] = useState(7);
  const [p, setP] = useState(0.7);
  const [gold, setGold] = useState(3);
  const [detail, setDetail] = useState<Detail>('documented');

  const r = { n, p, meanRank: 5, gold };
  const single = singleRecall(r, k);
  const all = allGoldRecall(r, k);
  const tokens = promptTokens(k, detail);
  const cost = inputCostUsd(tokens);
  const ceiling = Math.pow(p, gold);
  const need = kForRecall(r, 0.8, Math.min(n, 200));
  const over = tokens > UBER_LIMIT;
  const scale = Math.max(tokens, UBER_LIMIT) * 1.05;

  return (
    <CacheWidgetFrame title="Schema retrieval: k, recall, and prompt size" hint="Illustrative model">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <Seg label="Tables in the warehouse" value={n} options={[{ id: 200, label: '200 tables' }, { id: 2000, label: '2,000' }, { id: 10000, label: '10,000' }]} onChange={setN} />
        <Seg
          label="Detail per table"
          value={detail}
          options={[
            { id: 'bare', label: 'Bare DDL (450 tokens)' },
            { id: 'documented', label: 'Documented (6,000)' },
            { id: 'pruned', label: 'Pruned to 8 cols (1,600)' },
          ]}
          onChange={setDetail}
        />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="a13sq-k" className="mb-1 flex justify-between text-xs text-muted">
            <span>Tables sent to the model (k)</span>
            <span className="tabular-nums text-fg">{k}</span>
          </label>
          <input id="a13sq-k" type="range" min={1} max={100} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a13sq-p" className="mb-1 flex justify-between text-xs text-muted">
            <span>Tables with good descriptions</span>
            <span className="tabular-nums text-fg">{pct(p)}</span>
          </label>
          <input id="a13sq-p" type="range" min={30} max={100} step={5} value={Math.round(p * 100)} onChange={(e) => setP(+e.target.value / 100)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a13sq-g" className="mb-1 flex justify-between text-xs text-muted">
            <span>Tables the query needs</span>
            <span className="tabular-nums text-fg">{gold}</span>
          </label>
          <input id="a13sq-g" type="range" min={1} max={6} value={gold} onChange={(e) => setGold(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-3">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">All needed tables arrive</span>
            <span className="font-semibold tabular-nums" data-testid="sq-all">{pct(all)}</span>
          </div>
          <div className="relative h-5 rounded bg-line" role="img" aria-label={`Chance that every needed table is in the top ${k}: ${pct(all)}`}>
            <div className="absolute h-full rounded" style={{ width: `${all * 100}%`, background: all >= 0.8 ? 'var(--ok)' : all >= 0.5 ? 'var(--warn)' : 'var(--bad)', opacity: 0.85 }} />
            <div className="absolute top-[-3px] h-7 border-l-2 border-dashed" style={{ left: `${Math.min(ceiling, 1) * 100}%`, borderColor: 'var(--fg)' }} title="Ceiling set by descriptions" />
          </div>
          <p className="mt-2 text-xs text-muted">
            One table: <span className="tabular-nums text-fg" data-testid="sq-single">{pct(single)}</span>. Dashed line: ceiling set by descriptions, about <span className="tabular-nums text-fg">{pct(ceiling)}</span>. More k cannot lift you far past it.
          </p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: over ? 'var(--bad)' : 'var(--border)' }}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">Prompt size</span>
            <span className="font-semibold tabular-nums" data-testid="sq-tokens">{fmt(tokens)} tokens</span>
          </div>
          <div className="relative h-5 rounded bg-line" role="img" aria-label={`Prompt of ${fmt(tokens)} tokens against a 32,000 token marker`}>
            <div className="absolute h-full rounded" style={{ width: `${(tokens / scale) * 100}%`, background: over ? 'var(--bad)' : 'var(--accent)', opacity: 0.85 }} />
            <div className="absolute top-[-3px] h-7 border-l-2 border-dashed" style={{ left: `${(UBER_LIMIT / scale) * 100}%`, borderColor: 'var(--fg)' }} title="32K" />
          </div>
          <p className="mt-2 text-xs text-muted">
            Dashed line: the 32K limit Uber's call had. Input cost at $2 per million tokens: <span className="tabular-nums text-fg" data-testid="sq-cost">${cost.toFixed(3)}</span> per question.
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm" data-testid="sq-note">
        {need === null
          ? `At this metadata quality, no k up to ${Math.min(n, 200)} reaches 80%. Fix the descriptions, not k.`
          : `To reach 80% you need k = ${need}, which is ${fmt(promptTokens(need, detail))} tokens (${fmt(need * tokensPerTable(detail))} for the tables alone).`}
      </p>
      <p className="mt-3 text-sm text-muted">
        Model, all assumptions illustrative: a needed table is findable with the probability shown (its description matches the question), and then its rank is geometric with mean 5. Otherwise its rank is uniform over all tables. Ranks are independent, which is pessimistic, because tables that join to a found table can be pulled in. Tokens: 30 columns per table; 15 tokens per bare column; 200 per documented column (derived from Uber, see text); 2,000 fixed tokens for instructions and the question.
      </p>
    </CacheWidgetFrame>
  );
}

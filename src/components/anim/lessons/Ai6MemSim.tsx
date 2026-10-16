import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { loadAll, retrieve, storeSize, type MemInput } from './Ai6MemMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const usd = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(3)}`);

function Slider({ id, label, value, min, max, step, onChange, suffix = '' }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{num(value)}{suffix}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const PRICES = [
  { id: 'haiku', label: 'Haiku 5.5 ($0.10)', v: 0.1 },
  { id: 'sonnet', label: 'Sonnet 5.5 ($2)', v: 2 },
  { id: 'opus', label: 'Opus 5.5 ($4)', v: 4 },
] as const;

export default function Ai6MemSim() {
  const [writes, setWrites] = useState(5);
  const [days, setDays] = useState(60);
  const [tokens, setTokens] = useState(150);
  const [relevant, setRelevant] = useState(3);
  const [k, setK] = useState(5);
  const [recall, setRecall] = useState(80);
  const [price, setPrice] = useState<(typeof PRICES)[number]['id']>('sonnet');
  const input: MemInput = { writesPerDay: writes, retentionDays: days, tokensPerNote: tokens, relevant, k, recall: recall / 100, price: PRICES.find((p) => p.id === price)!.v };
  const all = loadAll(input);
  const top = retrieve(input);
  const rows = [
    { name: 'Load every note', r: all },
    { name: `Retrieve top ${k}`, r: top },
  ];
  return (
    <CacheWidgetFrame title="Memory size, retrieval, and context cost" hint="A toy model. Every input is an assumption you set.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="a67-w" label="Notes written per day" value={writes} min={1} max={40} step={1} onChange={setWrites} />
          <Slider id="a67-d" label="Days before a note expires" value={days} min={7} max={720} step={1} onChange={setDays} />
          <Slider id="a67-t" label="Tokens per note" value={tokens} min={50} max={500} step={10} onChange={setTokens} />
          <Slider id="a67-r" label="Notes that matter for this request" value={relevant} min={1} max={6} step={1} onChange={setRelevant} />
          <Slider id="a67-k" label="Notes the retriever returns (k)" value={k} min={1} max={20} step={1} onChange={setK} />
          <Slider id="a67-c" label="Chance a relevant note is in the top k (assumed)" value={recall} min={30} max={100} step={5} onChange={setRecall} suffix="%" />
          <Seg label="Model price" value={price} onChange={setPrice} options={PRICES.map((p) => ({ id: p.id, label: p.label }))} />
        </div>
        <div className="space-y-2 self-start" aria-live="polite">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Notes in the store</div>
            <div className="text-lg font-semibold tabular-nums">{num(storeSize(input))}</div>
            <div className="text-xs text-muted">{writes} per day x {days} days kept</div>
          </div>
          {rows.map(({ name, r }) => (
            <div key={name} className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">{name}</div>
              <div className="grid grid-cols-2 gap-x-3 text-sm tabular-nums">
                <span>Context tokens</span><span className="text-right font-semibold">{num(r.tokens)}</span>
                <span>Precision</span><span className="text-right font-semibold">{pct(r.precision)}</span>
                <span>Recall</span><span className="text-right font-semibold">{pct(r.recall)}</span>
                <span>Per 1,000 requests</span><span className="text-right font-semibold" style={{ color: 'var(--accent)' }}>{usd(r.per1k)}</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted">Load every note: tokens = notes x tokens per note, precision = matters / notes. Retrieve: tokens = k x tokens per note, found = min(matters, k) x chance. Input tokens only.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

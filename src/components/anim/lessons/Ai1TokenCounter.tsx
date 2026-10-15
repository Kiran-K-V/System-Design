import { useState } from 'react';
import { ESTIMATORS, LANGUAGES, estimate, wordCount } from './Ai1TokenMath';

const SAMPLES = [
  { label: 'Support ticket', text: 'Hi, I ordered a pair of running shoes last week and the tracking page still says "label created". Can you tell me where my package is and when it will arrive?' },
  { label: 'Short question', text: 'What is the capital of France?' },
  { label: 'Policy paragraph', text: 'Refunds are available within 30 days of purchase for items in their original condition. Digital goods are refundable only if they have not been downloaded. Shipping fees are not refunded unless the item arrived damaged.' },
];

const PRICES = [
  { id: 'sonnet', label: 'Claude Sonnet 5.5 input', price: 2 },
  { id: 'haiku', label: 'Claude Haiku 5.5 input (prompts up to 100K)', price: 0.1 },
];

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString('en-US') : (Math.round(n * 10) / 10).toLocaleString('en-US'));
const money = (n: number) => (n < 0.01 ? `$${n.toPrecision(2)}` : `$${n.toFixed(4)}`);

export default function Ai1TokenCounter() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [est, setEst] = useState('llama3');
  const [price, setPrice] = useState('sonnet');
  const [reqs, setReqs] = useState(1_000_000);
  const e = ESTIMATORS.find((x) => x.id === est)!;
  const p = PRICES.find((x) => x.id === price)!;
  const rows = LANGUAGES.map((l) => ({ l, r: estimate(text, e, l, p.price) }));
  const en = rows[0].r;
  const chars = text.length;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="token-counter">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Token counter and cost estimator</span>
        <span className="text-xs text-muted">estimate from sourced ratios, not a real tokenizer</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button key={s.label} type="button" onClick={() => setText(s.text)} className="rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-surface">
            {s.label}
          </button>
        ))}
      </div>
      <label htmlFor="tc-text" className="mb-1 block text-xs text-muted">
        English text (the other rows assume the same message translated)
      </label>
      <textarea id="tc-text" value={text} onChange={(ev) => setText(ev.target.value)} rows={4} className="w-full rounded-lg border border-line bg-bg p-2.5 text-[14px]" />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted">
          Ratio source
          <select value={est} onChange={(ev) => setEst(ev.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {ESTIMATORS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Price (as of 2026-10-15)
          <select value={price} onChange={(ev) => setPrice(ev.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {PRICES.map((x) => (
              <option key={x.id} value={x.id}>{x.label}: ${x.price} / M tokens</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Requests per month
          <input type="number" min={1} value={reqs} onChange={(ev) => setReqs(Math.max(1, +ev.target.value || 1))} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg" />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">{e.source}.</p>
      <p className="mt-2 text-xs text-muted tabular-nums" data-testid="tc-meta">
        {chars} characters, {wordCount(text)} words, about {en.baseTokens > 0 ? (chars / en.baseTokens).toFixed(2) : '0'} characters per English token.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-[13px] tabular-nums" data-testid="tc-table">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1.5 pr-3 font-medium">Same message in</th>
              <th className="pr-3 font-medium">Token factor</th>
              <th className="pr-3 font-medium">Tokens</th>
              <th className="pr-3 font-medium">Cost per request</th>
              <th className="font-medium">Cost per month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, r }) => (
              <tr key={l.id} className="border-b border-line/50">
                <td className="py-1.5 pr-3">{l.label}</td>
                <td className="pr-3 text-muted">{l.note}</td>
                <td className="pr-3">{fmt(r.tokens)}</td>
                <td className="pr-3">{money(r.cost)}</td>
                <td className={l.factor > 1 ? 'text-warn' : ''}>${fmt(r.cost * reqs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        Language factors: median tokens per message vs English, cl100k_base, 2023, 2,033 texts per language (TopBots). Newer tokenizers can differ. Code and numbers have no sourced ratio here: measure with your tokenizer.
      </p>
    </div>
  );
}

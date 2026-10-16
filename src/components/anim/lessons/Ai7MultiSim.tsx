import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CHAT_TOKENS, PRICES, compare, dollars } from './Ai7MultiMath';

const VERDICT = {
  multi: { label: 'Multi-agent can pay off', color: 'var(--ok)', text: 'Most steps do not depend on each other. Subagents can work apart and one lead can merge the results. Do it only if the answer is worth about 15x the tokens of a chat turn.' },
  mixed: { label: 'Start with one agent', color: 'var(--warn)', text: 'Some parts are independent, but many steps share decisions. Use one agent for the core. Add a read-only subagent for side questions, and send back only a short summary.' },
  single: { label: 'Use one agent', color: 'var(--bad)', text: 'Steps depend on each other. Parallel subagents would make conflicting choices that a lead must repair. One agent with a full trace keeps decisions consistent.' },
};

const money = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(3)}`);

/** Task coupling slider: recommendation, token cost, and time. Illustrative model. */
export default function Ai7MultiSim() {
  const [coupling, setCoupling] = useState(10);
  const [subs, setSubs] = useState(4);
  const [price, setPrice] = useState('sonnet55');
  const [chat, setChat] = useState(10);

  const px = PRICES.find((p) => p.id === price)!;
  const r = compare(coupling / 100, subs, chat * 1000);
  const v = VERDICT[r.verdict];

  return (
    <CacheWidgetFrame title="Single agent or multi-agent?" hint="illustrative model. The 4x and 15x ratios are Anthropic's averages, not your task's">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a76-c" className="mb-1 flex justify-between text-xs text-muted">
              <span>Task coupling (0 = independent parts, 100 = every step depends on the last)</span>
              <span className="tabular-nums text-fg">{coupling}%</span>
            </label>
            <input id="a76-c" type="range" min={0} max={100} step={5} value={coupling} onChange={(e) => setCoupling(+e.target.value)} className="w-full accent-[var(--accent)]" />
            <div className="mt-1 flex justify-between text-xs text-muted"><span>wide web research</span><span>refactor one module</span></div>
          </div>
          <div>
            <label htmlFor="a76-k" className="mb-1 flex justify-between text-xs text-muted">
              <span>Parallel subagents</span>
              <span className="tabular-nums text-fg">{subs}</span>
            </label>
            <input id="a76-k" type="range" min={2} max={10} step={1} value={subs} onChange={(e) => setSubs(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a76-t" className="mb-1 flex justify-between text-xs text-muted">
              <span>Tokens in one chat turn on this task</span>
              <span className="tabular-nums text-fg">{chat}K</span>
            </label>
            <input id="a76-t" type="range" min={2} max={50} step={1} value={chat} onChange={(e) => setChat(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Price</span>
            <Seg label="Price" value={price} onChange={setPrice} options={PRICES.map((p) => ({ id: p.id, label: `${p.name} $${p.input}` }))} />
          </div>
          <p className="text-xs text-muted">
            Model: the coupled share stays serial and the rest splits over the subagents, so time = c + (1 - c) / k. Verdict: multi at 30% or less, one agent at 60% or more. Those cut-offs are a teaching rule. All tokens are priced at the input rate, so this is a floor.
          </p>
        </div>
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-lg border p-3" style={{ borderColor: v.color }}>
            <div className="font-medium" style={{ color: v.color }}>{v.label}</div>
            <p className="mt-1">{v.text}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">One agent (4x)</div>
              <div className="font-semibold tabular-nums">{(r.singleTokens / 1000).toFixed(0)}K</div>
              <div className="text-xs tabular-nums text-muted">{money(dollars(r.singleTokens, px.input))}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Multi-agent (15x)</div>
              <div className="font-semibold tabular-nums">{(r.multiTokens / 1000).toFixed(0)}K</div>
              <div className="text-xs tabular-nums text-muted">{money(dollars(r.multiTokens, px.input))}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Time vs one agent</div>
              <div className="font-semibold tabular-nums">{Math.round(r.timeRatio * 100)}%</div>
              <div className="text-xs tabular-nums text-muted">{Math.round(r.saved * 100)}% saved</div>
            </div>
          </div>
          <p className="text-xs text-muted">
            Extra tokens: {(r.multiTokens / r.singleTokens).toFixed(2)}x one agent for {Math.round(r.saved * 100)}% less time. A chat turn is {CHAT_TOKENS.toLocaleString('en-US')} tokens by default; change it above.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

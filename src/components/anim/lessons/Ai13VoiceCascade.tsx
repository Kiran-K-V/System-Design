import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HIGH, HUMAN_REVIEW_USD, ITEMS_PER_DAY, LLM_CALL_USD, LOWS, PREVALENCE, evaluate } from './Ai13VoiceModMath';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function Chart({ title, values, color, idx, unit }: { title: string; values: number[]; color: string; idx: number; unit: string }) {
  const max = Math.max(...values);
  return (
    <div>
      <div className="mb-1 text-xs text-muted">{title}</div>
      <div className="flex h-20 items-end gap-1" role="img" aria-label={title}>
        {values.map((v, i) => (
          <div key={i} className="flex h-full flex-1 items-end" title={`${LOWS[i]}: ${fmt(v)} ${unit}`}>
            <div className="w-full rounded-t" style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: i === idx ? 1 : 0.4, outline: i === idx ? '2px solid var(--accent)' : 'none' }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[11px] tabular-nums text-muted">
        {LOWS.map((l) => (
          <span key={l} className="flex-1 text-center">{l}</span>
        ))}
      </div>
    </div>
  );
}

/** Moderation cascade: where the cheap classifier hands items to the LLM, against review load, cost, and misses. Illustrative. */
export default function Ai13VoiceCascade() {
  const [idx, setIdx] = useState(3);
  const rows = LOWS.map((l) => evaluate(l));
  const r = rows[idx];
  const harmful = ITEMS_PER_DAY * PREVALENCE;
  const recall = 1 - r.missed / harmful;

  return (
    <CacheWidgetFrame title="Moderation cascade: where the LLM band starts" hint="Illustrative inputs. Move the slider.">
      <div className="mb-4">
        <label htmlFor="a13c-t" className="mb-1 flex justify-between text-xs text-muted">
          <span>Items with a classifier score at or above this go to the LLM</span>
          <span className="tabular-nums text-fg">{LOWS[idx]}</span>
        </label>
        <input id="a13c-t" type="range" min={0} max={LOWS.length - 1} step={1} value={idx} onChange={(e) => setIdx(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }} aria-live="polite">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Sent to the LLM per day</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-llm">{fmt(r.toLlm)} ({(r.llmShare * 100).toFixed(1)}%)</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Human reviews per day</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-human">{fmt(r.toHuman)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Harmful items still online per day</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-missed">{fmt(r.missed)} of {fmt(harmful)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Recall</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-recall">{(recall * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">LLM cost per day</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-llm-usd">{usd(r.llmUsd)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Human review cost per day</dt>
            <dd className="font-semibold tabular-nums" data-testid="cs-human-usd">{usd(r.humanUsd)}</dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Chart title="Human reviews per day at each setting" values={rows.map((x) => x.toHuman)} color="var(--warn)" idx={idx} unit="reviews" />
          <Chart title="Harmful items still online per day at each setting" values={rows.map((x) => x.missed)} color="var(--bad)" idx={idx} unit="missed" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model, all illustrative: {fmt(ITEMS_PER_DAY)} items a day, {(PREVALENCE * 100).toFixed(1)}% harmful. Items scoring {HIGH} or more are removed with no review. Between the slider value and {HIGH}, the LLM allows, removes, or says unsure: for a harmless item 93%, 1%, 6%; for a harmful item 5%, 80%, 15%. Unsure items go to a person, who is assumed always right. An LLM call is 1,700 tokens in and 30 out on Claude Haiku 5.5, so ${LLM_CALL_USD.toFixed(6)} a call (list price as of 2026-10-20). A human review is assumed to cost ${HUMAN_REVIEW_USD.toFixed(2)}, which is not from a source.
      </p>
    </CacheWidgetFrame>
  );
}

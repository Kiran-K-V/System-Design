import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { STAGES, TARGET_P50, TARGET_P95, biggest, sum, verdict } from './Ai12SpeechMath';

const COLORS = ['var(--accent)', 'var(--warn)', 'var(--muted)', 'var(--fg)', 'var(--ok)', 'var(--border)'];

function Slider({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value} ms</span>
      </label>
      <input id={id} type="range" min={0} max={max} step={10} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

type Mode = 'p50' | 'p95';

/** Budget builder: one slider per stage, total against the vendor target. Defaults are the ElevenLabs table. */
export default function Ai12SpeechBudget() {
  const [mode, setMode] = useState<Mode>('p50');
  const [ms, setMs] = useState<number[]>(STAGES.map((s) => s.p50));
  const target = mode === 'p50' ? TARGET_P50 : TARGET_P95;
  const total = sum(ms);
  const v = verdict(total, target);
  const big = biggest(ms);
  const scale = Math.max(total, target) * 1.05;
  const tone = v.ok ? 'var(--ok)' : 'var(--bad)';

  const pick = (m: Mode) => {
    setMode(m);
    setMs(STAGES.map((s) => (m === 'p50' ? s.p50 : s.p95)));
  };

  let start = 0;
  return (
    <CacheWidgetFrame title="Voice latency budget builder" hint="Defaults: ElevenLabs illustrative ranges">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg
          label="Percentile"
          value={mode}
          options={[
            { id: 'p50', label: 'P50 (target 800 ms)' },
            { id: 'p95', label: 'P95 (target 1,500 ms)' },
          ]}
          onChange={pick}
        />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {STAGES.map((s, k) => (
          <Slider key={s.id} id={`a12sp-${s.id}`} label={s.label} value={ms[k]} max={s.max} onChange={(x) => setMs(ms.map((m, i) => (i === k ? x : m)))} />
        ))}
      </div>
      <div className="rounded-lg border p-3" style={{ borderColor: tone }} aria-live="polite">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: tone }} data-testid="sp-verdict">
            {v.ok ? `Under target by ${v.slack} ms` : `Over target by ${-v.slack} ms`}
          </span>
          <span className="font-semibold tabular-nums" data-testid="sp-total">
            {total} ms of {target} ms
          </span>
        </div>
        <div className="relative h-6 rounded bg-line" role="img" aria-label={`Time to first audio ${total} milliseconds against a target of ${target}`}>
          {ms.map((m, k) => {
            const left = (start / scale) * 100;
            start += m;
            return <div key={STAGES[k].id} className="absolute h-full" style={{ left: `${left}%`, width: `${(m / scale) * 100}%`, background: COLORS[k], opacity: 0.85 }} title={`${STAGES[k].label}: ${m} ms`} />;
          })}
          <div className="absolute top-[-4px] h-8 border-l-2 border-dashed" style={{ left: `${(target / scale) * 100}%`, borderColor: 'var(--fg)' }} title={`Target ${target} ms`} />
        </div>
        <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
          {STAGES.map((s, k) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[k] }} />
              {s.label}: <span className="tabular-nums text-fg">{ms[k]} ms</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted" data-testid="sp-big">
          Largest stage: {STAGES[big.index].label}, {Math.round(big.share * 100)}% of the total.
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: time to first audio is the sum of the six stages, each taken as the time to its first output. The dashed line is the target. Defaults are the ElevenLabs table; the page calls them illustrative ranges, not guarantees. Summing percentiles is a planning shortcut. If stage delays are independent, the true P95 of the total is lower than the sum of the stage P95 values, because all stages are rarely slow in the same turn. If they are linked, for example by one overloaded server, it is not. That is statistics, not a figure from the source.
      </p>
    </CacheWidgetFrame>
  );
}

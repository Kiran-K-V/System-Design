import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { addedMs, firstVisibleMs, totalMs, type LatencySetup } from './Ai14LinkedinMath';

const X0 = 170;
const X1 = 690;
const px = (ms: number, max: number) => (ms / max) * (X1 - X0);
const sec = (ms: number) => `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)} s`;

function Run({ s, y, label, max }: { s: LatencySetup; y: number; label: string; max: number }) {
  const wT = px(s.ttftMs, max);
  const wH = px(s.hiddenTokens * s.tbtMs, max);
  const wA = px(s.answerTokens * s.tbtMs, max);
  const seg = (start: number, w: number, tone: string, key: string) =>
    w > 0.5 ? <SketchBox cx={X0 + start + w / 2} cy={y} w={Math.max(w, 4)} h={34} r={6} seed={seedOf(`lat${key}${label}`)} stroke={tone} fill={tone} strokeWidth={1.4} /> : null;
  return (
    <g>
      <HandText x={X0 - 12} y={y} anchor="end" size={TEXT_SIZES.label} color="var(--fg)">
        {label}
      </HandText>
      {seg(0, wT, 'var(--muted)', 't')}
      {seg(wT, wH, 'var(--warn)', 'h')}
      {seg(wT + wH, wA, 'var(--ok)', 'a')}
    </g>
  );
}

/** Time to first token against time between tokens. Baselines are illustrative: the page does not publish them. */
export default function Ai14LinkedinLatency() {
  const [hidden, setHidden] = useState(200);
  const [delta, setDelta] = useState(10);
  const [answer, setAnswer] = useState(250);
  const base: LatencySetup = { ttftMs: 600, tbtMs: 25, hiddenTokens: hidden, answerTokens: answer };
  const slow: LatencySetup = { ...base, tbtMs: base.tbtMs + delta };
  const addFirst = firstVisibleMs(slow) - firstVisibleMs(base);
  const addTotal = totalMs(slow) - totalMs(base);
  const max = Math.ceil(Math.max(totalMs(slow), 12000) / 6000) * 6000;
  const ttftOnly = delta; // the same +delta ms on time to first token adds delta ms once

  return (
    <CacheWidgetFrame title="One more millisecond per token" hint="Illustrative baselines. Change the sliders.">
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="a14l-h" className="mb-1 flex justify-between text-xs text-muted">
            <span>Hidden reasoning tokens</span>
            <span className="tabular-nums text-fg">{hidden}</span>
          </label>
          <input id="a14l-h" type="range" min={0} max={600} step={50} value={hidden} onChange={(e) => setHidden(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a14l-d" className="mb-1 flex justify-between text-xs text-muted">
            <span>Slower by (per token)</span>
            <span className="tabular-nums text-fg">+{delta} ms</span>
          </label>
          <input id="a14l-d" type="range" min={0} max={40} step={5} value={delta} onChange={(e) => setDelta(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a14l-a" className="mb-1 flex justify-between text-xs text-muted">
            <span>Visible answer tokens</span>
            <span className="tabular-nums text-fg">{answer}</span>
          </label>
          <input id="a14l-a" type="range" min={50} max={500} step={50} value={answer} onChange={(e) => setAnswer(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-lg border border-line p-3" aria-live="polite">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">First visible word, before</dt>
            <dd className="font-semibold tabular-nums" data-testid="lt-first0">{sec(firstVisibleMs(base))}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">First visible word, after</dt>
            <dd className="font-semibold tabular-nums" data-testid="lt-first1">{sec(firstVisibleMs(slow))}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Added before the first word</dt>
            <dd className="font-semibold tabular-nums" style={{ color: addFirst > 0 ? 'var(--bad)' : 'var(--ok)' }} data-testid="lt-addfirst">{sec(addFirst)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Added to the whole answer</dt>
            <dd className="font-semibold tabular-nums" data-testid="lt-addtotal">{sec(addTotal)}</dd>
          </div>
        </dl>

        <div className="mt-3">
          <SketchSvg width={720} height={196} label="Two bars of one answer: time to first token, hidden reasoning, and visible answer, before and after a per-token slowdown">
            <Run s={base} y={44} label="Before" max={max} />
            <Run s={slow} y={96} label="After" max={max} />
            <SketchBox cx={X0 + 14} cy={150} w={26} h={20} r={6} seed={seedOf('lg1')} stroke="var(--muted)" fill="var(--muted)" />
            <HandText x={X0 + 34} y={150} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              wait for first token
            </HandText>
            <SketchBox cx={X0 + 214} cy={150} w={26} h={20} r={6} seed={seedOf('lg2')} stroke="var(--warn)" fill="var(--warn)" />
            <HandText x={X0 + 234} y={150} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              hidden reasoning
            </HandText>
            <SketchBox cx={X0 + 384} cy={150} w={26} h={20} r={6} seed={seedOf('lg3')} stroke="var(--ok)" fill="var(--ok)" />
            <HandText x={X0 + 404} y={150} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              visible answer
            </HandText>
            <HandText x={X1} y={180} anchor="end" size={TEXT_SIZES.label} color="var(--muted)">
              {`bar scale: ${max / 1000} s across`}
            </HandText>
          </SketchSvg>
        </div>
        <p className="mt-2 text-sm">
          A slowdown of {delta} ms on the <strong>time to first token</strong> adds {ttftOnly} ms, once. The same {delta} ms on the <strong>time between tokens</strong> is paid on every token that comes before the member sees text: {hidden} x {delta} ms = {sec(addedMs(hidden, delta))}.
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Assumptions, all illustrative: 600 ms to the first token and 25 ms between tokens at the start. The first visible word is time to first token plus hidden tokens times time between tokens. The page states only the result for a 200-token reasoning step with +10 ms: an extra 2 s. This model treats the reasoning as hidden from the member and the answer as streamed after it.
      </p>
    </CacheWidgetFrame>
  );
}

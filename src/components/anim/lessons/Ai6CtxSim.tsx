import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchSvg, TEXT_SIZES, seedOf, type Pt } from '../sketch';
import { WINDOW, simulate } from './Ai6CtxMath';

const X0 = 70;
const X1 = 690;
const Y0 = 240;
const Y1 = 28;
const yOf = (v: number) => Y0 - (Math.min(v, WINDOW * 1.05) / WINDOW) * (Y0 - Y1);
const kk = (n: number) => `${Math.round(n / 1000)}K`;
const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(0)}`;

/** Agent run cost with and without tool-result clearing. Our model, Sonnet 5.5 list prices, no caching. */
export default function Ai6CtxSim() {
  const [steps, setSteps] = useState(50);
  const [tool, setTool] = useState(4000);
  const [threshold, setThreshold] = useState(100000);
  const [keep, setKeep] = useState(3);
  const [clear, setClear] = useState(true);
  const [notes, setNotes] = useState(true);

  const base = { steps, out: 500, tool, base: 5000, threshold, keep };
  const plain = useMemo(() => simulate({ ...base, clear: false, notes: false }), [steps, tool]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = useMemo(() => simulate({ ...base, clear, notes }), [steps, tool, threshold, keep, clear, notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const xOf = (k: number) => X0 + ((k - 1) / Math.max(1, steps - 1)) * (X1 - X0);
  const line = (r: typeof cur): Pt[] => r.frames.map((f, i) => [xOf(i + 1), yOf(f.ctx)] as Pt);
  const draw = (pts: Pt[], id: string, stroke: string, dashed: boolean) =>
    pts.slice(1).map((p, i) => <SketchArrow key={`${id}${i}`} points={[pts[i], p]} head="none" seed={seedOf(`${id}${i}`)} stroke={stroke} dashed={dashed} strokeWidth={dashed ? undefined : 2.2} />);

  const slider = (id: string, label: string, val: string, min: number, max: number, st: number, v: number, set: (n: number) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{val}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
  const check = (id: string, label: string, v: boolean, set: (b: boolean) => void) => (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="accent-[var(--accent)]" />
      {label}
    </label>
  );
  const status = (r: typeof cur) => (r.overflowAt ? `fails at call ${r.overflowAt}` : `finishes ${r.calls} calls`);

  return (
    <CacheWidgetFrame title="Run cost with and without clearing" hint="our model: 500 output tokens per step, 5K start, Sonnet 5.5 prices, no cache">
      <SketchSvg width={720} height={280} label="Input tokens per call, with and without clearing">
        {[0, 50000, 100000, 150000, 200000].map((v) => (
          <g key={v}>
            <HandText x={X0 - 10} y={yOf(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
              {kk(v)}
            </HandText>
            <SketchArrow points={[[X0, yOf(v)], [X1, yOf(v)]]} head="none" seed={seedOf(`cx-g${v}`)} stroke={v === WINDOW ? 'var(--bad)' : 'var(--border)'} dashed={v === WINDOW} />
          </g>
        ))}
        <HandText x={X0 + 6} y={14} anchor="start" size={TEXT_SIZES.note} color="var(--bad)">
          window 200K
        </HandText>
        <HandText x={X1} y={262} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
          {`call 1 to ${steps}`}
        </HandText>
        {draw(line(plain), 'cx-p', 'var(--muted)', true)}
        {draw(line(cur), 'cx-c', 'var(--accent)', false)}
      </SketchSvg>
      <p className="mt-1 text-xs text-muted">Thin grey: no clearing. Solid: your settings. A line that stops early is a run that fails when the window is full.</p>
      <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a69-steps', 'Steps in the run', String(steps), 10, 100, 5, steps, setSteps)}
          {slider('a69-tool', 'Tool result per step', `${tool.toLocaleString('en-US')} tokens`, 500, 12000, 500, tool, setTool)}
          {check('a69-clear', 'Clear old tool results', clear, setClear)}
          {clear && slider('a69-thr', 'Clear when the next call reaches', kk(threshold), 30000, 150000, 10000, threshold, setThreshold)}
          {clear && slider('a69-keep', 'Keep the newest results in full', String(keep), 1, 10, 1, keep, setKeep)}
          {check('a69-notes', 'Write a 200-token note every 5 steps', notes, setNotes)}
        </div>
        <div className="space-y-2" aria-live="polite">
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">No clearing</div>
            <div data-testid="plain" className="font-mono text-sm">{status(plain)} · input {(plain.inputTokens / 1e6).toFixed(2)}M · {usd(plain.cost)}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Your settings</div>
            <div data-testid="cur" className="font-mono text-sm">{status(cur)} · input {(cur.inputTokens / 1e6).toFixed(2)}M · {usd(cur.cost)}</div>
            <div data-testid="peak" className="mt-1 font-mono text-sm">peak {cur.peak.toLocaleString('en-US')} tokens · {cur.clearEvents} clearings</div>
          </div>
          <p className="text-xs text-muted">Notes add tokens. They do not shrink the window. They keep the facts that clearing would remove.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

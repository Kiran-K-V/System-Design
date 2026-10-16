import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchSvg, TEXT_SIZES, seedOf, type Pt } from '../sketch';
import { firstFull, simulate } from './Ai4CompactMath';

const WINDOW = 200000;
const TURNS = 80;
const X0 = 70;
const X1 = 690;
const Y0 = 250;
const Y1 = 30;
const xOf = (t: number) => X0 + (t / TURNS) * (X1 - X0);
const yOf = (v: number) => Y0 - (Math.min(v, WINDOW * 1.05) / WINDOW) * (Y0 - Y1);

/** Drop points that sit on a straight line between their neighbours. */
function simplify(p: Pt[]): Pt[] {
  return p.filter((pt, i) => {
    if (i === 0 || i === p.length - 1) return true;
    const a = p[i - 1];
    const b = p[i + 1];
    return Math.abs((pt[1] - a[1]) * (b[0] - pt[0]) - (b[1] - pt[1]) * (pt[0] - a[0])) > 0.5;
  });
}

const kk = (n: number) => `${Math.round(n / 1000)}K`;

/** Turns versus tokens, with and without clearing and compaction. */
export default function Ai4CompactSim() {
  const [perTurn, setPerTurn] = useState(6000);
  const [toolShare, setToolShare] = useState(50);
  const [clearing, setClearing] = useState(false);
  const [compaction, setCompaction] = useState(true);
  const [compactAt, setCompactAt] = useState(150000);
  const [summary, setSummary] = useState(8000);
  const [clearAt, setClearAt] = useState(100000);

  const o = { turns: TURNS, perTurn, toolShare: toolShare / 100, clearing, clearAt, keep: 3, compaction, compactAt, summary };
  const base = useMemo(() => simulate({ ...o, clearing: false, compaction: false }), [perTurn, toolShare]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = useMemo(() => simulate(o), [perTurn, toolShare, clearing, clearAt, compaction, compactAt, summary]); // eslint-disable-line react-hooks/exhaustive-deps
  const fullBase = firstFull(base.size, WINDOW);
  const fullCur = firstFull(cur.size, WINDOW);
  const fit = (f: number | null) => (f === null ? `${TURNS}+` : String(f - 1));

  // Series. A drop is drawn as a vertical line from the old point to the new one.
  const series = (sz: number[]): Pt[] => {
    const pts: Pt[] = [[xOf(0), yOf(0)]];
    sz.forEach((v, i) => {
      const prev = i === 0 ? 0 : sz[i - 1];
      if (v < prev) pts.push([xOf(i + 1), yOf(prev)]);
      pts.push([xOf(i + 1), yOf(v)]);
    });
    return simplify(pts);
  };
  const curPts = series(cur.size);
  const basePts = series(base.size.slice(0, (fullBase ?? TURNS)));

  const slider = (id: string, label: string, val: string, min: number, max: number, step: number, v: number, set: (n: number) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{val}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
  const check = (id: string, label: string, v: boolean, set: (b: boolean) => void) => (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="accent-[var(--accent)]" />
      {label}
    </label>
  );

  return (
    <CacheWidgetFrame title="Turns versus tokens" hint="a model with our own assumptions, see the text">
      <SketchSvg width={720} height={290} label="Context size per turn, with and without compaction and tool-result clearing">
        {[0, 50000, 100000, 150000, 200000].map((v) => (
          <g key={v}>
            <HandText x={X0 - 10} y={yOf(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
              {kk(v)}
            </HandText>
            <SketchArrow points={[[X0, yOf(v)], [X1, yOf(v)]]} head="none" seed={seedOf(`cs-g${v}`)} stroke={v === WINDOW ? 'var(--bad)' : 'var(--border)'} dashed={v === WINDOW} />
          </g>
        ))}
        {[0, 20, 40, 60, 80].map((t) => (
          <HandText key={t} x={xOf(t)} y={272} size={TEXT_SIZES.note} mono color="var(--muted)">
            {String(t)}
          </HandText>
        ))}
        <HandText x={X1} y={14} anchor="end" size={TEXT_SIZES.note} color="var(--bad)">
          window 200K
        </HandText>
        {basePts.length > 1 && (
          <g>
            {basePts.slice(1).map((p, i) => (
              <SketchArrow key={i} points={[basePts[i], p]} head="none" seed={seedOf(`cs-b${i}`)} stroke="var(--muted)" dashed />
            ))}
          </g>
        )}
        {curPts.slice(1).map((p, i) => (
          <SketchArrow key={i} points={[curPts[i], p]} head="none" seed={seedOf(`cs-c${i}`)} stroke="var(--accent)" strokeWidth={2.2} />
        ))}
        <HandText x={xOf(TURNS) - 6} y={Y0 + 0} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
          turn
        </HandText>
      </SketchSvg>
      <p className="mt-1 text-xs text-muted">Dashed grey: no compaction, no clearing. Solid: your settings.</p>
      <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a44-per', 'Tokens added per turn', kk(perTurn), 2000, 12000, 1000, perTurn, setPerTurn)}
          {slider('a44-tool', 'Share that is tool results', `${toolShare}%`, 0, 90, 10, toolShare, setToolShare)}
          {check('a44-clear', 'Clear old tool results (keep the last 3 turns)', clearing, setClearing)}
          {clearing && slider('a44-clearat', 'Clear when context reaches', kk(clearAt), 30000, 150000, 10000, clearAt, setClearAt)}
          {check('a44-comp', 'Compact into a summary', compaction, setCompaction)}
          {compaction && slider('a44-compat', 'Compact when context reaches', kk(compactAt), 50000, 190000, 10000, compactAt, setCompactAt)}
          {compaction && slider('a44-sum', 'Summary size', kk(summary), 2000, 30000, 2000, summary, setSummary)}
        </div>
        <div className="space-y-2" aria-live="polite">
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Turns that fit in 200K, with no action</div>
            <div data-testid="fit-base" className="font-mono text-xl">{fit(fullBase)}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Turns that fit, with your settings (of {TURNS} simulated)</div>
            <div data-testid="fit-cur" className="font-mono text-xl">{fit(fullCur)}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Compactions / clearings in {TURNS} turns</div>
            <div data-testid="events" className="font-mono text-xl">{cur.compactEvents.length} / {cur.clearEvents.length}</div>
            <div className="mt-1 text-xs text-muted">Each compaction is an extra model call that you pay for.</div>
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

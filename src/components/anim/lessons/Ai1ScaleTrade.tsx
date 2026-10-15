import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { breakEven, fitLoss, fmtCount, fmtSci, lifetimeFlops, trainFlops } from './Ai1ScaleMath';

interface M {
  id: string;
  name: string;
  n: number;
  d: number;
  color: string;
  dashed?: boolean;
}

const BIG: M = { id: 'big', name: '70B @ 1.4T', n: 70e9, d: 1.4e12, color: 'var(--accent)' };
const SMALL: M = { id: 'small', name: '8B @ 15T', n: 8e9, d: 15e12, color: 'var(--ok)' };

const X0 = 80;
const X1 = 660;
const Y_TOP = 24;
const Y_BOT = 270;
const XL = 10;
const XH = 15;
const YL = 23;
const YH = 27;
const px = (lq: number) => X0 + ((lq - XL) / (XH - XL)) * (X1 - X0);
const py = (ly: number) => Y_BOT - ((ly - YL) / (YH - YL)) * (Y_BOT - Y_TOP);
const lg = Math.log10;

function Slider({ id, label, shown, value, min, max, step, onChange }: { id: string; label: string; shown: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function Ai1ScaleTrade() {
  const [lq, setLq] = useState(13);
  const [ln, setLn] = useState(lg(30e9));
  const [ld, setLd] = useState(lg(5e12));
  const q = Math.pow(10, lq);
  const mine: M = { id: 'mine', name: 'Your model', n: Math.pow(10, ln), d: Math.pow(10, ld), color: 'var(--warn)', dashed: true };
  const models = [BIG, SMALL, mine];

  const curve = (m: M) => {
    const pts: [number, number][] = [];
    for (let l = XL; l <= XH + 1e-9; l += 0.5) pts.push([px(l), py(lg(lifetimeFlops(m.n, m.d, Math.pow(10, l))))]);
    return pts;
  };
  const be = breakEven(BIG, SMALL);

  return (
    <CacheWidgetFrame title="Train once, serve many times" hint="Lifetime FLOPs = 6ND + 2N x tokens served">
      <div className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Slider id="ai1-q" label="Tokens served in total" shown={fmtCount(q)} value={lq} min={XL} max={XH} step={0.05} onChange={setLq} />
          <Slider id="ai1-n" label="Your model: parameters" shown={fmtCount(mine.n)} value={ln} min={9} max={lg(405e9)} step={0.01} onChange={setLn} />
          <Slider id="ai1-d" label="Your model: training tokens" shown={fmtCount(mine.d)} value={ld} min={11} max={lg(2e13)} step={0.01} onChange={setLd} />
        </div>
        <div>
          <SketchSvg width={720} height={330} label="Lifetime FLOPs against tokens served for three models, log scale">
            {[23, 24, 25, 26, 27].map((v) => (
              <g key={v}>
                <HandText x={X0 - 12} y={py(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">{`1e${v}`}</HandText>
                <SketchArrow points={[[X0, py(v)], [X1, py(v)]]} head="none" seed={seedOf(`ty${v}`)} stroke="var(--border)" />
              </g>
            ))}
            {[10, 11, 12, 13, 14, 15].map((v) => (
              <HandText key={v} x={px(v)} y={Y_BOT + 20} size={TEXT_SIZES.note} mono color="var(--muted)">{`1e${v}`}</HandText>
            ))}
            {models.map((m) => (
              <SketchArrow key={m.id} points={curve(m)} head="none" seed={seedOf('tc' + m.id)} stroke={m.color} strokeWidth={2.2} />
            ))}
            <SketchArrow points={[[px(lq), Y_TOP], [px(lq), Y_BOT]]} head="none" dashed seed={seedOf('t-cur')} stroke="var(--muted)" />
            <HandText x={X1} y={py(26.15) - 16} anchor="end" size={TEXT_SIZES.note} color="var(--accent)">70B, 1.4T tokens</HandText>
            <HandText x={X1} y={py(25.2) + 24} anchor="end" size={TEXT_SIZES.note} color="var(--ok)">8B, 15T tokens</HandText>
            <HandText x={(X0 + X1) / 2} y={Y_BOT + 50} size={TEXT_SIZES.note} color="var(--muted)">Tokens served over the model lifetime (log scale)</HandText>
          </SketchSvg>
        </div>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">Loss is from the Chinchilla fit, an extrapolation far beyond its fitted range. Use it to compare, not to predict.</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 pr-2 font-normal">Model</th>
              <th className="pr-2 font-normal">Tok/param</th>
              <th className="pr-2 font-normal">Loss (fit)</th>
              <th className="pr-2 font-normal">Train</th>
              <th className="pr-2 font-normal">Per token</th>
              <th className="font-normal">Lifetime @ {fmtCount(q)}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {models.map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="py-1 pr-2" style={{ color: m.color }}>{m.id === 'mine' ? `Yours ${fmtCount(m.n)} @ ${fmtCount(m.d)}` : m.name}</td>
                <td className="pr-2">{Math.round(m.d / m.n).toLocaleString('en-US')}</td>
                <td className="pr-2">{fitLoss(m.n, m.d).toFixed(3)}</td>
                <td className="pr-2">{fmtSci(trainFlops(m.n, m.d))}</td>
                <td className="pr-2">{fmtSci(2 * m.n)}</td>
                <td data-testid={`life-${m.id}`}>{fmtSci(lifetimeFlops(m.n, m.d, q))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted" aria-live="polite">
        The 8B model costs more to train ({fmtSci(trainFlops(SMALL.n, SMALL.d))} against {fmtSci(trainFlops(BIG.n, BIG.d))}). It pays back after about{' '}
        <span className="text-fg" data-testid="breakeven">{fmtCount(be)}</span> served tokens. Past that point the 8B model has the lower lifetime cost, and the gap grows with traffic.
      </p>
    </CacheWidgetFrame>
  );
}

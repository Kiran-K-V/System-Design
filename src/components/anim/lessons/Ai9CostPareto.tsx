import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { PRICES, candidates } from './Ai9CostMath';

const W = 720;
const H = 300;
const PX0 = 80;
const PX1 = 690;
const PY0 = 30;
const PY1 = 250;
const LO = -4;
const HI = -1;
const xOf = (c: number) => PX0 + ((Math.log10(c) - LO) / (HI - LO)) * (PX1 - PX0);
const yOf = (p: number) => PY1 - ((p - 0.4) / 0.6) * (PY1 - PY0);
const usd = (v: number) => (v >= 0.01 ? `$${v.toFixed(3)}` : `$${v.toFixed(5)}`);

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Cost per successful task for three models. Pass rates are the reader's own; defaults are illustrative. */
export default function Ai9CostPareto() {
  const [haiku, setHaiku] = useState(72);
  const [sonnet, setSonnet] = useState(86);
  const [opus, setOpus] = useState(90);
  const [bar, setBar] = useState(80);
  const [hit, setHit] = useState(80);
  const rows = candidates({ haiku: haiku / 100, sonnet: sonnet / 100, opus: opus / 100 }, bar / 100, 3000, 500, hit / 100);
  const best = rows.find((r) => r.best);
  return (
    <CacheWidgetFrame title="Cost per successful task" hint="Illustrative pass rates. Use your own eval numbers.">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a9p-h" label="Haiku 5.5 pass rate" value={haiku} min={40} max={100} step={1} show={`${haiku}%`} onChange={setHaiku} />
        <Slider id="a9p-s" label="Sonnet 5.5 pass rate" value={sonnet} min={40} max={100} step={1} show={`${sonnet}%`} onChange={setSonnet} />
        <Slider id="a9p-o" label="Opus 5.5 pass rate" value={opus} min={40} max={100} step={1} show={`${opus}%`} onChange={setOpus} />
        <Slider id="a9p-b" label="Quality bar (minimum pass rate)" value={bar} min={50} max={100} step={1} show={`${bar}%`} onChange={setBar} />
        <Slider id="a9p-c" label="Share of input read from cache" value={hit} min={0} max={90} step={10} show={`${hit}%`} onChange={setHit} />
      </div>
      <SketchSvg width={W} height={H} label="Pass rate against cost per successful task for three models">
        <SketchArrow points={[[PX0, PY1], [PX1, PY1]]} head="none" stroke="var(--muted)" seed={seedOf('p9x')} />
        <SketchArrow points={[[PX0, PY0], [PX0, PY1]]} head="none" stroke="var(--muted)" seed={seedOf('p9y')} />
        {[0.0001, 0.001, 0.01, 0.1].map((t) => (
          <HandText key={t} x={xOf(t)} y={PY1 + 16} size={TEXT_SIZES.note} color="var(--muted)">{`$${t}`}</HandText>
        ))}
        <HandText x={(PX0 + PX1) / 2} y={H - 10} size={TEXT_SIZES.note} color="var(--muted)">cost per successful task (log scale)</HandText>
        {[0.5, 0.75, 1].map((p) => (
          <HandText key={p} x={PX0 - 8} y={yOf(p)} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">{`${Math.round(p * 100)}%`}</HandText>
        ))}
        <SketchArrow points={[[PX0, yOf(bar / 100)], [PX1, yOf(bar / 100)]]} head="none" dashed stroke="var(--bad)" seed={seedOf('p9bar')} />
        <HandText x={PX1} y={yOf(bar / 100) - 12} size={TEXT_SIZES.note} anchor="end" color="var(--bad)">quality bar</HandText>
        {rows.map((r) => {
          const cx = xOf(Math.min(Math.max(r.perSuccess, 10 ** LO), 10 ** HI));
          const cy = yOf(r.pass);
          const tone = r.best ? 'var(--ok)' : r.eligible ? 'var(--accent)' : 'var(--muted)';
          return (
            <g key={r.id}>
              <SketchEllipse cx={cx} cy={cy} w={26} h={26} seed={seedOf(`p9${r.id}`)} stroke={tone} fill={r.best ? tone : undefined} strokeWidth={r.best ? 2.2 : 1.4} dashed={!r.eligible} />
              <HandText x={cx} y={cy - 24} size={TEXT_SIZES.label} color={tone === 'var(--muted)' ? 'var(--muted)' : 'var(--fg)'}>{PRICES[r.id as 'haiku'].name}</HandText>
            </g>
          );
        })}
      </SketchSvg>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-1 pr-3 font-normal">Model</th>
              <th className="py-1 pr-3 font-normal">Per attempt</th>
              <th className="py-1 pr-3 font-normal">Per successful task</th>
              <th className="py-1 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-1.5 pr-3">{PRICES[r.id as 'haiku'].name}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{usd(r.perReq)}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{usd(r.perSuccess)}</td>
                <td className="py-1.5 text-xs" style={{ color: r.best ? 'var(--ok)' : 'var(--muted)' }}>
                  {r.best ? 'cheapest that meets the bar' : !r.eligible ? 'below the bar' : r.dominated ? 'beaten: another model is cheaper and better' : 'meets the bar, costs more'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        {best ? `Pick ${PRICES[best.id as 'haiku'].name}.` : 'No model meets the bar. Lower the bar, improve the prompt, or add a stronger option.'} Model: 3,000 tokens in, 500 out, a failed attempt is retried until one passes, so cost per success = cost per attempt / pass rate.
      </p>
    </CacheWidgetFrame>
  );
}

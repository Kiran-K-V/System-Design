import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { CHINCHILLA_RATIO, chinchillaSplit, fmtCount, fmtSci, kaplanSplit, trainFlops } from './Ai1ScaleMath';

const PRESETS = [
  { id: 'p1', label: 'Chinchilla row: 1B', c: 1.21e20 },
  { id: 'p2', label: 'Chinchilla 70B budget', c: 5.76e23 },
  { id: 'p3', label: 'Llama 3 8B budget (6ND)', c: trainFlops(8e9, 15e12) },
  { id: 'p4', label: 'Llama 3 405B budget (6ND)', c: trainFlops(405e9, 15.6e12) },
];

const X0 = 70;
const X1 = 660;
const Y_TOP = 30;
const Y_BOT = 280;
const XL = 18;
const XH = 26;
const YL = 7;
const YH = 14;
const px = (lc: number) => X0 + ((lc - XL) / (XH - XL)) * (X1 - X0);
const py = (ly: number) => Y_BOT - ((ly - YL) / (YH - YL)) * (Y_BOT - Y_TOP);

export default function Ai1ScaleFrontier() {
  const [lc, setLc] = useState(Math.log10(5.76e23));
  const c = Math.pow(10, lc);
  const ch = chinchillaSplit(c);
  const kp = kaplanSplit(c);
  const lg = Math.log10;
  const llamaC = trainFlops(8e9, 15e12);

  const line = (f: (l: number) => number) => {
    const pts: [number, number][] = [];
    for (let l = XL; l <= XH + 1e-9; l += 2) pts.push([px(l), py(f(l))]);
    return pts;
  };
  const chN = (l: number) => lg(chinchillaSplit(Math.pow(10, l)).n);
  const chD = (l: number) => lg(chinchillaSplit(Math.pow(10, l)).d);
  const kpN = (l: number) => lg(kaplanSplit(Math.pow(10, l)).n);

  return (
    <CacheWidgetFrame title="Compute-optimal calculator" hint="C = 6ND, with D = 20 N">
      <div className="mb-3">
        <Seg
          label="Presets"
          value={PRESETS.find((p) => Math.abs(lg(p.c) - lc) < 0.03)?.id ?? ''}
          options={PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          onChange={(id) => setLc(lg(PRESETS.find((p) => p.id === id)!.c))}
        />
      </div>
      <div className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="ai1-c" className="mb-1 flex justify-between text-xs text-muted">
              <span>Training budget C (FLOPs)</span>
              <span className="tabular-nums text-fg">{fmtSci(c)}</span>
            </label>
            <input id="ai1-c" type="range" min={XL} max={XH} step={0.01} value={lc} onChange={(e) => setLc(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Compute-optimal (Chinchilla, {CHINCHILLA_RATIO} tokens per parameter)</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="ch-n">{fmtCount(ch.n)} params</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="ch-d">{fmtCount(ch.d)} tokens</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Kaplan 2020 rule, same budget</div>
            <div className="font-semibold tabular-nums" data-testid="kp-n">{fmtCount(kp.n)} params</div>
            <div className="font-semibold tabular-nums" data-testid="kp-d">{fmtCount(kp.d)} tokens ({(kp.d / kp.n).toFixed(2)} per param)</div>
          </div>
        </div>
        <div>
          <SketchSvg width={720} height={340} label="Compute-optimal parameters and tokens against training budget, log scale">
            {[7, 8, 9, 10, 11, 12, 13, 14].map((v) => (
              <g key={v}>
                <HandText x={X0 - 12} y={py(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">{`1e${v}`}</HandText>
                <SketchArrow points={[[X0, py(v)], [X1, py(v)]]} head="none" seed={seedOf(`fy${v}`)} stroke="var(--border)" />
              </g>
            ))}
            {[18, 20, 22, 24, 26].map((v) => (
              <HandText key={v} x={px(v)} y={Y_BOT + 20} size={TEXT_SIZES.note} mono color="var(--muted)">{`1e${v}`}</HandText>
            ))}
            <SketchArrow points={line(chD)} head="none" seed={seedOf('f-chd')} stroke="var(--ok)" strokeWidth={2.2} />
            <SketchArrow points={line(chN)} head="none" seed={seedOf('f-chn')} stroke="var(--accent)" strokeWidth={2.2} />
            <SketchArrow points={line(kpN)} head="none" seed={seedOf('f-kpn')} stroke="var(--warn)" strokeWidth={2.2} />
            <SketchArrow points={[[px(lc), Y_TOP], [px(lc), Y_BOT]]} head="none" dashed seed={seedOf('f-cur')} stroke="var(--muted)" />
            <SketchEllipse cx={px(lc)} cy={py(lg(ch.n))} w={13} h={13} seed={seedOf('f-d1')} fill="var(--accent)" stroke="var(--accent)" />
            <SketchEllipse cx={px(lc)} cy={py(lg(ch.d))} w={13} h={13} seed={seedOf('f-d2')} fill="var(--ok)" stroke="var(--ok)" />
            <SketchEllipse cx={px(lg(llamaC))} cy={py(lg(8e9))} w={15} h={15} seed={seedOf('f-llama')} fill="var(--bad)" stroke="var(--bad)" />
            <HandText x={px(lg(llamaC)) + 12} y={py(lg(8e9)) + 18} anchor="start" size={TEXT_SIZES.note} color="var(--bad)">Llama 3 8B (actual)</HandText>
            <HandText x={X0 + 8} y={py(13.4)} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">Tokens D (optimal)</HandText>
            <HandText x={px(21)} y={py(7.6)} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">Params N (optimal)</HandText>
            <HandText x={px(25.4)} y={py(13.8)} anchor="end" size={TEXT_SIZES.note} color="var(--warn)">Params N, Kaplan rule</HandText>
            <HandText x={(X0 + X1) / 2} y={Y_BOT + 50} size={TEXT_SIZES.note} color="var(--muted)">Training budget C in FLOPs (log scale on both axes)</HandText>
          </SketchSvg>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            The Kaplan line (orange) grows faster: at {fmtSci(c)} FLOPs it puts <span className="text-fg">{(kp.n / ch.n).toFixed(1)}x</span> more parameters in the model and gives it <span className="text-fg">{(ch.d / kp.d).toFixed(1)}x</span> fewer
            tokens. The red dot is the real Llama 3 8B: far below the optimal line for its own budget.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

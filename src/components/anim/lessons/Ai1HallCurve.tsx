import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * Multi-document QA accuracy (%) by position of the answer document. Index 0 is first.
 * Source: Liu et al. 2023, "Lost in the Middle", Appendix G tables 5 to 7 (arXiv 2307.03172v3).
 * The paper reports only some indexes: 3 of 10, 5 of 20, 7 of 30.
 */
type ModelId = 'gpt' | 'claude';
const DATA: Record<ModelId, Record<number, { idx: number[]; acc: number[] }>> = {
  gpt: {
    10: { idx: [0, 4, 9], acc: [76.9, 61.0, 62.5] },
    20: { idx: [0, 4, 9, 14, 19], acc: [75.7, 57.3, 54.1, 55.4, 63.1] },
    30: { idx: [0, 4, 9, 14, 19, 24, 29], acc: [73.4, 55.1, 50.5, 50.9, 51.8, 54.9, 63.7] },
  },
  claude: {
    10: { idx: [0, 4, 9], acc: [62.9, 58.3, 59.7] },
    20: { idx: [0, 4, 9, 14, 19], acc: [59.9, 55.9, 56.8, 57.2, 60.1] },
    30: { idx: [0, 4, 9, 14, 19, 24, 29], acc: [59.1, 55.1, 54.8, 55.7, 56.4, 56.2, 59.9] },
  },
};
/** Table 1 of the paper. Closed-book: no documents. Oracle: only the answer document. */
const REF: Record<ModelId, { closed: number; oracle: number; name: string }> = {
  gpt: { closed: 56.0, oracle: 88.6, name: 'GPT-3.5-Turbo (16K)' },
  claude: { closed: 48.3, oracle: 76.1, name: 'Claude-1.3' },
};

const X0 = 70;
const X1 = 660;
const Y_TOP = 40;
const Y_BOT = 290;
const LO = 40;
const HI = 90;
const yOf = (v: number) => Y_BOT - ((v - LO) / (HI - LO)) * (Y_BOT - Y_TOP);

export default function Ai1HallCurve() {
  const [model, setModel] = useState<ModelId>('gpt');
  const [docs, setDocs] = useState<10 | 20 | 30>(30);
  const d = DATA[model][docs];
  const ref = REF[model];
  const xOf = (idx: number) => X0 + 20 + (idx / (docs - 1)) * (X1 - X0 - 40);
  const best = Math.max(...d.acc);
  const worst = Math.min(...d.acc);
  const worstIdx = d.idx[d.acc.indexOf(worst)];
  const first = d.acc[0];

  return (
    <CacheWidgetFrame title="Accuracy by position of the answer" hint="Real numbers, Liu et al. 2023, Appendix G">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg label="Model" value={model} options={[{ id: 'gpt', label: 'GPT-3.5-Turbo (16K)' }, { id: 'claude', label: 'Claude-1.3' }]} onChange={setModel} />
        <Seg label="Documents in the prompt" value={docs} options={[{ id: 10, label: '10 docs' }, { id: 20, label: '20 docs' }, { id: 30, label: '30 docs' }]} onChange={setDocs} />
      </div>
      <SketchSvg width={720} height={370} label={`Accuracy by document position, ${ref.name}, ${docs} documents`}>
        {[40, 50, 60, 70, 80, 90].map((v) => (
          <g key={v}>
            <HandText x={X0 - 12} y={yOf(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
              {`${v}`}
            </HandText>
            <SketchArrow points={[[X0, yOf(v)], [X1, yOf(v)]]} head="none" seed={seedOf(`g${v}`)} stroke="var(--border)" />
          </g>
        ))}
        <SketchArrow points={[[X0, yOf(ref.oracle)], [X1, yOf(ref.oracle)]]} head="none" dashed seed={seedOf('or' + model)} stroke="var(--ok)" />
        <SketchArrow points={[[X0, yOf(ref.closed)], [X1, yOf(ref.closed)]]} head="none" dashed seed={seedOf('cb' + model)} stroke="var(--bad)" />
        {d.idx.slice(1).map((idx, k) => (
          <SketchArrow key={idx} points={[[xOf(d.idx[k]), yOf(d.acc[k])], [xOf(idx), yOf(d.acc[k + 1])]]} head="none" seed={seedOf(`l${model}${docs}${k}`)} stroke="var(--accent)" strokeWidth={2.2} />
        ))}
        {d.idx.map((idx, k) => (
          <g key={idx}>
            <SketchEllipse cx={xOf(idx)} cy={yOf(d.acc[k])} w={14} h={14} seed={seedOf(`p${model}${docs}${k}`)} fill="var(--accent)" stroke="var(--accent)" />
            <HandText x={xOf(idx)} y={yOf(d.acc[k]) - 20} size={TEXT_SIZES.note} mono>
              {d.acc[k].toFixed(1)}
            </HandText>
            <HandText x={xOf(idx)} y={Y_BOT + 22} size={TEXT_SIZES.note} mono color="var(--muted)">
              {`${idx}`}
            </HandText>
          </g>
        ))}
        <HandText x={(X0 + X1) / 2} y={Y_BOT + 52} size={TEXT_SIZES.note} color="var(--muted)">
          Position of the answer document (0 = first in the prompt)
        </HandText>
        <HandText x={18} y={12} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          Accuracy %
        </HandText>
        <SketchArrow points={[[190, 12], [220, 12]]} head="none" dashed seed={seedOf('lg1')} stroke="var(--ok)" />
        <HandText x={228} y={12} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">
          {`Oracle, only the answer doc: ${ref.oracle}`}
        </HandText>
        <SketchArrow points={[[470, 12], [500, 12]]} head="none" dashed seed={seedOf('lg2')} stroke="var(--bad)" />
        <HandText x={508} y={12} anchor="start" size={TEXT_SIZES.note} color="var(--bad)">
          {`Closed-book, no docs: ${ref.closed}`}
        </HandText>
      </SketchSvg>
      <p className="mt-2 text-sm leading-relaxed" aria-live="polite">
        First position {first.toFixed(1)}%, worst reported position (index {worstIdx}) {worst.toFixed(1)}%, a drop of{' '}
        <span className="font-semibold tabular-nums">{(first - worst).toFixed(1)} points</span>.{' '}
        {worst < ref.closed ? (
          <span className="text-bad">The worst position scores below closed-book ({ref.closed}%): with the answer buried in the middle, the documents hurt.</span>
        ) : (
          <span className="text-muted">The worst position is still above closed-book ({ref.closed}%), but far below the oracle ({ref.oracle}%).</span>
        )}{' '}
        <span className="text-muted">Best: {best.toFixed(1)}%. The paper reports only the indexes shown.</span>
      </p>
    </CacheWidgetFrame>
  );
}

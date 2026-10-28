import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** ILLUSTRATIVE index values (week 0 = 100). Made up to show the shape. */
const CLICKS = [100, 112, 124, 136];
const SATIS = [100, 98, 92, 84];
const WEEKS = ['Week 0', 'Week 1', 'Week 2', 'Week 3'];

const BASE = 370;
const SCALE = 1.9;
const X0 = 150;
const GAP = 140;

const steps = [
  { shown: 1, caption: 'Week 0: the old model. Click index and satisfaction index both start at 100. The numbers are illustrative.' },
  { shown: 2, caption: 'Week 1: a new model trained to predict clicks ships. Clicks rise. Satisfaction (from a survey) dips a little. The team sees the click chart and is pleased.' },
  { shown: 3, caption: 'Week 2: the model has learned that sensational titles get clicks. It shows more of them. Clicks keep climbing and satisfaction keeps falling.' },
  { shown: 4, caption: 'Week 3: the proxy (clicks) and the goal (people find videos worth their time) have split apart. The model did what we asked. We asked for the wrong thing.' },
];

export default function AiE1ProxyDrift() {
  return (
    <AnimFrame title="A proxy metric rises while the goal falls (illustrative)" steps={steps} interval={5000}>
      {(_, s) => (
        <SketchSvg width={720} height={440} label="Bars by week. Click index rises from 100 to 136. Satisfaction index falls from 100 to 84.">
          <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading}>Index, week 0 = 100</HandText>
          <HandText x={696} y={26} anchor="end" size={TEXT_SIZES.note} color="var(--accent)">clicks (the proxy)</HandText>
          <HandText x={696} y={46} anchor="end" size={TEXT_SIZES.note} color="var(--bad)">satisfaction (the goal)</HandText>
          {WEEKS.slice(0, s.shown).map((w, i) => {
            const cx = X0 + i * GAP;
            const last = i === s.shown - 1;
            const hc = CLICKS[i] * SCALE;
            const hs = SATIS[i] * SCALE;
            return (
              <g key={w}>
                <SketchBox cx={cx - 22} cy={BASE - hc / 2} w={36} h={hc} r={6} seed={seedOf(`pd-c${i}`)} stroke="var(--accent)" fill="var(--accent)" strokeWidth={last ? 2.2 : 1.4} />
                <SketchBox cx={cx + 22} cy={BASE - hs / 2} w={36} h={hs} r={6} seed={seedOf(`pd-s${i}`)} stroke="var(--bad)" fill="var(--bad)" strokeWidth={last ? 2.2 : 1.4} />
                <HandText x={cx - 22} y={BASE - hc - 14} size={TEXT_SIZES.note} mono color="var(--accent)">{String(CLICKS[i])}</HandText>
                <HandText x={cx + 22} y={BASE - hs - 14} size={TEXT_SIZES.note} mono color="var(--bad)">{String(SATIS[i])}</HandText>
                <HandText x={cx} y={BASE + 22} size={TEXT_SIZES.note} color={last ? 'var(--fg)' : 'var(--muted)'}>{w}</HandText>
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

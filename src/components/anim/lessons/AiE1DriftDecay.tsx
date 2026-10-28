import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { decaySeries, maxInterval } from './AiE1DriftLogic';

const START = 80;
const FLOOR = 75;
const PER_WEEK = 0.5;
const WEEKS = 16;
const RETRAIN = 8;

interface Step {
  caption: string;
  upto: number;
  interval: number | null;
  note: string;
}

const steps: Step[] = [
  {
    caption:
      'Launch day. The model scores 80 on the quality metric you track. The dashed line is the floor: the lowest score the product can live with. The numbers on this chart are illustrative.',
    upto: 0,
    interval: null,
    note: 'Week 0: launch',
  },
  {
    caption:
      'Nothing breaks and no alert fires. The world moves a little each week: new items, new slang, new fraud tricks. The score slides down by a small amount every week. This is slow decay.',
    upto: 6,
    interval: null,
    note: 'Week 6: down 3 points',
  },
  {
    caption:
      'Week 10: the score reaches the floor. A team that never retrains learns this from a user complaint. The decay was always there. Nobody had measured it.',
    upto: 10,
    interval: null,
    note: 'Week 10: floor reached',
  },
  {
    caption:
      'Now retrain every 8 weeks on fresh data. Each retrain puts the score back to 80, and the slide starts again. The line becomes a saw tooth that never touches the floor.',
    upto: WEEKS,
    interval: RETRAIN,
    note: 'Retrain every 8 weeks',
  },
  {
    caption: `The schedule is not a guess. The measured slope is about half a point a week, and the gap to the floor is 5 points. So the longest safe gap is ${maxInterval(START, FLOOR, PER_WEEK)} weeks. The team picks 8 to leave a margin. A faster slope shortens the gap.`,
    upto: WEEKS,
    interval: RETRAIN,
    note: 'Gap = room / slope',
  },
];

const X0 = 80;
const X1 = 690;
const Y0 = 40;
const Y1 = 230;
const VMIN = 71;
const VMAX = 81;
const px = (w: number) => X0 + (w / WEEKS) * (X1 - X0);
const py = (v: number) => Y1 - ((v - VMIN) / (VMAX - VMIN)) * (Y1 - Y0);

export default function AiE1DriftDecay() {
  return (
    <AnimFrame title="A model ages. A schedule from the measured slope resets it." steps={steps} interval={5500}>
      {(i, s) => {
        const all = decaySeries(WEEKS, START, PER_WEEK, s.interval).filter(([w]) => w <= s.upto);
        const cut = all;
        const segs = cut.slice(1).map((p, k) => [cut[k], p] as const);
        return (
          <SketchSvg width={720} height={290} label={`${s.note}. Quality score over ${s.upto} weeks.`}>
            <HandText x={X0} y={22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              Quality score (illustrative)
            </HandText>
            <SketchArrow points={[[X0, Y0], [X0, Y1], [X1, Y1]]} head="none" seed={seedOf('dd-axes')} stroke="var(--muted)" />
            <SketchArrow points={[[X0, py(FLOOR)], [X1, py(FLOOR)]]} head="none" seed={seedOf('dd-floor')} stroke="var(--bad)" dashed />
            <HandText x={X1} y={py(FLOOR) + 16} anchor="end" size={TEXT_SIZES.note} color="var(--bad)">
              floor: 75
            </HandText>
            <HandText x={X0 - 10} y={py(START)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
              80
            </HandText>
            <HandText x={(X0 + X1) / 2} y={262} size={TEXT_SIZES.note} color="var(--muted)">
              weeks since first deploy
            </HandText>
            {[0, 4, 8, 12, 16].map((w) => (
              <HandText key={w} x={px(w)} y={Y1 + 16} size={TEXT_SIZES.note} mono color="var(--muted)">
                {String(w)}
              </HandText>
            ))}
            {segs.map(([a, b], k) => (
              <SketchArrow
                key={`${i}-${k}`}
                points={[[px(a[0]), py(a[1])], [px(b[0]), py(b[1])]]}
                head="none"
                seed={seedOf(`dd-seg-${k}`)}
                stroke={s.interval === null && b[1] <= FLOOR + 1e-9 ? 'var(--bad)' : 'var(--accent)'}
                strokeWidth={2.2}
              />
            ))}
            <HandText x={X1} y={Y0 + 6} anchor="end" size={TEXT_SIZES.label} color="var(--accent)">
              {s.note}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

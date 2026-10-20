import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { ANNOTATED_PER_DAY, TIERS, changesBefore, cyclesIn } from './Ai14LinkedinMath';

/**
 * The three evaluation tiers in the LinkedIn post (Figure 2): engineers, annotators, members.
 * The tier order and the delays "about 1 day" and "3+ days" are company claims (2024-04-25).
 * The engineer delay, the one-change-a-day pace, and the evaluator row are ILLUSTRATIVE.
 */

const X0 = 210;
const DAY = 96; // px per day, so 5 days reach x = 690
const x = (d: number) => X0 + d * DAY;
const ROW_Y = { change: 52, eng: 112, ann: 172, mem: 232, auto: 292 } as const;
const AXIS_Y = 336;

interface Step {
  caption: string;
  /** Which tier rows are visible. */
  rows: number;
  /** Extra changes shown on the change row. */
  stacked?: boolean;
  /** Draw the model-based evaluator row. */
  auto?: boolean;
  active: 'change' | 'eng' | 'ann' | 'mem' | 'stack' | 'auto';
}

const steps: Step[] = [
  {
    caption: 'You change a prompt on day 0. Now you need to know whether the product got better or worse. LinkedIn uses three groups of judges. Each one answers at a different speed.',
    rows: 0,
    active: 'change',
  },
  {
    caption: 'Engineers check first. They run a fast, coarse test on a limited set of examples and get a directional signal. The post gives no time, only "fast". We draw it as a few minutes (illustrative). It is cheap and quick, and it can miss things.',
    rows: 1,
    active: 'eng',
  },
  {
    caption: `Annotators check second. A linguist team grades up to ${ANNOTATED_PER_DAY} conversations a day on quality, hallucination rate, Responsible AI violations, coherence, and style. The post says the turnaround is about 1 day (company claim).`,
    rows: 2,
    active: 'ann',
  },
  {
    caption: 'Members check last. Real users are the final judges and give the scale, but the post says some metrics take 3 or more days for a single change. The arrow means the wait can run longer.',
    rows: 3,
    active: 'mem',
  },
  {
    caption: `Now stack changes. Say the team ships one change a day (illustrative). By the time the member signal for the day-0 change arrives on day 3, ${changesBefore(3)} newer changes are already in. Is a drop in the metric caused by change 0, 1, or 2? The slow tier cannot say.`,
    rows: 3,
    stacked: true,
    active: 'stack',
  },
  {
    caption: `A model-based evaluator tries to copy the annotator's metrics at engineer speed. The post says this is work in progress, with some success on hallucination detection and no accuracy figure. If it works, the team gets the day-1 signal in minutes. Without it, a 10-day window holds ${cyclesIn(10, 1)} annotator cycles or ${cyclesIn(10, 3)} member cycles.`,
    rows: 3,
    stacked: true,
    auto: true,
    active: 'auto',
  },
];

function Bar({ from, to, y, tone, dashed, label, open }: { from: number; to: number; y: number; tone: string; dashed?: boolean; label: string; open?: boolean }) {
  const w = Math.max((to - from) * DAY, 8);
  const cx = x(from) + w / 2;
  const inside = w > 150;
  return (
    <g>
      <SketchBox cx={cx} cy={y} w={w} h={32} r={8} seed={seedOf(`tier${y}${from}${to}`)} stroke={tone} fill={tone} dashed={dashed} strokeWidth={1.4} />
      {open && <SketchArrow points={[[x(to) + 6, y], [x(to) + 52, y]]} dashed stroke={tone} seed={seedOf(`open${y}`)} />}
      <HandText x={inside ? cx : x(to) + (open ? 60 : 12)} y={y} anchor={inside ? 'middle' : 'start'} size={TEXT_SIZES.note} color="var(--fg)">
        {label}
      </HandText>
    </g>
  );
}

export default function Ai14LinkedinTiers() {
  return (
    <AnimFrame title="Three evaluation tiers and how long each one takes" steps={steps} interval={6500}>
      {(_, s) => {
        const tone = (id: Step['active'], base: string) => (s.active === id ? 'var(--accent)' : base);
        return (
          <SketchSvg width={720} height={366} label="Timeline over five days of the three evaluation tiers: engineers answer in minutes, annotators in about one day, members in three or more days">
            <HandText x={24} y={ROW_Y.change} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
              Prompt changes
            </HandText>
            <SketchBox cx={x(0)} cy={ROW_Y.change} w={22} h={22} r={6} seed={seedOf('ch0')} stroke={tone('change', 'var(--fg)')} fill={tone('change', 'var(--muted)')} />
            <HandText x={x(0) + 22} y={ROW_Y.change} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              {s.stacked ? 'change 0' : 'change on day 0'}
            </HandText>
            {s.stacked && (
              <>
                {[1, 2].map((d) => (
                  <g key={d}>
                    <SketchBox cx={x(d)} cy={ROW_Y.change} w={22} h={22} r={6} seed={seedOf(`ch${d}`)} stroke={tone('stack', 'var(--warn)')} fill={tone('stack', 'var(--warn)')} />
                    <HandText x={x(d) + 22} y={ROW_Y.change} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                      {`change ${d}`}
                    </HandText>
                  </g>
                ))}
              </>
            )}

            {s.rows >= 1 && (
              <>
                <HandText x={24} y={ROW_Y.eng} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                  Engineers
                </HandText>
                <Bar from={0} to={TIERS[0].delayDays} y={ROW_Y.eng} tone={tone('eng', 'var(--ok)')} label="minutes, coarse (illustrative)" />
              </>
            )}
            {s.rows >= 2 && (
              <>
                <HandText x={24} y={ROW_Y.ann} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                  Annotators
                </HandText>
                <Bar from={0} to={TIERS[1].delayDays} y={ROW_Y.ann} tone={tone('ann', 'var(--ok)')} label="about 1 day" />
              </>
            )}
            {s.rows >= 3 && (
              <>
                <HandText x={24} y={ROW_Y.mem} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                  Members
                </HandText>
                <Bar from={0} to={TIERS[2].delayDays} y={ROW_Y.mem} tone={tone('mem', 'var(--ok)')} label="3 or more days" open />
              </>
            )}
            {s.stacked && (
              <>
                <SketchArrow points={[[x(3), ROW_Y.mem - 20], [x(3), ROW_Y.change + 18]]} dashed stroke={tone('stack', 'var(--warn)')} seed={seedOf('stackline')} />
                <HandText x={x(3) + 14} y={ROW_Y.change} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  result for change 0
                </HandText>
              </>
            )}
            {s.auto && (
              <>
                <HandText x={24} y={ROW_Y.auto} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                  Model evaluator
                </HandText>
                <Bar from={0} to={0.1} y={ROW_Y.auto} tone="var(--accent)" dashed label="in progress, accuracy not published" />
              </>
            )}

            {[0, 1, 2, 3, 4, 5].map((d) => (
              <HandText key={d} x={x(d)} y={AXIS_Y} size={TEXT_SIZES.note} mono color="var(--muted)">
                {String(d)}
              </HandText>
            ))}
            <HandText x={X0 - 26} y={AXIS_Y} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              days after the change
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

const X0 = 60;
const DAY = 24; // px per day, days 0..26
const dx = (d: number) => X0 + d * DAY;

interface Step {
  caption: string;
  /** What is drawn. */
  stage: 'delay' | 'random' | 'time';
}

const steps: Step[] = [
  {
    stage: 'delay',
    caption: 'A payment is made on day 3. Nothing says it is fraud yet. The cardholder notices and files a dispute on day 17. The label "fraud" exists only from day 17. Until then the row looks like a good payment.',
  },
  {
    stage: 'random',
    caption: 'A random split shuffles all rows. Training rows now come from days both before and after the test rows. The model can learn the fraud pattern of day 20 and be tested on day 12. In production it never sees the future. The score is too good.',
  },
  {
    stage: 'time',
    caption: 'A time split trains on days up to a cut-off and tests on days after it. It also leaves a gap for label delay, so recent rows with unknown labels are not treated as good. This matches what production sees.',
  },
];

function Day({ d, tone, y }: { d: number; tone: string; y: number }) {
  return <SketchBox cx={dx(d)} cy={y} w={20} h={20} r={6} seed={seedOf(`lt-${d}-${y}-${tone}`)} stroke={tone} fill={tone} />;
}

export default function AiE1LabelTimeline() {
  return (
    <AnimFrame title="Label delay and a leaky split" steps={steps} interval={6000}>
      {(_, s) => (
        <SketchSvg width={720} height={380} label="Timeline of days with payments, a delayed fraud label, and train and test splits.">
          <SketchArrow points={[[X0 - 10, 180], [X0 + 26 * DAY + 20, 180]]} seed={seedOf('lt-axis')} stroke="var(--muted)" />
          <HandText x={X0 + 26 * DAY + 20} y={206} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">time (days)</HandText>
          {s.stage === 'delay' && (
            <g>
              <Day d={3} tone="var(--warn)" y={180} />
              <HandText x={dx(3)} y={146} size={TEXT_SIZES.note}>payment, day 3</HandText>
              <Day d={17} tone="var(--bad)" y={180} />
              <HandText x={dx(17)} y={146} size={TEXT_SIZES.note} color="var(--bad)">dispute, day 17</HandText>
              <SketchArrow points={[[dx(3) + 14, 230], [dx(17) - 14, 230]]} head="both" seed={seedOf('lt-delay')} stroke="var(--warn)" dashed />
              <HandText x={(dx(3) + dx(17)) / 2} y={256} size={TEXT_SIZES.label} color="var(--warn)">label delay: 14 days</HandText>
              <HandText x={dx(10)} y={90} size={TEXT_SIZES.label}>Looks like a good payment until the label lands</HandText>
            </g>
          )}
          {s.stage === 'random' && (
            <g>
              {Array.from({ length: 12 }, (_, i) => {
                const d = 1 + i * 2;
                const train = [0, 1, 3, 4, 6, 7, 9, 10].includes(i);
                const tone = train ? 'var(--accent)' : 'var(--warn)';
                return (
                  <g key={d}>
                    <Day d={d} tone={tone} y={180} />
                    <HandText x={dx(d)} y={216} size={TEXT_SIZES.note} color={tone}>{train ? 'train' : 'test'}</HandText>
                  </g>
                );
              })}
              <HandText x={dx(13)} y={110} size={TEXT_SIZES.label} color="var(--bad)">Train rows sit after test rows: the model sees the future</HandText>
              <SketchArrow points={[[dx(21), 140], [dx(11), 160]]} seed={seedOf('lt-leak')} stroke="var(--bad)" />
            </g>
          )}
          {s.stage === 'time' && (
            <g>
              {Array.from({ length: 12 }, (_, i) => {
                const d = 1 + i * 2;
                const tone = d <= 13 ? 'var(--accent)' : d <= 17 ? 'var(--muted)' : 'var(--warn)';
                const name = d <= 13 ? 'train' : d <= 17 ? 'gap' : 'test';
                return (
                  <g key={d}>
                    <Day d={d} tone={tone} y={180} />
                    <HandText x={dx(d)} y={216} size={TEXT_SIZES.note} color={tone}>{name}</HandText>
                  </g>
                );
              })}
              <SketchArrow points={[[dx(14), 130], [dx(14), 160]]} head="none" dashed seed={seedOf('lt-cut')} stroke="var(--ok)" />
              <HandText x={dx(14)} y={112} size={TEXT_SIZES.label} color="var(--ok)">cut-off: train only on the past</HandText>
              <HandText x={dx(15)} y={256} size={TEXT_SIZES.note} color="var(--muted)">gap: labels still arriving</HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

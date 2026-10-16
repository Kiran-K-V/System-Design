import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * Order bias in few-shot prompts. Real numbers: Zhao et al. 2021, "Calibrate Before Use" (GPT-3).
 * Steps marked illustrative show direction only and carry no measured value.
 */
interface Bar {
  label: string;
  v: number;
  tone: 'accent' | 'bad' | 'ok' | 'muted';
}
interface Step {
  caption: string;
  shots: string[];
  heading: string;
  unit: string;
  bars: Bar[];
  tag: string;
  notes?: string[];
}
const col = (t: Bar['tone']) => `var(--${t})`;

const steps: Step[] = [
  {
    caption: 'The task is sentiment labelling. The prompt holds four labelled examples, then the new review. The examples are the only thing the model sees about the task. P means Positive, N means Negative.',
    shots: ['P', 'P', 'P', 'N'],
    heading: 'Task',
    unit: '',
    bars: [],
    tag: '',
    notes: ['Label a review as', 'P (Positive) or N (Negative)', 'Which label will it pick?'],
  },
  {
    caption: 'Zhao et al. (2021) tested GPT-3 with the order P P P N. They report that this order leads to "nearly 90%" Negative predictions. The last label in the prompt wins, even though three of four examples were Positive. This is recency bias.',
    shots: ['P', 'P', 'P', 'N'],
    heading: 'Share of predictions',
    unit: '%',
    bars: [
      { label: 'Negative', v: 90, tone: 'bad' },
      { label: 'Positive', v: 10, tone: 'muted' },
    ],
    tag: 'paper: nearly 90% (bar drawn at 90)',
  },
  {
    caption: 'Now keep the same four examples and move the lone N to the front: N P P P. The pull flips toward Positive. The bars show direction only. They are illustrative, not a measured result.',
    shots: ['N', 'P', 'P', 'P'],
    heading: 'Share of predictions',
    unit: '%',
    bars: [
      { label: 'Negative', v: 25, tone: 'muted' },
      { label: 'Positive', v: 75, tone: 'accent' },
    ],
    tag: 'illustrative',
  },
  {
    caption: 'Order moves accuracy, not only the label mix. For 4-shot SST-2 on GPT-3 2.7B, the paper reports that permuting the examples "can cause accuracy to go from near chance (54.3%) to near state-of-the-art (93.4%)". Same examples, same model, same test set.',
    shots: ['?', '?', '?', '?'],
    heading: 'Accuracy across orders',
    unit: '%',
    bars: [
      { label: 'Worst order', v: 54.3, tone: 'bad' },
      { label: 'Best order', v: 93.4, tone: 'ok' },
    ],
    tag: 'paper: SST-2, 4-shot, GPT-3 2.7B',
  },
  {
    caption: 'The fix is a process. Balance the labels. Shuffle the order and run several orders. Report the spread, not one score. Then test on held-out cases that are not in the prompt. The paper also finds that variance stays high with more examples.',
    shots: ['P', 'N', 'N', 'P'],
    heading: 'A test plan',
    unit: '',
    bars: [],
    tag: '',
    notes: ['Balanced labels: 2 P, 2 N', 'Run 3 or more orders per K', 'Report mean and spread', 'Score on held-out cases'],
  },
];

export default function Ai4ShotWalk() {
  return (
    <AnimFrame title="Same examples, different order" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={720} height={290} label={`Step ${i + 1} of the few-shot order demo`}>
          <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading}>
            Examples in the prompt
          </HandText>
          {s.shots.map((t, k) => {
            const c = t === 'P' ? 'var(--ok)' : t === 'N' ? 'var(--bad)' : 'var(--muted)';
            return (
              <g key={k}>
                <SketchBox cx={70 + k * 84} cy={90} w={64} h={44} r={8} seed={seedOf(`sw-${i}-${k}`)} fill={c} stroke={c} />
                <HandText x={70 + k * 84} y={90} size={TEXT_SIZES.label} mono>
                  {t}
                </HandText>
              </g>
            );
          })}
          <HandText x={24} y={160} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            then: the new review to label
          </HandText>
          <HandText x={400} y={26} anchor="start" size={TEXT_SIZES.heading}>
            {s.heading}
          </HandText>
          {s.bars.map((b, k) => {
            const y = 80 + k * 70;
            const w = Math.max(6, (b.v / 100) * 200);
            return (
              <g key={b.label}>
                <HandText x={400} y={y - 24} anchor="start" size={TEXT_SIZES.label}>
                  {b.label}
                </HandText>
                <SketchBox cx={400 + w / 2} cy={y + 4} w={w} h={28} r={6} seed={seedOf(`swb-${i}-${k}`)} fill={col(b.tone)} stroke={col(b.tone)} />
                <HandText x={400 + w + 10} y={y + 4} anchor="start" size={TEXT_SIZES.label} mono color={col(b.tone)}>
                  {`${b.v}${s.unit}`}
                </HandText>
              </g>
            );
          })}
          {(s.notes ?? []).map((n, k) => (
            <HandText key={n} x={400} y={80 + k * 36} anchor="start" size={TEXT_SIZES.label}>
              {n}
            </HandText>
          ))}
          {s.tag && (
            <HandText x={400} y={250} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              {s.tag}
            </HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { SWAP_ROWS, conflictRate } from './Ai8JudgeMath';

interface Step {
  caption: string;
  view: 'order' | 'bars';
  row2?: boolean;
  pick1?: boolean;
  pick2?: boolean;
  bars?: number;
  rule?: boolean;
}

const steps: Step[] = [
  { view: 'order', caption: 'Illustrative case. One question, two answers X and Y. X is the better answer. The judge sees X first and Y second. The judge prompt says "pick the better answer".' },
  { view: 'order', pick1: true, caption: 'The judge picks the answer in the first slot, X. That is the right pick. If this were the whole test, you would trust the judge.' },
  { view: 'order', row2: true, pick1: true, pick2: true, caption: 'Now swap the slots. The content is the same, only the order changed. The judge picks the first slot again, so now it picks Y. The verdict flipped. This is position bias. A judge with it is partly judging the slot.' },
  { view: 'bars', bars: 1, caption: 'Real data (Wang et al. 2023, 80 questions, judge GPT-4, pair Vicuna-13B vs ChatGPT). The verdict changed on 37 of 80 questions when the order was swapped: a conflict rate of 46.3%. The two answers were close in quality.' },
  { view: 'bars', bars: 2, caption: 'Same questions, same pair, but the judge is ChatGPT. The verdict changed on 66 of 80 questions: 82.5%. The paper reports that GPT-4 tends to favor the first slot and ChatGPT the second. A weaker judge can be mostly slot-driven.' },
  { view: 'bars', bars: 3, caption: 'Now an easy pair (Vicuna-13B vs Alpaca-13B, judge GPT-4). Only 4 of 80 verdicts changed: 5.0%. The paper finds the bias is strongest when two answers are close, which is the case you most want to measure.' },
  { view: 'bars', bars: 3, rule: true, caption: 'The fix is cheap. Judge both orders. Count a win only when both orders agree. When they disagree, count a tie, and log the conflict rate as a health metric of your judge. The paper reports that scoring both orders raised ChatGPT-judge accuracy against human labels from 44.4% to 58.7% when combined with sampling several evidence-then-score outputs.' },
];

const TONES = ['var(--warn)', 'var(--bad)', 'var(--ok)'];
const LABELS = ['GPT-4 judge\nclose pair', 'ChatGPT judge\nclose pair', 'GPT-4 judge\neasy pair'];

function OrderRow({ y, name, first, second, pickFirst, tag }: { y: number; name: string; first: string; second: string; pickFirst: boolean | undefined; tag: string }) {
  const picked = pickFirst !== undefined;
  return (
    <g>
      <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
        {name}
      </HandText>
      <HandText x={150} y={y - 36} size={TEXT_SIZES.note} color="var(--muted)">first slot</HandText>
      <HandText x={290} y={y - 36} size={TEXT_SIZES.note} color="var(--muted)">second slot</HandText>
      <SketchBox cx={150} cy={y} w={110} h={44} r={8} seed={seedOf(`jsw1${tag}`)} stroke={picked && pickFirst ? 'var(--accent)' : 'var(--muted)'} fill={picked && pickFirst ? 'var(--accent)' : undefined} strokeWidth={picked && pickFirst ? 2.2 : 1.4} />
      <HandText x={150} y={y} size={TEXT_SIZES.label}>{`answer ${first}`}</HandText>
      <SketchBox cx={290} cy={y} w={110} h={44} r={8} seed={seedOf(`jsw2${tag}`)} stroke={picked && !pickFirst ? 'var(--accent)' : 'var(--muted)'} fill={picked && !pickFirst ? 'var(--accent)' : undefined} strokeWidth={picked && !pickFirst ? 2.2 : 1.4} />
      <HandText x={290} y={y} size={TEXT_SIZES.label}>{`answer ${second}`}</HandText>
      <SketchArrow points={[[352, y], [418, y]]} seed={seedOf(`jswa${tag}`)} stroke="var(--muted)" />
      <SketchBox cx={480} cy={y} w={110} h={44} r={8} seed={seedOf(`jswj${tag}`)} stroke="var(--muted)" />
      <HandText x={480} y={y} size={TEXT_SIZES.label}>judge</HandText>
      {picked && (
        <HandText x={560} y={y} anchor="start" size={TEXT_SIZES.label} color="var(--accent)" mono>
          {`picks ${pickFirst ? first : second}`}
        </HandText>
      )}
    </g>
  );
}

export default function Ai8JudgeSwap() {
  return (
    <AnimFrame title="Swap the order and the verdict can flip" steps={steps} interval={5600}>
      {(_, s) => (
        <SketchSvg width={720} height={300} label={s.view === 'order' ? 'A judge picks one answer, then the order is swapped.' : 'Conflict rate when answer order is swapped, for three judge and pair combinations.'}>
          {s.view === 'order' ? (
            <>
              <OrderRow y={80} name="Order 1" first="X" second="Y" pickFirst={s.pick1 ? true : undefined} tag="a" />
              {s.row2 && <OrderRow y={190} name="Order 2" first="Y" second="X" pickFirst={s.pick2 ? true : undefined} tag="b" />}
              {s.row2 && (
                <HandText x={360} y={256} size={TEXT_SIZES.heading} color="var(--bad)">
                  same pair, different winner
                </HandText>
              )}
            </>
          ) : (
            <>
              <HandText x={24} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                Share of 80 questions where the verdict changed after the swap
              </HandText>
              {[0, 2, 1].map((rowIdx, i) => {
                if (i >= (s.bars ?? 0)) return null;
                const r = SWAP_ROWS[rowIdx];
                const rate = conflictRate(r);
                const w = Math.max(rate * 380, 6);
                const y = 78 + i * 62;
                const newest = i === (s.bars ?? 0) - 1;
                const tone = newest && !s.rule ? 'var(--accent)' : TONES[i];
                return (
                  <g key={i}>
                    <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.label}>{LABELS[i]}</HandText>
                    <SketchBox cx={232 + w / 2} cy={y} w={w} h={30} r={6} seed={seedOf(`jsb${i}`)} stroke={tone} fill={tone} strokeWidth={newest ? 2.2 : 1.4} />
                    <HandText x={232 + w + 10} y={y} anchor="start" size={TEXT_SIZES.note} mono color={tone}>
                      {`${r.conflicts}/80 = ${(rate * 100).toFixed(1)}%`}
                    </HandText>
                  </g>
                );
              })}
              {s.rule && (
                <>
                  <SketchBox cx={360} cy={266} w={640} h={44} r={8} seed={seedOf('jsrule')} stroke="var(--accent)" fill="var(--accent-soft)" />
                  <HandText x={360} y={266} size={TEXT_SIZES.label} color="var(--accent)">
                    both orders agree: win. They disagree: tie. Log the conflict rate.
                  </HandText>
                </>
              )}
            </>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

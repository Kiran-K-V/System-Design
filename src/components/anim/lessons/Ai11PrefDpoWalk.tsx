import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { BETA, DPO_STATES, dpoLoss, margin, pullWeight } from './Ai11PrefLogic';

interface Step {
  caption: string;
  state: number;
  /** Which bar is active this step. */
  focus: 'both' | 'chosen' | 'none';
  bad?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'One pair: a prompt, a chosen answer and a rejected answer. Training has not started, so the model equals its frozen reference copy. Both answers are exactly as likely as before. Both log-ratios are 0, the margin is 0, and the loss is 0.693: the model is guessing which answer is better.',
    state: 0,
    focus: 'none',
  },
  {
    caption:
      'Early training. The chosen answer is now a little more likely than before (log-ratio +1.0). The rejected answer is less likely (-1.5). With beta = 0.1, the margin is 0.1 x (1.0 - (-1.5)) = 0.25, and the loss falls to 0.576. Nothing is generated here. Training only re-scores answers that are already in the data.',
    state: 1,
    focus: 'both',
  },
  {
    caption:
      'The model now ranks the pair correctly by a wide gap. The margin is 0.1 x 6 = 0.6 and the loss is 0.437. The pull strength has dropped from 0.50 to 0.35. A pair the model already ranks well pulls less. A pair it ranks wrongly pulls hard.',
    state: 2,
    focus: 'both',
  },
  {
    caption:
      'Later the margin is 1.1 and the loss is 0.287. The rejected answer is now about 0.03% as likely as before training (e to the power -8). The model has learned to steer away from that kind of answer. The loss measures only the gap between the two answers. It does not measure whether the chosen answer is good.',
    state: 3,
    focus: 'both',
  },
  {
    caption:
      'A trap. Here the chosen answer is less likely than before (-2.0), and the rejected answer fell much further (-9.0). The margin is 0.7, so the loss is 0.403, lower than at the start. The loss looks better while the chosen answer got worse. The field notes below explain when this happens. Log the chosen answer\'s log-ratio, not only the loss.',
    state: 4,
    focus: 'chosen',
    bad: true,
  },
];

const CX = 400;
const SCALE = 34;
const clampX = (v: number) => CX + Math.max(-9.6, Math.min(3.4, v)) * SCALE;

function Bar({ y, v, label, tone, active, seed }: { y: number; v: number; label: string; tone: string; active: boolean; seed: string }) {
  const x1 = clampX(v);
  const w = Math.max(Math.abs(x1 - CX), 3);
  return (
    <g>
      <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.label} color={active ? tone : 'var(--fg)'}>
        {label}
      </HandText>
      <SketchBox cx={(x1 + CX) / 2} cy={y} w={w} h={34} r={6} seed={seedOf(seed)} stroke={tone} fill={tone} strokeWidth={active ? 2.2 : 1.4} />
      <HandText x={v >= 0 ? x1 + 10 : x1 - 10} y={y} anchor={v >= 0 ? 'start' : 'end'} size={TEXT_SIZES.label} mono color={tone}>
        {(v > 0 ? '+' : '') + v.toFixed(1)}
      </HandText>
    </g>
  );
}

export default function Ai11PrefDpoWalk() {
  return (
    <AnimFrame title="One DPO pair, step by step (illustrative numbers)" steps={steps} interval={6500}>
      {(_, s) => {
        const st = DPO_STATES[s.state];
        const chosenTone = s.bad ? 'var(--warn)' : 'var(--ok)';
        return (
          <SketchSvg width={720} height={300} label={`Log-ratio of the chosen answer ${st.dw} and the rejected answer ${st.dl}. Loss ${dpoLoss(st.dw, st.dl).toFixed(3)}.`}>
            <HandText x={24} y={22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              log-ratio: how much more or less likely than before training. 0 = unchanged.
            </HandText>
            <SketchArrow points={[[CX, 44], [CX, 150]]} head="none" seed={seedOf('dpo-axis')} stroke="var(--muted)" dashed />
            <Bar y={78} v={st.dw} label="Chosen" tone={chosenTone} active={s.focus !== 'none'} seed={`dpo-w${s.state}`} />
            <Bar y={122} v={st.dl} label="Rejected" tone="var(--bad)" active={s.focus === 'both'} seed={`dpo-l${s.state}`} />
            <HandText x={24} y={182} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              {`beta = ${BETA}`}
            </HandText>
            <HandText x={24} y={214} anchor="start" size={TEXT_SIZES.label} mono>
              {`margin = beta x (chosen - rejected) = ${margin(st.dw, st.dl).toFixed(2)}`}
            </HandText>
            <HandText x={24} y={244} anchor="start" size={TEXT_SIZES.label} mono color={s.bad ? 'var(--warn)' : 'var(--accent)'}>
              {`loss = -ln sigmoid(margin) = ${dpoLoss(st.dw, st.dl).toFixed(3)}`}
            </HandText>
            <HandText x={24} y={274} anchor="start" size={TEXT_SIZES.label} mono color="var(--muted)">
              {`pull strength = ${pullWeight(st.dw, st.dl).toFixed(2)}`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** The old model's log only has labels for what the old model showed. Items are illustrative. */

type St = 'idle' | 'shown' | 'clicked' | 'new' | 'unknown' | 'clicked-new';

interface Step {
  caption: string;
  states: St[];
  line: string;
}

const ITEMS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const steps: Step[] = [
  {
    caption: 'The catalogue has eight items. The old model is live. For this user it shows its top three: A, B and C. Items D to H are not shown to this user at all.',
    states: ['shown', 'shown', 'shown', 'idle', 'idle', 'idle', 'idle', 'idle'],
    line: 'old model shows A, B, C',
  },
  {
    caption: 'The user clicks B. The log now says: A shown, no click. B shown, click. C shown, no click. For D to H the log says nothing, because nobody saw them. "No data" is not the same as "no click".',
    states: ['shown', 'clicked', 'shown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown'],
    line: 'log: labels exist only for A, B, C',
  },
  {
    caption: 'You build a new model. Its top three for this user are D, E and A. You test it offline by replaying the log. D and E have no label, so the replay treats them as not clicked. The new model is punished for picks the log cannot judge.',
    states: ['new', 'clicked', 'shown', 'new', 'new', 'unknown', 'unknown', 'unknown'],
    line: 'offline replay: D and E counted as misses',
  },
  {
    caption: 'In a live test D and E are shown for the first time, and the user clicks D. The truth was available only online. The offline number understated the new model, and it could also have overstated it if the old model had hidden a bad item.',
    states: ['shown', 'idle', 'idle', 'clicked-new', 'new', 'idle', 'idle', 'idle'],
    line: 'online test: D is clicked',
  },
  {
    caption: 'The loop. If you only train on what you showed, the model learns to show what it already showed. To break the loop, send a small share of traffic through random or exploratory choices and keep those logs apart, as a clean test set.',
    states: ['shown', 'shown', 'shown', 'new', 'new', 'unknown', 'unknown', 'unknown'],
    line: 'keep a small exploration slice',
  },
];

const STYLE: Record<St, { stroke: string; fill?: string; dashed?: boolean; word: string }> = {
  idle: { stroke: 'var(--muted)', dashed: true, word: 'not shown' },
  shown: { stroke: 'var(--fg)', word: 'shown' },
  clicked: { stroke: 'var(--ok)', fill: 'var(--ok)', word: 'clicked' },
  new: { stroke: 'var(--accent)', fill: 'var(--accent-soft)', word: 'new top 3' },
  unknown: { stroke: 'var(--warn)', dashed: true, word: 'no label' },
  'clicked-new': { stroke: 'var(--ok)', fill: 'var(--ok)', word: 'clicked' },
};

export default function AiE1LogBias() {
  return (
    <AnimFrame title="The log only knows what the old model showed" steps={steps} interval={6500}>
      {(_, s) => (
        <SketchSvg width={720} height={260} label={`Eight items, A to H. ${s.line}.`}>
          {ITEMS.map((id, i) => {
            const st = STYLE[s.states[i]];
            const cx = 56 + i * 87;
            return (
              <g key={id}>
                <SketchBox cx={cx} cy={100} w={68} h={60} r={8} seed={seedOf(`lb-${id}`)} stroke={st.stroke} fill={st.fill} dashed={st.dashed} strokeWidth={s.states[i] === 'idle' ? 1.4 : 2.2} />
                <HandText x={cx} y={100} size={TEXT_SIZES.heading}>{id}</HandText>
                <HandText x={cx} y={150} size={TEXT_SIZES.note} color={st.stroke === 'var(--fg)' ? 'var(--muted)' : st.stroke}>{st.word}</HandText>
              </g>
            );
          })}
          <HandText x={24} y={220} anchor="start" size={TEXT_SIZES.label} color="var(--accent)">{s.line}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

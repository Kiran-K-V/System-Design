import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Row {
  q: string;
  out: string;
  sub: string;
}

const ROWS: Row[] = [
  { q: 'Can rules or heuristics hit the bar?', out: 'Ship rules, no model', sub: 'Google ML Rule 1' },
  { q: 'Does a hosted API plus a prompt hit it?', out: 'Ship API + prompt', sub: 'the default start' },
  { q: 'Does it fail for missing facts?', out: 'Add retrieval', sub: 'facts go in context' },
  { q: 'Does it fail on behavior or format?', out: 'Fine-tune', sub: 'after prompts fail' },
  { q: 'Do privacy, unit cost, or latency force it?', out: 'Self-host', sub: 'you run the GPUs' },
];

interface Step {
  caption: string;
  /** Rows answered so far: 'n' = no (continue down), 'y' = yes (exit right). */
  path: ('n' | 'y')[];
  /** Row drawn active. -1 for none. */
  active: number;
}

const steps: Step[] = [
  { caption: 'Scenario (illustrative): a support bot must answer refund questions from company policy, with 90% of golden-set answers correct. Read the tree from the top. Each row is one question. "Yes" exits right. "No" goes down to the next, more expensive option.', path: [], active: 0 },
  { caption: 'Row 1. Rules cannot read free-text questions and match policy wording, so the answer is no. Go down.', path: ['n'], active: 1 },
  { caption: 'Row 2. A hosted model with a prompt scores 71% on the golden set. Below the bar. No. Go down.', path: ['n', 'n'], active: 2 },
  { caption: 'Row 3. The wrong answers all quote old or invented policy. The model lacks the facts, so this is a yes. Add retrieval: fetch the policy text and put it in the prompt.', path: ['n', 'n', 'y'], active: -1 },
  { caption: 'Re-run the eval after every change. With retrieval the score is 93% (illustrative). The bar is met. Stop here. Rows 4 and 5 cost more and are not needed.', path: ['n', 'n', 'y'], active: -1 },
  { caption: 'A different team: answers are correct but must be strict JSON in a house style that long prompts cannot hold. Rows 1 to 3 are no. Row 4 is yes: fine-tune for behavior and format, not for facts.', path: ['n', 'n', 'n', 'y'], active: -1 },
  { caption: 'A third team: 20 billion tokens per month, and the data may not leave their network. Rows 1 to 4 are no, row 5 is yes: self-host. The calculator below shows where the cost crossover sits.', path: ['n', 'n', 'n', 'n', 'y'], active: -1 },
];

const QX = 190;
const AX = 575;
const Y0 = 46;
const STEP = 66;

export default function Ai0DecisionTree() {
  return (
    <AnimFrame title="Build, buy, or fine-tune: the decision path" steps={steps}>
      {(i, s) => (
        <SketchSvg width={720} height={Y0 + STEP * 4 + 50} label="Decision tree from rules to self-hosting">
          {ROWS.map((r, k) => {
            const y = Y0 + k * STEP;
            const answered = s.path[k];
            const exit = answered === 'y';
            const isActive = s.active === k;
            const reached = k <= s.path.length;
            const qStroke = isActive ? 'var(--accent)' : answered ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={r.q} opacity={reached || isActive ? 1 : 0.55}>
                <SketchBox cx={QX} cy={y} w={330} h={48} r={8} seed={seedOf(`dq${k}`)} stroke={qStroke} strokeWidth={isActive ? 2.2 : 1.4} fill={isActive ? 'var(--accent-soft)' : undefined} />
                <HandText x={QX} y={y} size={TEXT_SIZES.label}>
                  {r.q}
                </HandText>
                <SketchArrow points={[[QX + 171, y], [AX - 111, y]]} stroke={exit ? 'var(--ok)' : 'var(--muted)'} strokeWidth={exit ? 2.2 : 1.4} seed={seedOf(`dy${k}`)} />
                <HandText x={QX + 190} y={y - 14} size={TEXT_SIZES.note} color={exit ? 'var(--ok)' : 'var(--muted)'}>
                  yes
                </HandText>
                <SketchBox cx={AX} cy={y} w={210} h={52} r={8} seed={seedOf(`da${k}`)} stroke={exit ? 'var(--ok)' : 'var(--muted)'} strokeWidth={exit ? 2.2 : 1.4} fill={exit ? 'var(--ok)' : undefined} />
                <HandText x={AX} y={y - 9} size={TEXT_SIZES.label}>
                  {r.out}
                </HandText>
                <HandText x={AX} y={y + 12} size={TEXT_SIZES.note} color="var(--muted)">
                  {r.sub}
                </HandText>
                {k < ROWS.length - 1 && (
                  <>
                    <SketchArrow points={[[QX, y + 30], [QX, y + STEP - 30]]} stroke={answered === 'n' ? 'var(--warn)' : 'var(--muted)'} strokeWidth={answered === 'n' ? 2.2 : 1.4} seed={seedOf(`dn${k}`)} />
                    <HandText x={QX + 20} y={y + STEP / 2} size={TEXT_SIZES.note} color={answered === 'n' ? 'var(--warn)' : 'var(--muted)'}>
                      no
                    </HandText>
                  </>
                )}
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

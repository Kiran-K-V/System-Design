import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Lever = 0 | 1 | 2;

const LEVERS = [
  { label: 'Prompt', note: 'cheapest first' },
  { label: 'RAG', note: 'adds facts' },
  { label: 'Fine-tune', note: 'changes behavior' },
];

interface Failure {
  label: string;
  lever: Lever;
}

const FAILURES: Failure[] = [
  { label: 'Quotes old policy', lever: 1 },
  { label: 'Skips a rule', lever: 0 },
  { label: 'Off-brand tone', lever: 2 },
  { label: 'No source cited', lever: 1 },
  { label: 'Slow, long prompt', lever: 2 },
];

interface Step {
  caption: string;
  /** Failures sorted so far. The last one in the list is the active one. */
  upto: number;
  readout: string;
}

const steps: Step[] = [
  {
    caption:
      'Error analysis (lesson A8.2) gave five failure types from the golden set. This sort is illustrative. The rule: name the failure first, then pick the cheapest lever that changes that failure. Do not start from "we should fine-tune".',
    upto: -1,
    readout: 'Name the failure, then pick the lever',
  },
  {
    caption:
      'Failure 1: the bot quotes last year\'s refund policy. The model never saw the new policy. This is a facts problem, and facts change. Put the policy text in the context at request time: retrieval. A tuned model would hold the old policy until the next training run.',
    upto: 0,
    readout: 'stale facts -> RAG',
  },
  {
    caption:
      'Failure 2: the bot skips a rule that is already in the system prompt. The model has the facts, and the instruction is unclear or buried. Fix the prompt first: move the rule up, state it as a check, add one example. Re-run the eval. This costs minutes, not a training run.',
    upto: 1,
    readout: 'missed instruction -> prompt',
  },
  {
    caption:
      'Failure 3: answers are right, but the tone is off-brand, and four rounds of prompt edits did not fix it. The prompt lever is spent. This is a behavior and style problem, the case where fine-tuning on example pairs earns its cost.',
    upto: 2,
    readout: 'style after prompt fails -> fine-tune',
  },
  {
    caption:
      'Failure 4: users want a source for each claim. A weight update cannot show where an answer came from. Retrieval returns the passages, so you can cite them. Citations are a retrieval feature.',
    upto: 3,
    readout: 'citations -> RAG',
  },
  {
    caption:
      'Failure 5: a 3,000-token prompt of rules and examples rides on every call, so each request is slow and costly. Tuning moves that behavior into the weights, so the prompt can shrink. The calculator below prices it. This is the second case for fine-tuning: latency and cost.',
    upto: 4,
    readout: 'long prompt on every call -> fine-tune',
  },
  {
    caption:
      'Tally: two failures went to RAG, one to the prompt, two to fine-tuning. Run the levers in cost order and re-run the eval after each. Most teams find that the first two levers remove most failures, so the tuning set is small and well aimed.',
    upto: 4,
    readout: '2 RAG, 1 prompt, 2 fine-tune',
  },
];

const FX = 170;
const LX = 600;
const Y0 = 50;
const DY = 56;
const LY = [Y0 + 28, Y0 + 28 + 2 * DY, Y0 + 28 + 4 * DY];
const toneOf = (l: Lever) => (l === 0 ? 'var(--ok)' : l === 1 ? 'var(--accent)' : 'var(--warn)');

export default function Ai11WhenTriage() {
  return (
    <AnimFrame title="Sort each failure to a lever" steps={steps} interval={6000}>
      {(i, s) => (
        <SketchSvg width={720} height={Y0 + 4 * DY + 98} label="Five failure types are each routed to prompt, retrieval, or fine-tuning">
          <HandText x={FX} y={22} size={TEXT_SIZES.heading} color="var(--muted)">
            Failure from error analysis
          </HandText>
          <HandText x={LX} y={22} size={TEXT_SIZES.heading} color="var(--muted)">
            Lever
          </HandText>
          {LEVERS.map((l, k) => {
            const used = s.upto >= 0 && FAILURES.slice(0, s.upto + 1).some((f) => f.lever === k);
            const on = s.upto >= 0 && i < 6 && FAILURES[s.upto].lever === k;
            return (
              <g key={l.label}>
                <SketchBox cx={LX} cy={LY[k]} w={190} h={60} r={8} seed={seedOf(`wt-l${k}`)} stroke={on ? 'var(--accent)' : used ? 'var(--ok)' : 'var(--muted)'} strokeWidth={on ? 2.2 : 1.4} fill={on ? 'var(--accent)' : undefined} dashed={!used && !on} />
                <HandText x={LX} y={LY[k] - 10} size={TEXT_SIZES.label}>
                  {l.label}
                </HandText>
                <HandText x={LX} y={LY[k] + 14} size={TEXT_SIZES.note} color="var(--muted)">
                  {l.note}
                </HandText>
              </g>
            );
          })}
          {FAILURES.map((f, k) => {
            const y = Y0 + k * DY;
            const done = k < s.upto || (k === s.upto && i === 6);
            const act = k === s.upto && i < 6;
            const shown = k <= s.upto;
            return (
              <g key={f.label}>
                <SketchBox cx={FX} cy={y + 28} w={250} h={44} r={8} seed={seedOf(`wt-f${k}`)} stroke={act ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)'} strokeWidth={act ? 2.2 : 1.4} fill={act ? 'var(--accent)' : undefined} dashed={!shown} />
                <HandText x={FX} y={y + 28} size={TEXT_SIZES.label} color={shown ? 'var(--fg)' : 'var(--muted)'}>
                  {f.label}
                </HandText>
                {shown && (
                  <SketchArrow
                    points={[[FX + 130, y + 28], [LX - 100, LY[f.lever]]]}
                    seed={seedOf(`wt-a${k}`)}
                    stroke={act ? 'var(--accent)' : toneOf(f.lever)}
                    strokeWidth={act ? 2.2 : 1.4}
                    dashed={!act}
                  />
                )}
              </g>
            );
          })}
          <SketchBox cx={360} cy={Y0 + 4 * DY + 70} w={620} h={44} r={8} seed={seedOf('wt-read')} fill="var(--accent-soft)" />
          <HandText x={360} y={Y0 + 4 * DY + 71} size={TEXT_SIZES.label} mono color="var(--accent)">
            {s.readout}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

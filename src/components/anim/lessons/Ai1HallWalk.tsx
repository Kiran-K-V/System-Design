import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative. A support bot for a made-up shop whose real return window is 14 days. Probabilities are not from a real model. */
interface Opt {
  t: string;
  p: number;
}
const NO_FACT: Opt[] = [
  { t: '30', p: 0.38 },
  { t: '14', p: 0.27 },
  { t: '60', p: 0.15 },
  { t: '90', p: 0.08 },
  { t: 'other number', p: 0.1 },
  { t: '"I do not know"', p: 0.02 },
];
const WITH_FACT: Opt[] = [
  { t: '30', p: 0.02 },
  { t: '14', p: 0.93 },
  { t: '60', p: 0.01 },
  { t: '90', p: 0.01 },
  { t: 'other number', p: 0.02 },
  { t: '"I do not know"', p: 0.01 },
];

interface Step {
  caption: string;
  context: string[];
  opts: Opt[] | null;
  chosen: number;
  tone: 'accent' | 'bad' | 'ok';
  answer?: string;
  verdict?: string;
}

const steps: Step[] = [
  {
    caption:
      'A shop runs a support bot. The user asks how long they have to return a laptop. The prompt holds the question and nothing else. The real policy (14 days in this made-up shop) is not in the prompt. Every number on this diagram is illustrative.',
    context: ['System: you are a support bot.', 'User: how many days do I have', 'to return a laptop?'],
    opts: null,
    chosen: -1,
    tone: 'accent',
  },
  {
    caption:
      'The model must output a next token after "You can return it within". It has seen thousands of return policies, so many numbers look plausible. The weights hold no fact about this shop. The probability is spread over guesses. "I do not know" has a small share, because that phrase rarely follows this text in training data.',
    context: ['User: how many days do I have', 'to return a laptop?', 'Bot: You can return it within'],
    opts: NO_FACT,
    chosen: -1,
    tone: 'accent',
  },
  {
    caption:
      'The decoder picks the top token, "30". Sampling would pick it 38% of the time and "14" 27% of the time. Either way the output is a clean sentence with a wrong number. The model has no step that says "I lack the data, stop".',
    context: ['User: how many days do I have', 'to return a laptop?', 'Bot: You can return it within'],
    opts: NO_FACT,
    chosen: 0,
    tone: 'bad',
  },
  {
    caption:
      'The rest of the reply is fluent too: "30 days of delivery, in the original box." Nothing in the text marks it as invented. The OpenAI 2025 paper explains why this is the default: most benchmarks give no credit for "I do not know", so a guess scores at least as well, and models learn to guess.',
    context: ['Bot: You can return it within', '30 days of delivery, in the', 'original box.'],
    opts: null,
    chosen: -1,
    tone: 'bad',
    answer: 'Fluent, confident, wrong',
    verdict: 'Real policy: 14 days',
  },
  {
    caption:
      'The cheapest fix is to put the policy text in the prompt and require a quote. The next-token distribution now leans on text that is in front of it. Illustratively, "14" climbs to 93%. A cheap check then confirms the quoted sentence appears in the policy. This is retrieval, covered in module A6. It needs no training run.',
    context: ['Policy: "Laptops may be', 'returned within 14 days."', 'User: how many days to return', 'a laptop?'],
    opts: WITH_FACT,
    chosen: 1,
    tone: 'ok',
  },
];

const ROW0 = 70;
const ROW = 46;

export default function Ai1HallWalk() {
  return (
    <AnimFrame title="A model fills a gap with a fluent wrong answer" steps={steps} interval={4200}>
      {(i, s) => {
        const tone = s.tone === 'bad' ? 'var(--bad)' : s.tone === 'ok' ? 'var(--ok)' : 'var(--accent)';
        return (
          <SketchSvg width={720} height={380} label={`Step ${i + 1} of a hallucination walk`}>
            <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading}>
              Prompt
            </HandText>
            <SketchBox cx={180} cy={170} w={320} h={170} r={8} seed={seedOf('hw-ctx')} stroke={s.context.length ? 'var(--muted)' : undefined} />
            {s.context.map((l, k) => (
              <HandText key={k} x={36} y={110 + k * 28} anchor="start" size={TEXT_SIZES.label} mono color={k === s.context.length - 1 && s.opts ? 'var(--accent)' : 'var(--fg)'}>
                {l}
              </HandText>
            ))}
            {s.opts && (
              <>
                <SketchArrow points={[[350, 170], [400, 170]]} seed={seedOf('hw-arrow')} />
                <HandText x={405} y={26} anchor="start" size={TEXT_SIZES.heading}>
                  Next-token probability
                </HandText>
                {s.opts.map((o, k) => {
                  const y = ROW0 + k * ROW;
                  const w = Math.max(6, o.p * 120);
                  const on = k === s.chosen;
                  const c = on ? tone : 'var(--muted)';
                  return (
                    <g key={o.t}>
                      <HandText x={405} y={y} anchor="start" size={TEXT_SIZES.label} mono color={on ? tone : 'var(--fg)'}>
                        {o.t}
                      </HandText>
                      <SketchBox cx={405 + 150 + w / 2} cy={y} w={w} h={26} r={6} seed={seedOf(`hw-${i}-${k}`)} fill={c} stroke={c} strokeWidth={on ? 2.2 : 1.4} />
                      <HandText x={405 + 150 + w + 8} y={y} anchor="start" size={TEXT_SIZES.note} mono color={on ? tone : 'var(--muted)'}>
                        {o.p.toFixed(2)}
                      </HandText>
                    </g>
                  );
                })}
              </>
            )}
            {s.answer && (
              <>
                <SketchBox cx={540} cy={150} w={300} h={60} r={8} seed={seedOf('hw-ans')} fill="var(--bad)" stroke="var(--bad)" strokeWidth={2.2} />
                <HandText x={540} y={150} size={TEXT_SIZES.label} color="var(--bad)">
                  {s.answer}
                </HandText>
                <HandText x={540} y={215} size={TEXT_SIZES.label} color="var(--muted)">
                  {s.verdict ?? ''}
                </HandText>
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

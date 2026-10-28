import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'idle' | 'accent' | 'ok' | 'bad' | 'drop';

interface Case {
  draft: string[];
  target: string[];
  accepted: number; // how many draft tokens are kept
}

const MAIN: Case = { draft: ['Paris', ',', 'a', 'big', 'city'], target: ['Paris', ',', 'a', 'large', 'city'], accepted: 3 };
const WORST: Case = { draft: ['Rome', 'is', 'a', 'big', 'city'], target: ['Paris', ',', 'a', 'large', 'city'], accepted: 0 };

interface Step {
  caption: string;
  c: Case;
  showDraft: boolean;
  showTarget: boolean;
  compare: boolean;
  out: number; // tokens shown in the output row
  active: 'draft' | 'target' | 'none';
}

const steps: Step[] = [
  {
    caption: 'The prompt so far is "The capital of France is". Plain decoding would run the large model once per new token. Speculative decoding first asks a small, fast model to guess a few tokens ahead.',
    c: MAIN, showDraft: false, showTarget: false, compare: false, out: 0, active: 'none',
  },
  {
    caption: 'Step 1: the small draft model guesses five tokens, one after another. Each guess is cheap, because the model is small. The guesses are only proposals. Nothing is final yet. (The words are illustrative.)',
    c: MAIN, showDraft: true, showTarget: false, compare: false, out: 0, active: 'draft',
  },
  {
    caption: 'Step 2: the large model runs once over all five positions together. For every position it says which token it would have written there, given the guess before it. This is one pass. It reads the weights once, as a prefill does.',
    c: MAIN, showDraft: true, showTarget: true, compare: false, out: 0, active: 'target',
  },
  {
    caption: 'Step 3: compare from left to right. Positions 1, 2, and 3 match, so the guesses are kept. Position 4 does not match: the draft said "big", the large model says "large". We stop there. Position 5 is thrown away, because it was built on a wrong guess.',
    c: MAIN, showDraft: true, showTarget: true, compare: true, out: 0, active: 'none',
  },
  {
    caption: 'Step 4: the output takes the three kept tokens, then the large model\'s own token for position 4. That last token is free: the pass already computed it. So one large-model pass produced 4 tokens.',
    c: MAIN, showDraft: true, showTarget: true, compare: true, out: 4, active: 'none',
  },
  {
    caption: 'Compare with plain decoding. It needs 4 large-model passes for the same 4 tokens. The text is the same, because every kept token is one the large model would have chosen. The next round starts after "large".',
    c: MAIN, showDraft: false, showTarget: false, compare: false, out: 4, active: 'none',
  },
  {
    caption: 'Worst case: the draft is wrong at position 1 ("Rome" instead of "Paris"). Nothing is kept, but the large model\'s own token for position 1 is still used. So a pass always yields at least one token. A bad draft wastes the small model\'s work and the extra arithmetic, never the progress.',
    c: WORST, showDraft: true, showTarget: true, compare: true, out: 1, active: 'none',
  },
];

const X = (i: number) => 140 + i * 110;
const Y = { draft: 110, target: 235, out: 345 };

function toneOf(step: Step, i: number, row: 'draft' | 'target'): Tone {
  if (!step.compare) return step.active === row ? 'accent' : 'idle';
  const { accepted } = step.c;
  if (i < accepted) return 'ok';
  if (i === accepted) return 'bad';
  return 'drop';
}

const stroke: Record<Tone, string> = { idle: 'var(--muted)', accent: 'var(--accent)', ok: 'var(--ok)', bad: 'var(--bad)', drop: 'var(--muted)' };

function Tok({ cx, cy, text, tone, seed }: { cx: number; cy: number; text: string; tone: Tone; seed: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={92} h={44} r={8} seed={seedOf(seed)} stroke={stroke[tone]} strokeWidth={tone === 'accent' ? 2.2 : 1.4} fill={tone === 'ok' || tone === 'bad' || tone === 'accent' ? stroke[tone] : undefined} dashed={tone === 'drop'} />
      <HandText x={cx} y={cy + 1} size={TEXT_SIZES.label} mono color={tone === 'drop' ? 'var(--muted)' : 'var(--fg)'}>
        {text}
      </HandText>
    </g>
  );
}

export default function AiE3SpecWalk() {
  return (
    <AnimFrame title="Speculative decoding: draft five, verify in one pass" steps={steps} interval={6500}>
      {(_, s) => {
        const c = s.c;
        const outTokens = s.out === 0 ? [] : [...c.draft.slice(0, c.accepted), c.target[c.accepted]].slice(0, s.out);
        return (
          <SketchSvg width={720} height={400} label="A small model drafts five tokens. The large model checks them in one pass and keeps the first matching ones.">
            <HandText x={24} y={28} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              Prompt: The capital of France is
            </HandText>
            <HandText x={24} y={Y.draft - 44} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              Draft model (small, cheap)
            </HandText>
            <HandText x={24} y={Y.target - 44} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              Large model (one pass, all positions)
            </HandText>
            <HandText x={24} y={Y.out - 44} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              Output so far
            </HandText>
            {s.showDraft && c.draft.map((t, i) => <Tok key={`d${i}`} cx={X(i)} cy={Y.draft} text={t} tone={toneOf(s, i, 'draft')} seed={`sd-${i}-${t}`} />)}
            {s.showTarget && c.target.map((t, i) => <Tok key={`t${i}`} cx={X(i)} cy={Y.target} text={t} tone={toneOf(s, i, 'target')} seed={`st-${i}-${t}`} />)}
            {s.showDraft && s.showTarget && c.draft.map((_, i) => (
              <SketchArrow key={`a${i}`} points={[[X(i), Y.draft + 28], [X(i), Y.target - 28]]} seed={seedOf(`sa-${i}`)} stroke="var(--muted)" />
            ))}
            {outTokens.map((t, i) => (
              <Tok key={`o${i}`} cx={X(i)} cy={Y.out} text={t} tone={i < c.accepted ? 'ok' : 'accent'} seed={`so-${i}-${t}`} />
            ))}
            {s.out > 0 && (
              <HandText x={696} y={Y.out} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
                {`${s.out} ${s.out === 1 ? 'token' : 'tokens'}\nfrom 1 pass`}
              </HandText>
            )}
            {s.compare && (
              <HandText x={696} y={Y.target - 44} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
                green kept, red first mismatch, dashed dropped
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

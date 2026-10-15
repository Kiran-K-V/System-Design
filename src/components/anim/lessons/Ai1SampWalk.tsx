import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative distributions written for this lesson. Not from a real model. Each row sums to 1. */
interface Opt {
  t: string;
  p: number;
}
interface Pos {
  greedy: Opt[];
  sample: Opt[];
  /** Uniform draw used for the sampled run. */
  u: number;
}

const POS: Pos[] = [
  {
    greedy: [
      { t: 'mat', p: 0.45 },
      { t: 'sofa', p: 0.2 },
      { t: 'floor', p: 0.15 },
      { t: 'sill', p: 0.1 },
      { t: 'other', p: 0.1 },
    ],
    sample: [
      { t: 'mat', p: 0.45 },
      { t: 'sofa', p: 0.2 },
      { t: 'floor', p: 0.15 },
      { t: 'sill', p: 0.1 },
      { t: 'other', p: 0.1 },
    ],
    u: 0.58,
  },
  {
    greedy: [
      { t: '.', p: 0.55 },
      { t: 'and', p: 0.25 },
      { t: 'in', p: 0.1 },
      { t: ',', p: 0.06 },
      { t: 'other', p: 0.04 },
    ],
    sample: [
      { t: '.', p: 0.4 },
      { t: 'and', p: 0.3 },
      { t: 'by', p: 0.12 },
      { t: ',', p: 0.1 },
      { t: 'other', p: 0.08 },
    ],
    u: 0.71,
  },
  {
    greedy: [
      { t: 'The', p: 0.38 },
      { t: 'It', p: 0.22 },
      { t: 'She', p: 0.15 },
      { t: 'Then', p: 0.15 },
      { t: 'other', p: 0.1 },
    ],
    sample: [
      { t: 'the', p: 0.5 },
      { t: 'a', p: 0.2 },
      { t: 'her', p: 0.15 },
      { t: 'my', p: 0.1 },
      { t: 'other', p: 0.05 },
    ],
    u: 0.3,
  },
];

const pick = (opts: Opt[], u: number) => {
  let c = 0;
  for (let i = 0; i < opts.length; i++) {
    c += opts[i].p;
    if (u < c) return i;
  }
  return opts.length - 1;
};
const argmax = (opts: Opt[]) => opts.reduce((b, o, i) => (o.p > opts[b].p ? i : b), 0);

const PROMPT = 'The cat sat on the';
const GREEDY_PICKS = POS.map((p) => argmax(p.greedy));
const SAMPLE_PICKS = POS.map((p) => pick(p.sample, p.u));

const joinText = (opts: Opt[][], picks: number[], n: number) =>
  PROMPT +
  picks
    .slice(0, n)
    .map((pi, i) => {
      const w = opts[i][pi].t;
      return /^[.,]$/.test(w) ? w : ' ' + w;
    })
    .join('');

interface Step {
  caption: string;
  /** Number of positions already decided. */
  done: number;
  /** Index of the position being drawn, or -1. */
  at: number;
  rerun?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'Both decoders start from the same prompt. A decoder is the loop that turns next-token probabilities into text, one token at a time. Left: greedy decoding. Right: sampling at temperature 1 with no cuts. The numbers in this walk are illustrative, written for this lesson.',
    done: 0,
    at: -1,
  },
  {
    caption:
      'Position 1. The model gives the same probabilities to both. Greedy takes the largest bar: "mat" (45%). The sampler draws a random number u = 0.58 and walks along the cumulative strip. "mat" covers 0 to 0.45, "sofa" covers 0.45 to 0.65, so u lands on "sofa". A 20% token won over a 45% one.',
    done: 0,
    at: 0,
  },
  {
    caption:
      'Position 2. The two runs now have different contexts, so they get different probabilities. Greedy sees "mat" and picks "." (55%). The sampler sees "sofa" and draws u = 0.71. The strip gives "." 0 to 0.40, "and" up to 0.70, and "by" up to 0.82. So it picks "by". One early random choice changes every later distribution.',
    done: 1,
    at: 1,
  },
  {
    caption:
      'Position 3. Greedy writes "The" and the sentence is done. The sampler is mid-sentence and draws u = 0.30, which lands on "the" (0 to 0.50). Same model, same prompt, two texts. The model did nothing random. The only random piece is the number u.',
    done: 2,
    at: 2,
  },
  {
    caption:
      'Run both again with new draws. Greedy gives the same text every time, in theory. The sampler gives a new one: u = 0.12, 0.83 gives "mat in"; u = 0.58, 0.30 gives "sofa .". Fixing the seed fixes u, so a seeded run repeats. Lesson text below explains why greedy is not always identical on a real server.',
    done: 3,
    at: -1,
    rerun: true,
  },
];

const LX = 20;
const RX = 370;
const ROW0 = 112;
const ROW = 38;
const BAR_MAX = 190;

function Panel({ x, title, opts, chosen, active, tone, u }: { x: number; title: string; opts: Opt[] | null; chosen: number; active: boolean; tone: string; u?: number }) {
  return (
    <g>
      <HandText x={x} y={26} anchor="start" size={TEXT_SIZES.heading} color={tone}>
        {title}
      </HandText>
      {opts &&
        opts.map((o, i) => {
          const y = ROW0 + i * ROW;
          const w = Math.max(6, o.p * BAR_MAX * 2);
          const on = active && i === chosen;
          return (
            <g key={o.t + i}>
              <HandText x={x} y={y} anchor="start" size={TEXT_SIZES.label} mono color={on ? 'var(--accent)' : 'var(--fg)'}>
                {o.t}
              </HandText>
              <SketchBox cx={x + 70 + w / 2} cy={y} w={w} h={24} r={6} seed={seedOf(`${title}-b-${i}`)} fill={on ? 'var(--accent)' : 'var(--muted)'} stroke={on ? 'var(--accent)' : 'var(--muted)'} strokeWidth={on ? 2.2 : 1.4} />
              <HandText x={x + 70 + w + 10} y={y} anchor="start" size={TEXT_SIZES.note} mono color={on ? 'var(--accent)' : 'var(--muted)'}>
                {o.p.toFixed(2)}
              </HandText>
            </g>
          );
        })}
      {opts && u !== undefined && (
        <g>
          {(() => {
            let c = 0;
            const y = 330;
            const W = 300;
            return (
              <>
                {opts.map((o, i) => {
                  const w = Math.max(4, o.p * W);
                  const cx = x + c * W + w / 2;
                  c += o.p;
                  return <SketchBox key={i} cx={cx} cy={y} w={w - 2} h={22} r={6} seed={seedOf(`${title}-s-${i}`)} fill={i === chosen ? 'var(--accent)' : 'var(--muted)'} stroke={i === chosen ? 'var(--accent)' : 'var(--muted)'} />;
                })}
                <SketchArrow points={[[x + u * W, y + 52], [x + u * W, y + 16]]} seed={seedOf(`${title}-u`)} stroke="var(--warn)" strokeWidth={2.2} />
                <HandText x={x + u * W} y={y + 66} size={TEXT_SIZES.note} mono color="var(--warn)">
                  {`u = ${u.toFixed(2)}`}
                </HandText>
              </>
            );
          })()}
        </g>
      )}
    </g>
  );
}

export default function Ai1SampWalk() {
  return (
    <AnimFrame title="Greedy and sampled decoding, token by token" steps={steps} interval={3800}>
      {(i, s) => {
        const showPos = s.at >= 0 ? POS[s.at] : null;
        const gText = joinText(POS.map((p) => p.greedy), GREEDY_PICKS, s.rerun ? 3 : Math.min(s.done + (s.at >= 0 ? 1 : 0), 3));
        const sText = s.rerun ? '' : joinText(POS.map((p) => p.sample), SAMPLE_PICKS, Math.min(s.done + (s.at >= 0 ? 1 : 0), 3));
        return (
          <SketchSvg width={720} height={430} label={`Step ${i + 1} of greedy against sampled decoding`}>
            <Panel x={LX} title="Greedy (T = 0)" opts={showPos ? showPos.greedy : null} chosen={showPos ? GREEDY_PICKS[s.at] : -1} active tone="var(--muted)" />
            <Panel x={RX} title="Sample (T = 1)" opts={showPos ? showPos.sample : null} chosen={showPos ? SAMPLE_PICKS[s.at] : -1} active tone="var(--accent)" u={showPos?.u} />
            {!showPos && !s.rerun && (
              <HandText x={360} y={190} size={TEXT_SIZES.label} color="var(--muted)">
                Prompt in, next-token probabilities out
              </HandText>
            )}
            {s.rerun && (
              <>
                <HandText x={LX} y={104} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
                  Runs 2 and 3: same text
                </HandText>
                <HandText x={RX} y={64} anchor="start" size={TEXT_SIZES.label} mono color="var(--accent)">
                  {`${PROMPT} mat in`}
                </HandText>
                <HandText x={RX} y={104} anchor="start" size={TEXT_SIZES.label} mono color="var(--accent)">
                  {`${PROMPT} sofa .`}
                </HandText>
                <HandText x={RX} y={144} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
                  Runs 2 and 3: new draws
                </HandText>
              </>
            )}
            <HandText x={LX} y={64} anchor="start" size={TEXT_SIZES.label} mono>
              {gText}
            </HandText>
            <HandText x={RX} y={64} anchor="start" size={TEXT_SIZES.label} mono color="var(--accent)">
              {sText}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

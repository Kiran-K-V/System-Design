import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TOY_TOKENS, toyPasses } from './Ai14CursorMath';

/**
 * Speculation that accepts copied lines. ILLUSTRATIVE toy: 10 lines of 10 tokens each, a guess window of 3 lines.
 * Cursor's page says the guess is made by a deterministic algorithm from the old file. How it re-finds its place after an edit is not described there.
 */

const OUT = ['L1', 'L2', 'L3', 'L4', 'N1', 'N2', 'N3', 'L7', 'L8', 'L9', 'L10'];
const PASSES = toyPasses();
const cum = (n: number) => PASSES.slice(0, n).reduce((s, p) => s + p.gained, 0);

interface Step {
  caption: string;
  passes: number;
  /** Rows of the output fully written. */
  rows: number;
  /** The first token of N1 is written (partial row). */
  partial?: boolean;
  /** Old lines (1-based) inside the guess window now. */
  window: number[];
  rejected?: number;
  accepted: number[];
}

const steps: Step[] = [
  {
    caption:
      'Task: rewrite a 10-line file, changing a small part. The old file is on the left. Plain decoding writes the new file one token per pass: 110 tokens (11 lines of 10 tokens) is 110 passes. Each pass reads all the model weights, so each pass is slow (the Prefill vs Decode: TTFT and TPOT lesson). Numbers here are made up to show the shape.',
    passes: 0,
    rows: 0,
    window: [],
    accepted: [],
  },
  {
    caption:
      'Pass 1. The guess is the next 3 old lines, L1 to L3 (30 tokens). The model checks all 30 positions in one pass: for each position, what would I write here? All 30 match the guess. So 30 tokens are accepted for 1 pass.',
    passes: 1,
    rows: 3,
    window: [1, 2, 3],
    accepted: [1, 2, 3],
  },
  {
    caption:
      'Pass 2. The guess is L4 to L6. L4 matches and is accepted. At L5 the model wants to write something new, so the guess is wrong. The model keeps its own first token of the new line N1. Everything the guess said after the first mismatch (L6) is thrown away. 11 tokens gained.',
    passes: 2,
    rows: 4,
    partial: true,
    window: [4, 5, 6],
    rejected: 5,
    accepted: [1, 2, 3, 4],
  },
  {
    caption:
      'New code has no old text to copy. The model writes N1, N2 and N3 (29 more tokens) at one token per pass, the same speed as plain decoding. Passes: 31. This is the cost of the edit. Speculation does not help here.',
    passes: 31,
    rows: 7,
    window: [],
    rejected: 5,
    accepted: [1, 2, 3, 4],
  },
  {
    caption:
      'The edit is done and the model goes back to copying. The guess must find its place in the old file again, now at L7 (L5 and L6 were replaced). Our reading: it can match the text just written against the old file. The page does not say how. Pass 32 accepts L7 to L9 at once.',
    passes: 32,
    rows: 10,
    window: [7, 8, 9],
    rejected: 5,
    accepted: [1, 2, 3, 4, 7, 8, 9],
  },
  {
    caption:
      'Pass 33 accepts L10 and the file is done. 33 passes, not 110: about 3.3 times fewer, with the same output as plain decoding. The copied lines (80 tokens) took 4 passes. The new lines (30 tokens) took 29. More copying and fewer new lines means a bigger gain.',
    passes: 33,
    rows: 11,
    window: [10],
    rejected: 5,
    accepted: [1, 2, 3, 4, 7, 8, 9, 10],
  },
];

const ROW = 28;
const TOP = 76;
const LX = 130;
const RX = 430;
const BW = 150;

export default function Ai14CursorSpec() {
  return (
    <AnimFrame title="Speculation accepts copied lines (illustrative)" steps={steps} interval={7000}>
      {(_, s) => {
        const written = s.passes === 0 ? 0 : cum(s.passes);
        return (
          <SketchSvg width={720} height={420} label="A toy rewrite of a 10-line file. Copied old lines are accepted in groups of three per pass. New lines are written one token per pass. 33 passes instead of 110.">
            <HandText x={LX} y={32} size={TEXT_SIZES.heading} color="var(--fg)">
              old file (the guess)
            </HandText>
            <HandText x={RX} y={32} size={TEXT_SIZES.heading} color="var(--fg)">
              new file, as written
            </HandText>
            {Array.from({ length: 10 }, (_, k) => {
              const n = k + 1;
              const isAcc = s.accepted.includes(n);
              const isRej = s.rejected === n && s.passes >= 2;
              const inWin = s.window.includes(n);
              const tone = isRej ? 'var(--bad)' : isAcc ? 'var(--ok)' : inWin ? 'var(--accent)' : 'var(--muted)';
              const filled = isRej || isAcc || inWin;
              return (
                <g key={n}>
                  <SketchBox
                    cx={LX}
                    cy={TOP + k * ROW}
                    w={BW}
                    h={22}
                    r={6}
                    seed={seedOf(`sp-l${n}-${tone}`)}
                    stroke={tone}
                    fill={filled ? tone : undefined}
                    dashed={!filled}
                    strokeWidth={inWin && !isAcc ? 2.2 : 1.4}
                  />
                  <HandText x={LX} y={TOP + k * ROW} size={TEXT_SIZES.note} mono color="var(--fg)">
                    {`L${n}`}
                  </HandText>
                </g>
              );
            })}
            {OUT.map((label, k) => {
              const shown = k < s.rows || (s.partial && k === s.rows);
              if (!shown) return null;
              const isNew = label.startsWith('N');
              const part = s.partial && k === s.rows;
              const tone = isNew ? 'var(--warn)' : 'var(--ok)';
              return (
                <g key={label}>
                  <SketchBox
                    cx={RX}
                    cy={TOP + k * ROW}
                    w={BW}
                    h={22}
                    r={6}
                    seed={seedOf(`sp-o${label}-${part}`)}
                    stroke={tone}
                    fill={tone}
                    dashed={part}
                  />
                  <HandText x={RX} y={TOP + k * ROW} size={TEXT_SIZES.note} mono color="var(--fg)">
                    {label}
                  </HandText>
                  <HandText x={RX + BW / 2 + 12} y={TOP + k * ROW} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                    {isNew ? (part ? 'first token only' : 'new, written by the model') : 'copied from the guess'}
                  </HandText>
                </g>
              );
            })}
            <HandText x={24} y={TOP + 10 * ROW + 38} anchor="start" size={TEXT_SIZES.label} color="var(--accent)">
              {`forward passes: ${s.passes} · tokens written: ${written} of ${TOY_TOKENS} · plain decoding: ${TOY_TOKENS} passes`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

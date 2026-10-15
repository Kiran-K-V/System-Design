import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';

interface Step {
  caption: string;
  n: number;
}

const steps: Step[] = [
  { n: 1, caption: 'Attention compares each new token (a query) with every token it may read (the keys). With one token there is one score: the token against itself. The grid has one cell.' },
  { n: 2, caption: 'A second token arrives. It scores itself and the first token: 2 new cells. The cell above the diagonal is masked. A causal model may not read tokens that come later, so that score is never computed.' },
  { n: 3, caption: 'Third token: 3 new cells. Each new token adds a full row as long as everything before it. Total filled cells: 1 + 2 + 3 = 6.' },
  { n: 4, caption: 'Four tokens: 10 filled cells (1 + 2 + 3 + 4) out of 16 in the full square. The filled part is a triangle. The cells are the work: one dot product each, per head, per layer.' },
  { n: 6, caption: 'Six tokens: 21 filled cells. Jumping ahead: the count is n(n+1)/2. It grows like a nested loop over the sequence, so it is O(n²), the same shape as comparing every pair in a list.' },
  { n: 8, caption: 'Eight tokens: 36 filled cells. Doubling from 4 to 8 tokens took the work from 10 to 36 cells, not 20.' },
  { n: 12, caption: 'Twelve tokens: 78 filled cells. The row for the newest token is 12 cells wide. The cells that were there before are unchanged, so a cache can keep them. We come back to that cache next.' },
  { n: 16, caption: 'Sixteen tokens: 136 filled cells. Going from 8 to 16 tokens (2x) took the work from 36 to 136 cells, about 4x. A real prompt of 128,000 tokens has about 8.6 billion filled cells (n(n+1)/2) per head per layer.' },
];

export default function Ai1AttnMatrix() {
  return (
    <AnimFrame title="Attention matrix growing with a causal mask" steps={steps} interval={4600}>
      {(_, s) => {
        const n = s.n;
        const c = Math.min(40, Math.floor(210 / n));
        const x0 = 150;
        const y0 = 56;
        const filled = (n * (n + 1)) / 2;
        return (
          <SketchSvg width={720} height={320} label={`Attention score grid for ${n} tokens`}>
            <HandText x={x0 - 60} y={24} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              keys: tokens it may read (past to future)
            </HandText>
            {Array.from({ length: n }, (_, r) =>
              Array.from({ length: n }, (_, k) => {
                const on = k <= r;
                const newest = r === n - 1 && on;
                return (
                  <rect
                    key={`${r}-${k}`}
                    x={x0 + k * c}
                    y={y0 + r * c}
                    width={c - 2}
                    height={c - 2}
                    rx={c > 20 ? 6 : 2}
                    fill={newest ? 'var(--accent)' : on ? 'var(--ok)' : 'none'}
                    fillOpacity={newest ? 0.45 : 0.28}
                    stroke={on ? (newest ? 'var(--accent)' : 'var(--ok)') : 'var(--border)'}
                    strokeWidth={newest ? 1.8 : 1.2}
                    strokeDasharray={on ? undefined : '3 3'}
                  />
                );
              }),
            )}
            <HandText x={x0 - 10} y={y0 + (c * n) / 2} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              queries
            </HandText>
            <HandText x={x0 - 10} y={y0 + (c * n) / 2 + 18} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              (new at bottom)
            </HandText>
            <HandText x={470} y={80} size={TEXT_SIZES.heading} color="var(--muted)">
              Work so far
            </HandText>
            <HandText x={470} y={120} size={TEXT_SIZES.label} mono>
              {`tokens n = ${n}`}
            </HandText>
            <HandText x={470} y={156} size={TEXT_SIZES.label} mono color="var(--ok)">
              {`filled cells = ${filled.toLocaleString('en-US')}`}
            </HandText>
            <HandText x={470} y={192} size={TEXT_SIZES.label} mono color="var(--muted)">
              {`full square n² = ${(n * n).toLocaleString('en-US')}`}
            </HandText>
            <HandText x={470} y={228} size={TEXT_SIZES.label} mono color="var(--accent)">
              {`new row = ${n} cells`}
            </HandText>
            <HandText x={470} y={284} size={TEXT_SIZES.note} color="var(--muted)">
              green = scored · dashed = masked (future)
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

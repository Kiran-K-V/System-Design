import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { APPLY, decodeFloorTps, impliedBaseline } from './Ai14CursorMath';

/**
 * Static infographic: tokens per second for a full-file rewrite.
 * Published (Cursor, 2024-05-14, company claim): about 1,000 tokens/s, "~13x" over vanilla Llama-3-70b, "~9x" over the previous GPT-4 speculative edits deployment.
 * The two baseline bars are OUR arithmetic (1,000 divided by the ratio). The page does not publish them.
 * The dashed line is OUR illustrative floor for one token per pass (lesson A2.2: 70B in BF16 on 4 H100).
 */

const X0 = 230;
const SCALE = 0.42;
const floor = decodeFloorTps(140, 4, 3350);

const BARS: { label: string; sub: string; v: number; color: string; derived: boolean }[] = [
  { label: 'Vanilla Llama-3-70b', sub: 'derived: 1,000 / 13', v: impliedBaseline(APPLY.speedupVsVanillaLlama), color: 'var(--muted)', derived: true },
  { label: 'Earlier GPT-4 spec edits', sub: 'derived: 1,000 / 9', v: impliedBaseline(APPLY.speedupVsPrevGptSpec), color: 'var(--muted)', derived: true },
  { label: 'Fast-apply 70B', sub: 'published: ~1,000', v: APPLY.tokensPerSecond, color: 'var(--ok)', derived: false },
];

export default function Ai14CursorSpeed() {
  const xf = (v: number) => X0 + v * SCALE;
  return (
    <figure className="not-prose my-8">
      <SketchSvg width={720} height={300} label="Bars of tokens per second for a full-file rewrite: about 77 for vanilla Llama-3-70b, about 111 for the earlier GPT-4 speculative edits, and about 1,000 for Cursor's fast-apply model. A dashed line marks about 96 tokens per second, a one-token-per-pass floor for a 70B model on four H100 GPUs.">
        <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
          Tokens per second, one full-file rewrite
        </HandText>
        {BARS.map((b, i) => {
          const cy = 78 + i * 62;
          const w = xf(b.v) - X0;
          return (
            <g key={b.label}>
              <HandText x={X0 - 14} y={cy - 9} anchor="end" size={TEXT_SIZES.label} color="var(--fg)">
                {b.label}
              </HandText>
              <HandText x={X0 - 14} y={cy + 13} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
                {b.sub}
              </HandText>
              <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={34} r={8} seed={seedOf(`sb${i}`)} stroke={b.color} fill={b.color} dashed={b.derived} />
              <HandText x={b.v > 500 ? X0 + w - 10 : Math.max(X0 + w + 10, xf(floor) + 12)} y={cy} anchor={b.v > 500 ? 'end' : 'start'} size={TEXT_SIZES.label} mono color="var(--fg)">
                {b.derived ? `~${Math.round(b.v)}` : '~1,000'}
              </HandText>
            </g>
          );
        })}
        <SketchArrow points={[[xf(floor), 54], [xf(floor), 244]]} head="none" dashed stroke="var(--warn)" seed={seedOf('sfloor')} />
        <HandText x={xf(floor) + 10} y={262} anchor="start" size={TEXT_SIZES.note} color="var(--warn)">
          {`one-token-per-pass floor: ~${Math.round(floor)} (our model, 4 H100)`}
        </HandText>
        <HandText x={24} y={288} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
          Dashed bars are our division of the published ratios, not published speeds.
        </HandText>
      </SketchSvg>
    </figure>
  );
}

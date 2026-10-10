import { HandText, SketchBox, SketchArrow, TEXT_SIZES, seedOf, type Pt } from '../sketch';

/** Small drawing parts shared by the Module 8 technology animations (Kafka, Flink, ZooKeeper, Temporal). */

export type TT = 'fg' | 'accent' | 'ok' | 'warn' | 'bad' | 'muted';
export const tv = (t?: TT) => (!t || t === 'fg' ? 'var(--fg)' : `var(--${t})`);

/** A small square cell, for log entries and offsets. A tone other than fg gives a tinted fill. */
export function Cell({ cx, cy, w = 30, h = 30, label, tone = 'fg', dashed, sk }: { cx: number; cy: number; w?: number; h?: number; label: string; tone?: TT; dashed?: boolean; sk: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={h} r={6} seed={seedOf(sk)} stroke={tv(tone)} fill={tone === 'fg' ? undefined : tv(tone)} fillStyle="solid" dashed={dashed} />
      <HandText x={cx} y={cy + 1} size={TEXT_SIZES.note}>
        {label}
      </HandText>
    </g>
  );
}

/** A labeled box. A ghost box is an empty placeholder: dashed, no fill. Two lines (label and sub) use height 60. One line uses height 44. */
export function Panel({ cx, cy, w, h = 44, label, sub, tone = 'fg', dashed, strong, ghost, sk }: { cx: number; cy: number; w: number; h?: number; label: string; sub?: string; tone?: TT; dashed?: boolean; strong?: boolean; ghost?: boolean; sk: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={sub ? 60 : h} seed={seedOf(sk)} stroke={ghost ? 'var(--muted)' : tv(tone)} strokeWidth={strong ? 2.2 : 1.4} dashed={dashed || ghost} fill={ghost || tone === 'fg' ? undefined : tv(tone)} fillStyle="solid" />
      <HandText x={cx} y={sub ? cy - 10 : cy} size={TEXT_SIZES.label}>
        {label}
      </HandText>
      {sub && (
        <HandText x={cx} y={cy + 14} size={TEXT_SIZES.note} color="var(--muted)">
          {sub}
        </HandText>
      )}
    </g>
  );
}

/** Straight arrow with an optional label above its middle. */
export function Arr({ from, to, tone = 'muted', dashed, label, labelDy = -14, sk }: { from: Pt; to: Pt; tone?: TT; dashed?: boolean; label?: string; labelDy?: number; sk: string }) {
  return (
    <g>
      <SketchArrow points={[from, to]} stroke={tv(tone)} dashed={dashed} seed={seedOf(sk)} />
      {label && (
        <HandText x={(from[0] + to[0]) / 2} y={(from[1] + to[1]) / 2 + labelDy} size={TEXT_SIZES.note} color={tv(tone === 'muted' ? 'muted' : tone)}>
          {label}
        </HandText>
      )}
    </g>
  );
}

/** Curved arrow that arcs above (negative lift) or below (positive lift) the straight line. */
export function Arc({ from, to, lift, tone = 'muted', label, sk }: { from: Pt; to: Pt; lift: number; tone?: TT; label?: string; sk: string }) {
  const mid: Pt = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + lift];
  return (
    <g>
      <SketchArrow points={[from, mid, to]} stroke={tv(tone)} seed={seedOf(sk)} />
      {label && (
        <HandText x={mid[0]} y={mid[1] + (lift < 0 ? -12 : 14)} size={TEXT_SIZES.note} color={tv(tone)}>
          {label}
        </HandText>
      )}
    </g>
  );
}

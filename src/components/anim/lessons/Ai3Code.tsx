import { HandText, SketchBox, TEXT_SIZES, seedOf } from '../sketch';

export interface CLine {
  t: string;
  /** Group name. Lines that share a group are highlighted together. */
  g?: string;
}

export const LH = 22;

/** A panel of monospace lines. Groups listed in `hi` get a tinted box in the given tone color. Used by the Ai3 lesson diagrams. */
export default function Ai3Code({ x, y, w, title, lines, hi }: { x: number; y: number; w: number; title: string; lines: CLine[]; hi: Record<string, string> }) {
  const top = y + 30;
  const h = lines.length * LH + 16;
  return (
    <g>
      <HandText x={x} y={y + 4} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
        {title}
      </HandText>
      <SketchBox cx={x + w / 2} cy={top + h / 2 - 6} w={w} h={h} r={8} seed={seedOf(`${title}-frame`)} stroke="var(--border)" fill="var(--surface)" />
      {Object.entries(hi).map(([g, color]) => {
        const idx = lines.map((l, i) => (l.g === g ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return null;
        const a = Math.min(...idx);
        const b = Math.max(...idx);
        return <SketchBox key={g} cx={x + w / 2} cy={top + ((a + b) / 2) * LH + 8} w={w - 8} h={(b - a + 1) * LH} r={6} seed={seedOf(`${title}-${g}`)} stroke={color} strokeWidth={2.2} fill={color} />;
      })}
      {lines.map((l, i) => (
        <HandText key={i} x={x + 12} y={top + i * LH + 8} anchor="start" size={TEXT_SIZES.note} mono color={l.g && hi[l.g] ? 'var(--fg)' : 'var(--muted)'}>
          {l.t.replace(/^ +/, (m) => '\u00a0'.repeat(m.length))}
        </HandText>
      ))}
    </g>
  );
}

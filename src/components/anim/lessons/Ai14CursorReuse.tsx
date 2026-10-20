import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { REUSE, ratio } from './Ai14CursorMath';

/**
 * Static infographic: time-to-first-query before and after index reuse, on a log axis.
 * Figures are Cursor's, from its 2026-01-27 post (company claim). Ratios are our arithmetic.
 */

const X0 = 180;
const PER_DECADE = 108;
const MIN = 0.3;
const xOf = (sec: number) => X0 + Math.log10(sec / MIN) * PER_DECADE;
const TICKS: [number, string][] = [
  [1, '1 s'],
  [10, '10 s'],
  [100, '100 s'],
  [1000, '1,000 s'],
  [10000, '10,000 s'],
];

function fmt(sec: number): string {
  if (sec < 1) return `${Math.round(sec * 1000)} ms`;
  if (sec < 60) return `${sec} s`;
  if (sec < 3600) return `${(sec / 60).toFixed(2)} min`;
  return `${(sec / 3600).toFixed(2)} h`;
}

const GROUP = 112;
const TOP = 56;

export default function Ai14CursorReuse() {
  const bottom = TOP + REUSE.length * GROUP;
  return (
    <figure className="not-prose my-8">
      <SketchSvg width={720} height={bottom + 54} label="Time to first query, before and after index reuse, on a log scale. Median 7.87 seconds to 525 milliseconds. 90th percentile 2.82 minutes to 1.87 seconds. 99th percentile 4.03 hours to 21 seconds.">
        <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
          Time to first query (log scale, so bar length is not proportional to time)
        </HandText>
        {TICKS.map(([v, t]) => (
          <g key={t}>
            <SketchArrow points={[[xOf(v), TOP - 10], [xOf(v), bottom - 24]]} head="none" dashed stroke="var(--border)" seed={seedOf(`rt${t}`)} />
            <HandText x={xOf(v)} y={bottom - 6} size={TEXT_SIZES.note} mono color="var(--muted)">
              {t}
            </HandText>
          </g>
        ))}
        {REUSE.map((r, i) => {
          const y0 = TOP + i * GROUP;
          const rows: [string, number, string][] = [
            ['before', r.before, 'var(--warn)'],
            ['after', r.after, 'var(--ok)'],
          ];
          return (
            <g key={r.label}>
              <HandText x={24} y={y0 + 20} anchor="start" size={TEXT_SIZES.label} color="var(--fg)">
                {r.label}
              </HandText>
              <HandText x={24} y={y0 + 44} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                {`${ratio(r.before, r.after).toFixed(0)} times faster`}
              </HandText>
              {rows.map(([name, v, color], k) => {
                const w = Math.max(xOf(v) - X0, 6);
                const cy = y0 + 14 + k * 38;
                const inside = X0 + w > 560;
                return (
                  <g key={name}>
                    <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={26} r={6} seed={seedOf(`rb${i}${name}`)} stroke={color} fill={color} />
                    <HandText x={inside ? X0 + w - 8 : X0 + w + 8} y={cy} anchor={inside ? 'end' : 'start'} size={TEXT_SIZES.note} mono color="var(--fg)">
                      {fmt(v)}
                    </HandText>
                  </g>
                );
              })}
            </g>
          );
        })}
      </SketchSvg>
    </figure>
  );
}

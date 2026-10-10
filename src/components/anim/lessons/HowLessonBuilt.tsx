import { HandText, SketchArrow, SketchBox, SketchSvg, Badge, seedOf } from '../sketch';

/** Static infographic: the seven parts of an Uptime lesson. No client JS. */

const parts = [
  { t: 'The problem', s: 'a real pain,\nwith numbers' },
  { t: 'Naive fix', s: 'try it,\nwatch it break' },
  { t: 'Mechanism', s: 'built step by\nstep, animated' },
  { t: 'Numbers', s: 'latency, QPS,\nsizes' },
  { t: 'Trade-offs', s: 'gain / pay /\nwhen to choose' },
  { t: 'In practice', s: 'tip and\ncommon mistake' },
  { t: 'Quiz', s: 'predict or\ncompute' },
];

const pos = (i: number): [number, number] => (i < 4 ? [90 + i * 180, 72] : [180 + (i - 4) * 180, 250]);

export default function HowLessonBuilt() {
  return (
    <SketchSvg width={720} height={330} label="The seven parts of a lesson, in order: problem, naive fix, mechanism, numbers, trade-offs, in practice, quiz">
      {parts.map((p, i) => {
        const [cx, cy] = pos(i);
        const last = i === 6;
        return (
          <g key={p.t}>
            <SketchBox cx={cx} cy={cy} w={150} h={88} r={12} seed={seedOf('part' + i)} stroke={last ? 'var(--accent)' : undefined} strokeWidth={last ? 2.2 : undefined} />
            <HandText x={cx} y={cy - 15} size={16} weight={700}>{p.t}</HandText>
            <HandText x={cx} y={cy + 18} size={14} color="var(--muted)">{p.s}</HandText>
            <Badge cx={cx - 66} cy={cy - 36} n={i + 1} seed={seedOf('pb' + i)} />
          </g>
        );
      })}
      {[0, 1, 2].map((i) => (
        <SketchArrow key={i} points={[[pos(i)[0] + 78, 72], [pos(i + 1)[0] - 78, 72]]} seed={seedOf('pa' + i)} />
      ))}
      <SketchArrow points={[[630, 122], [610, 168], [400, 172], [190, 172], [180, 200]]} seed={seedOf('wrap')} />
      {[4, 5].map((i) => (
        <SketchArrow key={i} points={[[pos(i)[0] + 78, 250], [pos(i + 1)[0] - 78, 250]]} seed={seedOf('pa' + i)} />
      ))}
      <HandText x={360} y={318} size={14} color="var(--accent)">{'Each lesson only uses earlier lessons'}</HandText>
    </SketchSvg>
  );
}

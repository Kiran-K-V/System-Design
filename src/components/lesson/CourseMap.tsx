import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../anim/sketch';

/** Static hand-drawn map of how the course stacks. Rendered at build time, no client JS. */

const ORANGE = '#e8590c';
const BLUE = '#1971c2';
const GREEN = '#2f9e44';
const RED = '#e03131';
const TEAL = '#0c8599';

interface Layer {
  href: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  color: string;
  label: string;
  strokeWidth?: number;
}

const layers: Layer[] = [
  { href: '#module-0', cx: 430, cy: 205, w: 540, h: 52, color: ORANGE, label: 'Delivery Framework', strokeWidth: 3 },
  { href: '#module-8', cx: 292, cy: 278, w: 264, h: 56, color: BLUE, label: 'Key Technologies' },
  { href: '#module-9', cx: 568, cy: 278, w: 264, h: 56, color: GREEN, label: 'Patterns' },
  { href: '#module-2', cx: 430, cy: 352, w: 540, h: 52, color: RED, label: 'Core Concepts' },
  { href: '#module-1', cx: 430, cy: 422, w: 540, h: 52, color: TEAL, label: 'First Principles: One Machine' },
];

const problems = ['Bitly', 'Uber', 'Google\nDocs', '...'];

export default function CourseMap() {
  return (
    <SketchSvg width={760} height={460} label="Course structure: first principles at the bottom, practice problems at the top">
      <a href="#module-11">
        <SketchBox cx={430} cy={92} w={500} h={140} r={22} seed={seedOf('practice')} />
        <HandText x={430} y={45} size={22}>
          Practice Common Problems
        </HandText>
        {problems.map((p, i) => (
          <g key={p}>
            <SketchBox cx={250 + i * 120} cy={112} w={100} h={62} r={12} dashed seed={seedOf(p)} />
            <HandText x={250 + i * 120} y={112} size={18}>
              {p}
            </HandText>
          </g>
        ))}
      </a>

      {layers.map((l) => (
        <a key={l.label} href={l.href}>
          <SketchBox
            cx={l.cx}
            cy={l.cy}
            w={l.w}
            h={l.h}
            r={10}
            stroke={l.color}
            strokeWidth={l.strokeWidth ?? 1.6}
            seed={seedOf(l.label)}
          />
          <HandText x={l.cx} y={l.cy} size={l.w > 300 ? 26 : 24} color={l.color}>
            {l.label}
          </HandText>
        </a>
      ))}

      <HandText x={80} y={40} size={20}>
        Start here
      </HandText>
      <SketchArrow
        points={[
          [86, 62],
          [60, 230],
          [90, 400],
          [150, 420],
        ]}
        strokeWidth={2}
        seed={seedOf('start-arrow')}
      />
    </SketchSvg>
  );
}

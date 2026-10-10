import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../anim/sketch';

/** Static hand-drawn map of how the course stacks. Rendered at build time, no client JS. */

interface Layer {
  href: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  label: string;
  start?: boolean;
}

// Plain ink everywhere. Only the layer a new reader starts on carries the accent.
const layers: Layer[] = [
  { href: '#module-0', cx: 430, cy: 205, w: 540, h: 52, label: 'Delivery framework' },
  { href: '#module-8', cx: 292, cy: 278, w: 264, h: 56, label: 'Key technologies' },
  { href: '#module-9', cx: 568, cy: 278, w: 264, h: 56, label: 'Patterns' },
  { href: '#module-2', cx: 430, cy: 352, w: 540, h: 52, label: 'Core concepts' },
  { href: '#module-1', cx: 430, cy: 422, w: 540, h: 52, label: 'First principles: one machine', start: true },
];

const problems = ['Bitly', 'Uber', 'Google\nDocs', '+ more'];

export default function CourseMap() {
  return (
    <SketchSvg width={760} height={460} label="Course structure: first principles at the bottom, practice problems at the top">
      <a href="#module-11" className="map-layer">
        <SketchBox cx={430} cy={92} w={500} h={140} r={22} seed={seedOf('practice')} />
        <HandText x={430} y={45} size={22}>
          Practice common problems
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
        <a key={l.label} href={l.href} className="map-layer">
          <SketchBox
            cx={l.cx}
            cy={l.cy}
            w={l.w}
            h={l.h}
            r={10}
            stroke={l.start ? 'var(--accent)' : 'var(--fg)'}
            strokeWidth={l.start ? 2.2 : 1.4}
            fill={l.start ? 'var(--accent)' : undefined}
            seed={seedOf(l.label)}
          />
          <HandText x={l.cx} y={l.cy} size={22} color={l.start ? 'var(--accent)' : 'var(--fg)'}>
            {l.label}
          </HandText>
        </a>
      ))}

      <HandText x={80} y={40} size={18} color="var(--accent)">
        Start here
      </HandText>
      <SketchArrow
        points={[
          [86, 62],
          [60, 230],
          [90, 400],
          [150, 420],
        ]}
        stroke="var(--accent)"
        strokeWidth={2.2}
        seed={seedOf('start-arrow')}
      />
    </SketchSvg>
  );
}

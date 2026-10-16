import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../anim/sketch';

/** Static hand-drawn map of the AI track, layers from the bottom up. Rendered at build time, no client JS. */

interface Layer {
  href: string;
  cx: number;
  cy: number;
  w: number;
  label: string;
  start?: boolean;
}

const H = 50;
const WIDE = 540;
const HALF = 264;

// Plain ink everywhere. Only the layer a new reader starts on carries the accent.
const layers: Layer[] = [
  { href: '#module-A8', cx: 430, cy: 158, w: WIDE, label: 'Evals, LLMOps, safety' },
  { href: '#module-A6', cx: 292, cy: 224, w: HALF, label: 'Agent foundations' },
  { href: '#module-A7', cx: 568, cy: 224, w: HALF, label: 'Agents in production' },
  { href: '#module-A5', cx: 292, cy: 290, w: HALF, label: 'RAG' },
  { href: '#module-A4', cx: 568, cy: 290, w: HALF, label: 'Context' },
  { href: '#module-A3', cx: 430, cy: 356, w: WIDE, label: 'LLM APIs and integration' },
  { href: '#module-A2', cx: 430, cy: 422, w: WIDE, label: 'Inference and cost' },
  { href: '#module-A1', cx: 430, cy: 488, w: WIDE, label: 'The model as a function', start: true },
];

const cases = ['Support\nagent', 'RAG over\ndocs', 'Coding\nagent', '+ more'];

export default function AiCourseMap() {
  return (
    <SketchSvg width={760} height={530} label="AI track structure: the model as a function at the bottom, case studies at the top">
      <a href="#module-A13" className="map-layer">
        <SketchBox cx={430} cy={70} w={500} h={116} r={22} seed={seedOf('ai-cases')} />
        <HandText x={430} y={36} size={22}>
          Case studies
        </HandText>
        {cases.map((p, i) => (
          <g key={p}>
            <SketchBox cx={250 + i * 120} cy={88} w={100} h={54} r={12} dashed seed={seedOf(`ai-${p}`)} />
            <HandText x={250 + i * 120} y={88} size={16}>
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
            h={H}
            r={10}
            stroke={l.start ? 'var(--accent)' : 'var(--fg)'}
            strokeWidth={l.start ? 2.2 : 1.4}
            fill={l.start ? 'var(--accent)' : undefined}
            seed={seedOf(`ai-${l.label}`)}
          />
          <HandText x={l.cx} y={l.cy} size={22} color={l.start ? 'var(--accent)' : 'var(--fg)'}>
            {l.label}
          </HandText>
        </a>
      ))}

      <HandText x={80} y={150} size={18} color="var(--accent)">
        Start here
      </HandText>
      <SketchArrow
        points={[
          [80, 174],
          [56, 330],
          [90, 470],
          [150, 488],
        ]}
        stroke="var(--accent)"
        strokeWidth={2.2}
        seed={seedOf('ai-start-arrow')}
      />
    </SketchSvg>
  );
}

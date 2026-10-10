import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Static picture: each PostgreSQL connection is a server process. A pooler lets many clients share a few of them. */

const YS = [92, 142, 192, 242];

export default function PgPooler() {
  return (
    <SketchSvg width={680} height={330} label="Four clients connecting directly to four PostgreSQL processes, and four clients sharing two processes through a pooler">
      <HandText x={140} y={26} size={TEXT_SIZES.heading}>Direct connections</HandText>
      <HandText x={520} y={26} size={TEXT_SIZES.heading}>Through a pooler</HandText>

      {YS.map((y, i) => (
        <g key={`a${i}`}>
          <SketchBox cx={45} cy={y} w={64} h={36} r={6} seed={seedOf(`pca${i}`)} />
          <HandText x={45} y={y} size={TEXT_SIZES.label}>{`app ${i + 1}`}</HandText>
          <SketchArrow points={[[83, y], [176, y]]} seed={seedOf(`pcl${i}`)} stroke="var(--accent)" />
          <SketchBox cx={235} cy={y} w={104} h={36} r={6} seed={seedOf(`pcp${i}`)} fill="var(--warn)" stroke="var(--warn)" />
          <HandText x={235} y={y} size={TEXT_SIZES.label}>process</HandText>
        </g>
      ))}
      <HandText x={140} y={292} size={TEXT_SIZES.note} color="var(--muted)">4 clients, 4 server processes</HandText>

      {YS.map((y, i) => (
        <g key={`b${i}`}>
          <SketchBox cx={395} cy={y} w={64} h={36} r={6} seed={seedOf(`pcb${i}`)} />
          <HandText x={395} y={y} size={TEXT_SIZES.label}>{`app ${i + 1}`}</HandText>
          <SketchArrow points={[[433, y], [459, 167]]} seed={seedOf(`pcm${i}`)} stroke="var(--accent)" />
        </g>
      ))}
      <SketchBox cx={510} cy={167} w={90} h={190} r={8} seed={seedOf('pcbouncer')} stroke="var(--accent)" strokeWidth={2.2} />
      <HandText x={510} y={167} size={TEXT_SIZES.label}>{'pooler\n(PgBouncer)'}</HandText>
      {[132, 202].map((y, i) => (
        <g key={`c${i}`}>
          <SketchBox cx={625} cy={y} w={84} h={36} r={6} seed={seedOf(`pcq${i}`)} fill="var(--warn)" stroke="var(--warn)" />
          <HandText x={625} y={y} size={TEXT_SIZES.label}>process</HandText>
          <SketchArrow points={[[558, y], [578, y]]} seed={seedOf(`pcr${i}`)} stroke="var(--accent)" />
        </g>
      ))}
      <HandText x={520} y={292} size={TEXT_SIZES.note} color="var(--muted)">4 clients, 2 server processes</HandText>
    </SketchSvg>
  );
}

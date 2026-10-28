import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * Static infographic: selective batching inside one Transformer layer (Orca, Figure 5).
 * Four requests are at different positions: x1 and x2 each decode one token, x3 has a 2-token prompt, x4 a 3-token prompt.
 * Seven token rows go through the shared-weight steps as one block. The attention step runs once per request.
 */
const TOKENS = [
  { r: 'x1', n: 1 },
  { r: 'x2', n: 1 },
  { r: 'x3', n: 2 },
  { r: 'x4', n: 3 },
];

export default function AiE3SelectiveBatch() {
  const chips: { cx: number; label: string }[] = [];
  let k = 0;
  TOKENS.forEach((t) => {
    for (let j = 0; j < t.n; j++) chips.push({ cx: 94 + k++ * 52, label: t.r });
  });
  const attn = [
    { r: 'x1', cx: 112, w: 150, kv: 'reads its own past' },
    { r: 'x2', cx: 276, w: 150, kv: 'reads its own past' },
    { r: 'x3', cx: 440, w: 150, kv: 'its prompt only' },
    { r: 'x4', cx: 604, w: 150, kv: 'its prompt only' },
  ];
  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 p-3">
        <SketchSvg width={720} height={470} label="Selective batching: seven token rows share one matrix multiply, attention runs once per request, then the rows merge again">
          <HandText x={24} y={26} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">One iteration: 7 token rows from 4 requests</HandText>
          {chips.map((c, i) => (
            <g key={i}>
              <SketchBox cx={c.cx} cy={70} w={46} h={36} r={6} seed={seedOf(`chip-${i}`)} stroke="var(--muted)" />
              <HandText x={c.cx} y={71} size={TEXT_SIZES.note} color="var(--fg)">{c.label}</HandText>
            </g>
          ))}
          <SketchArrow points={[[250, 94], [250, 120]]} stroke="var(--muted)" seed={seedOf('s1')} />

          <SketchBox cx={360} cy={146} w={600} h={44} r={8} seed={seedOf('qkv')} stroke="var(--ok)" fill="var(--ok)" />
          <HandText x={360} y={147} size={TEXT_SIZES.label} color="var(--fg)">Projections: one matrix multiply, 7 rows</HandText>
          <SketchArrow points={[[360, 172], [360, 200]]} stroke="var(--muted)" seed={seedOf('s2')} />
          <HandText x={470} y={187} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">split by request</HandText>

          {attn.map((a) => (
            <g key={a.r}>
              <SketchBox cx={a.cx} cy={246} w={a.w} h={60} r={8} seed={seedOf(`at-${a.r}`)} stroke="var(--warn)" fill="var(--warn)" />
              <HandText x={a.cx} y={246} size={TEXT_SIZES.label} color="var(--fg)">{`attention ${a.r}\n${a.kv}`}</HandText>
            </g>
          ))}
          <SketchArrow points={[[360, 282], [360, 310]]} stroke="var(--muted)" seed={seedOf('s3')} />
          <HandText x={470} y={296} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">merge back to 7 rows</HandText>

          <SketchBox cx={360} cy={336} w={600} h={44} r={8} seed={seedOf('out')} stroke="var(--ok)" fill="var(--ok)" />
          <HandText x={360} y={337} size={TEXT_SIZES.label} color="var(--fg)">Output projection and feed-forward: 7 rows, one multiply</HandText>

          <SketchBox cx={186} cy={420} w={26} h={22} r={6} seed={seedOf('lg1')} stroke="var(--ok)" fill="var(--ok)" />
          <HandText x={208} y={421} anchor="start" size={TEXT_SIZES.note} color="var(--fg)">same weights for every row: batch freely</HandText>
          <SketchBox cx={186} cy={448} w={26} h={22} r={6} seed={seedOf('lg2')} stroke="var(--warn)" fill="var(--warn)" />
          <HandText x={208} y={449} anchor="start" size={TEXT_SIZES.note} color="var(--fg)">each request has its own keys and values: run one by one</HandText>
        </SketchSvg>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Redrawn from the idea in the Orca paper. Green steps treat the batch as one flat block of rows, so requests at different positions can sit together. Amber steps need to know which request a row belongs to.
      </figcaption>
    </figure>
  );
}

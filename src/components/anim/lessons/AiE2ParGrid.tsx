import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** A toy cluster (illustrative): 4 nodes of 4 GPUs. Tensor 4, pipeline 2, data 2 gives 16 GPUs. */
type Tone = 'muted' | 'accent' | 'ok';
interface Flow {
  from: [number, number];
  to: [number, number];
  label?: string;
  tone: 'accent' | 'ok' | 'warn';
}
interface Step {
  caption: string;
  tones: Tone[][]; // [row][col]
  flows: Flow[];
  note: string;
}

const M: Tone = 'muted';
const A: Tone = 'accent';
const O: Tone = 'ok';

const steps: Step[] = [
  {
    caption: 'Toy cluster: 16 GPUs in 4 nodes of 4 GPUs. Inside a node, GPUs share a very fast link. Between nodes, the link is much slower. The three splitting methods must be placed with this in mind.',
    tones: [[M, M], [M, M]],
    flows: [],
    note: 'inside a node: fast link. between nodes: slower link',
  },
  {
    caption: 'Tensor group: the 4 GPUs of one node share each weight matrix. Each holds a slice, and they combine partial results at every layer. This traffic is heavy and frequent, so it uses the fast link inside the node.',
    tones: [[A, M], [M, M]],
    flows: [],
    note: 'tensor parallel group = one node',
  },
  {
    caption: 'Pipeline group: the layers are cut in two. Node 1 holds the first half, node 2 the second half. A pipeline group is one node of each stage. Only activations cross between the two, once per stage boundary.',
    tones: [[A, A], [M, M]],
    flows: [{ from: [0, 0], to: [0, 1], label: 'activations', tone: 'accent' }],
    note: 'pipeline group = one replica',
  },
  {
    caption: 'Data group: a second replica holds a full copy of the same layers on the other two nodes. It reads different training examples. Nodes holding the same layers in both replicas form a data group.',
    tones: [[O, M], [O, M]],
    flows: [{ from: [0, 0], to: [1, 0], label: 'same layers', tone: 'ok' }],
    note: 'data group = same slice, different data',
  },
  {
    caption: 'One micro-batch, forward: it enters node 1, which runs its layers with tensor traffic inside the node. It then sends activations to node 2. The next micro-batch can enter node 1 while node 2 is still working.',
    tones: [[A, M], [M, M]],
    flows: [{ from: [0, 0], to: [0, 1], label: 'forward', tone: 'accent' }],
    note: 'forward: node 1 then node 2',
  },
  {
    caption: 'Backward and sync: gradients flow back from node 2 to node 1. Then each data group averages its gradients across the two replicas. This runs once per step, so it can use the slower link between nodes.',
    tones: [[M, A], [M, M]],
    flows: [
      { from: [0, 1], to: [0, 0], label: 'backward', tone: 'warn' },
      { from: [0, 0], to: [1, 0], label: 'average gradients', tone: 'ok' },
      { from: [0, 1], to: [1, 1], tone: 'ok' },
    ],
    note: 'then average gradients between replicas',
  },
];

const CX = [190, 530];
const CY = [95, 245];
const NW = 270;
const NH = 118;
const tone = (t: string) => `var(--${t})`;

export default function AiE2ParGrid() {
  return (
    <AnimFrame title="Tensor, pipeline, and data groups on 16 GPUs" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={350} label={`Step ${i + 1}: ${s.note}`}>
          <HandText x={190} y={20} size={TEXT_SIZES.heading} color="var(--muted)">first half of layers</HandText>
          <HandText x={530} y={20} size={TEXT_SIZES.heading} color="var(--muted)">second half of layers</HandText>
          {CY.map((cy, r) =>
            CX.map((cx, c) => {
              const t = s.tones[r][c];
              const col = t === 'muted' ? 'var(--muted)' : tone(t);
              return (
                <g key={`${r}${c}`}>
                  <SketchBox cx={cx} cy={cy} w={NW} h={NH} r={8} seed={seedOf(`pg-n${r}${c}`)} stroke={col} fill={t === 'muted' ? undefined : tone(t)} strokeWidth={t === 'muted' ? 1.4 : 2.2} />
                  {[0, 1, 2, 3].map((g) => (
                    <SketchBox key={g} cx={cx - 93 + g * 62} cy={cy + 14} w={50} h={34} r={6} seed={seedOf(`pg-g${r}${c}${g}`)} stroke={col} fill="var(--node)" />
                  ))}
                  <HandText x={cx} y={cy - 32} size={TEXT_SIZES.label} color={col}>{`node ${r * 2 + c + 1}`}</HandText>
                </g>
              );
            }),
          )}
          <HandText x={20} y={CY[0]} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">replica 1</HandText>
          <HandText x={20} y={CY[1]} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">replica 2</HandText>
          {s.flows.map((f, k) => {
            const x1 = CX[f.from[1]];
            const y1 = CY[f.from[0]];
            const x2 = CX[f.to[1]];
            const y2 = CY[f.to[0]];
            const horiz = y1 === y2;
            const pts: [number, number][] = horiz
              ? [[x1 + Math.sign(x2 - x1) * (NW / 2 + 6), y1 + (f.tone === 'warn' ? 30 : -4)], [x2 - Math.sign(x2 - x1) * (NW / 2 + 6), y2 + (f.tone === 'warn' ? 30 : -4)]]
              : [[x1, y1 + NH / 2 + 6], [x2, y2 - NH / 2 - 6]];
            const midX = (pts[0][0] + pts[1][0]) / 2;
            const midY = (pts[0][1] + pts[1][1]) / 2;
            return (
              <g key={k}>
                <SketchArrow points={pts} head="end" seed={seedOf(`pg-f${i}${k}`)} stroke={tone(f.tone)} strokeWidth={2.2} />
                {f.label && (
                  <HandText x={horiz ? midX : midX + 62} y={horiz ? midY - 16 : midY} size={TEXT_SIZES.note} color={tone(f.tone)}>{f.label}</HandText>
                )}
              </g>
            );
          })}
          <HandText x={360} y={335} size={TEXT_SIZES.label} color="var(--accent)">{s.note}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

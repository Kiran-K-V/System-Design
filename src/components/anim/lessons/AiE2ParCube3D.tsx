import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type CubeTarget, type Vec3 } from '../three/blocks';
import { usePalette } from '../three/theme';

/** Toy cluster (illustrative): 6 layers, 3 pipeline stages, 2 tensor halves, 2 data copies = 12 GPUs. */
interface Step {
  caption: string;
  distance: number;
  /** Which cuts are visible: 0 none, 1 pipeline, 2 + tensor, 3 + data. */
  cuts: 0 | 1 | 2 | 3;
  /** Highlights the one GPU: data copy 2, stage 2, bottom half. */
  pick: boolean;
}

const steps: Step[] = [
  {
    caption:
      'A big model is a stack of layers, like pancakes. One GPU cannot do all the work alone, so we cut the stack up in different directions. Each cut has a name.',
    distance: 9,
    cuts: 0,
    pick: false,
  },
  {
    caption:
      'Cut 1, pipeline parallelism: split the stack into stages, left to right. Each stage lives on its own GPU, and the work flows through the stages like a factory line. Here there are 3 stages, shown in 3 colors.',
    distance: 11,
    cuts: 1,
    pick: false,
  },
  {
    caption:
      'Cut 2, tensor parallelism: split every layer in two, top and bottom. The two halves sit on two GPUs that work on the same layer together and share their results after each step. Now every stage uses 2 GPUs.',
    distance: 12,
    cuts: 2,
    pick: false,
  },
  {
    caption:
      'Cut 3, data parallelism: make a full second copy of everything. The two copies read different pieces of the training data at the same time, then agree on what they learned. Now there are 2 copies × 3 stages × 2 halves = 12 GPUs.',
    distance: 14,
    cuts: 3,
    pick: false,
  },
  {
    caption:
      'Pick one GPU. It holds only a small piece: one stage (two layers), only the bottom half of those layers, in copy 2 of 2. A fourth cut, context parallelism, splits very long text. It needs one more direction, so a cube cannot show it.',
    distance: 14,
    cuts: 3,
    pick: true,
  },
];

const LAYERS = 6;
const SLAB: Vec3 = [0.42, 0.9, 1.8]; // thin along x (the layer direction), wide along z
const LAYER_PITCH = 0.5;
const STAGE_GAP = 0.9;
const HALF_GAP = 0.4;
const COPY_OFFSET = 3.3;

export default function AiE2ParCube3D() {
  const p = usePalette();
  return (
    <AnimFrame title="The GPU cube: three ways to cut one model" steps={steps} interval={5200}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: ReturnType<typeof usePalette> }) {
  const stageColor = [p.accent, p.ok, p.warn];
  const cubes: { key: string; t: CubeTarget }[] = [];

  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < LAYERS; k++) {
      const stage = Math.floor(k / 2);
      for (let h = 0; h < 2; h++) {
        const copyOn = r === 0 || step.cuts >= 3;
        const halfOn = h === 0 || step.cuts >= 2;
        const split = step.cuts >= 2;
        const picked = step.pick && r === 1 && stage === 1 && h === 1;
        const dim = step.pick && !picked;

        const z = step.cuts >= 3 ? (r === 0 ? -COPY_OFFSET / 2 : COPY_OFFSET / 2) : 0;
        const x = (k - (LAYERS - 1) / 2) * LAYER_PITCH + (step.cuts >= 1 ? (stage - 1) * STAGE_GAP : 0);
        const halfH = SLAB[1];
        const y = split ? (h === 0 ? 1 : -1) * (halfH / 2 + HALF_GAP / 2) : 0;
        const height = split ? halfH : halfH * 2;

        const face = !copyOn || !halfOn ? 0 : dim ? 0.1 : picked ? 0.95 : 0.55;
        const edge = !copyOn || !halfOn ? 0 : dim ? 0.2 : picked ? 1 : 0.55;
        cubes.push({
          key: `${r}-${k}-${h}`,
          t: {
            pos: [x, y, z],
            size: [SLAB[0], height, SLAB[2]],
            color: step.cuts >= 1 ? stageColor[stage] : p.muted,
            face,
            edge,
            edgeColor: p.fg,
          },
        });
      }
    }
  }

  const legend = [
    ...(step.cuts >= 1
      ? [
          { label: 'Left to right: pipeline stages', },
          { label: 'Stage 1', color: stageColor[0] },
          { label: 'Stage 2', color: stageColor[1] },
          { label: 'Stage 3', color: stageColor[2] },
        ]
      : []),
    ...(step.cuts >= 2 ? [{ label: 'Top to bottom: tensor halves' }] : []),
    ...(step.cuts >= 3 ? [{ label: 'Front to back: data copies' }] : []),
    ...(step.pick ? [{ label: 'Solid block: the one GPU we picked', color: p.fg }] : []),
  ];

  return (
    <Stage3D label="A cube of GPUs. One model is cut into stages, halves and copies, and each small block runs on its own GPU." distance={step.distance} legend={legend} angle={[0.5, -0.6]}>
      {cubes.map((c) => (
        <Cube key={c.key} {...c.t} />
      ))}
    </Stage3D>
  );
}

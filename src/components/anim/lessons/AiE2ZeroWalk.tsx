import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { commVolume, partFraction, type Stage } from './AiE2MemLogic';

/** Four GPUs, bytes held per parameter on each. Heights come from the 16 bytes rule: weights 2, gradients 2, optimizer states 12. */

const ND = 4;
const PX = 11; // pixels per byte
const BASE = 232;
const GPU_X = [105, 285, 465, 645];

interface Step {
  caption: string;
  stage: Stage;
  comm?: boolean;
}

const steps: Step[] = [
  { stage: 0, caption: 'Plain data parallel: every GPU holds a full copy of everything, 16 bytes per parameter. The four copies are identical, so three quarters of the memory in this picture is repeated.' },
  { stage: 1, caption: 'ZeRO stage 1: shard the optimizer states. GPU k keeps only quarter k of the 12 bytes, so it holds 3 bytes of them. Weights and gradients stay whole. Per GPU: 2 + 2 + 3 = 7 bytes per parameter. With many GPUs this approaches 4, which is the "about 4 times less" in the paper.' },
  { stage: 2, caption: 'ZeRO stage 2: shard the gradients too. Each GPU now keeps only the gradient quarter that matches its optimizer shard. Per GPU: 2 + 0.5 + 3 = 5.5 bytes per parameter. With many GPUs this approaches 2, about 8 times less than 16.' },
  { stage: 3, caption: 'ZeRO stage 3: shard the weights too. Now every part is split four ways: 16 divided by 4 = 4 bytes per parameter per GPU. The saving grows with the number of GPUs.' },
  { stage: 3, comm: true, caption: 'The price: a GPU no longer holds the weights of the layer it must run. Before each layer, the GPUs gather the layer\'s weight shards from each other, use them, and drop them. The paper counts the traffic at 1.5 times plain data parallel for stage 3. Stages 1 and 2 add none.' },
];

const COLORS = { w: 'var(--accent)', g: 'var(--warn)', o: 'var(--muted)' };

export default function AiE2ZeroWalk() {
  return (
    <AnimFrame title="ZeRO: four GPUs, stage by stage" steps={steps} interval={6500}>
      {(_i, s) => {
        const st = s.stage;
        const parts = [
          { id: 'weights', bytes: 2, color: COLORS.w },
          { id: 'grads', bytes: 2, color: COLORS.g },
          { id: 'master', bytes: 12, color: COLORS.o },
        ];
        const perGpu = parts.reduce((n, p) => n + p.bytes * partFraction(p.id === 'master' ? 'master' : p.id, st, ND), 0);
        return (
          <SketchSvg width={720} height={290} label={`Memory per GPU at ZeRO stage ${st}: ${perGpu} bytes per parameter.`}>
            {GPU_X.map((cx, g) => {
              let y = BASE;
              return (
                <g key={g}>
                  <HandText x={cx} y={24} size={TEXT_SIZES.label} mono color="var(--accent)">{`${perGpu} B / param`}</HandText>
                  {parts.map((p) => {
                    const h = Math.max(p.bytes * partFraction(p.id, st, ND) * PX, 6);
                    y -= h;
                    return <SketchBox key={p.id} cx={cx} cy={y + h / 2} w={110} h={h} r={4} seed={seedOf(`zw-${g}-${p.id}-${st}`)} stroke={p.color} fill={p.color} />;
                  })}
                  <HandText x={cx} y={BASE + 18} size={TEXT_SIZES.label} color="var(--muted)">{`GPU ${g + 1}`}</HandText>
                </g>
              );
            })}
            {s.comm &&
              [0, 1, 2].map((k) => (
                <SketchArrow key={k} points={[[GPU_X[k] + 62, 140], [GPU_X[k + 1] - 62, 140]]} head="both" seed={seedOf(`zw-ar-${k}`)} stroke="var(--accent)" />
              ))}
            {s.comm && (
              <HandText x={360} y={104} size={TEXT_SIZES.note} color="var(--accent)">gather weight shards before each layer</HandText>
            )}
            {[['Weights 2 B', COLORS.w], ['Gradients 2 B', COLORS.g], ['Optimizer 12 B', COLORS.o]].map(([t, c], k) => (
              <HandText key={t} x={150 + k * 190} y={272} size={TEXT_SIZES.note} color={c}>{t}</HandText>
            ))}
            <HandText x={700} y={272} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">{`traffic ${commVolume(st)}x`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * One training step, memory in GB per 1B parameters (so a 70B model scales by 70). Weights 2, gradients 2 and optimizer states 12
 * come from the 16-bytes rule. The activation numbers are illustrative: they depend on batch size and sequence length.
 */

interface Step {
  caption: string;
  title: string;
  w: number;
  g: number;
  opt: number;
  act: number;
  note: string;
}

const steps: Step[] = [
  { title: 'Between steps', w: 2, g: 0, opt: 12, act: 0, note: 'weights and optimizer states wait', caption: 'Before the step, a GPU holds the 16-bit weights (2 bytes per parameter) and the optimizer states (12 bytes: master weights, momentum, variance). Gradients are not allocated yet. Activations do not exist yet. Units here are GB per billion parameters, so a 70B model is 70 times each bar.' },
  { title: 'Forward pass', w: 2, g: 0, opt: 12, act: 4, note: 'activations grow layer by layer', caption: 'Forward pass: the batch flows through the layers. Each layer saves its outputs, called activations, because the backward pass needs them. They grow with every layer. Their size follows batch size and sequence length, so this height is illustrative.' },
  { title: 'End of forward', w: 2, g: 0, opt: 12, act: 8, note: 'activations at their peak', caption: 'End of the forward pass: all activations are stored and the loss is known. No gradient exists yet. This is where activation memory peaks, and often where the whole step peaks.' },
  { title: 'Backward pass', w: 2, g: 1, opt: 12, act: 4, note: 'gradients fill in, activations freed', caption: 'Backward pass: the model walks the layers in reverse. Each layer produces its gradients and then frees its stored activations. So gradients grow while activations shrink. The total falls from the peak.' },
  { title: 'End of backward', w: 2, g: 2, opt: 12, act: 0, note: 'all gradients, no activations', caption: 'End of backward: every gradient is ready (2 bytes per parameter) and all activations are gone. In data parallel training, the GPUs now average these gradients. That adds network traffic, the next lesson\'s topic.' },
  { title: 'Optimizer step', w: 2, g: 2, opt: 12, act: 0, note: 'update the 32-bit copies, then cast', caption: 'Optimizer step: Adam reads the gradients and updates the 32-bit master weights, momentum, and variance. It then writes the new 16-bit weights. After this the gradients are freed and the next step starts. The 16 bytes were all live at some point in the step.' },
  { title: 'With checkpointing', w: 2, g: 0, opt: 12, act: 1.5, note: 'keep a few activations, recompute the rest', caption: 'Activation checkpointing: keep only a few activations at chosen layers. In the backward pass, recompute the dropped ones from the nearest saved layer. The peak falls a lot. The price is extra forward compute: the ZeRO paper puts it at about 33%. This height is illustrative too.' },
];

const TOTAL_MAX = 24;
const X0 = 60;
const W = 600;

export default function AiE2StepPeaks() {
  return (
    <AnimFrame title="One training step: memory per billion parameters" steps={steps} interval={6500}>
      {(i, s) => {
        const parts = [
          { n: 'Weights', v: s.w, c: 'var(--accent)' },
          { n: 'Gradients', v: s.g, c: 'var(--warn)' },
          { n: 'Optimizer', v: s.opt, c: 'var(--muted)' },
          { n: 'Activations', v: s.act, c: i === 2 ? 'var(--bad)' : 'var(--ok)' },
        ];
        const total = s.w + s.g + s.opt + s.act;
        let x = X0;
        return (
          <SketchSvg width={720} height={256} label={`${s.title}: ${total} GB per billion parameters in total.`}>
            <HandText x={360} y={28} size={TEXT_SIZES.heading} color="var(--accent)">{s.title}</HandText>
            {parts.map((p) => {
              const w = (p.v / TOTAL_MAX) * W;
              if (w < 1) return null;
              const cx = x + w / 2;
              x += w;
              return (
                <g key={p.n}>
                  <SketchBox cx={cx} cy={100} w={Math.max(w - 4, 4)} h={60} r={6} seed={seedOf(`sp-${p.n}-${i}`)} stroke={p.c} fill={p.c} />
                  
                </g>
              );
            })}
            <HandText x={X0} y={160} anchor="start" size={TEXT_SIZES.label} mono color="var(--muted)">
              {`${total.toFixed(1)} GB per 1B params`}
            </HandText>
            <HandText x={X0} y={196} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              {s.note}
            </HandText>
            {parts.map((p, k) => (
              <HandText key={p.n} x={X0 + k * 150} y={232} anchor="start" size={TEXT_SIZES.note} color={p.c}>
                {p.n}
              </HandText>
            ))}
            <HandText x={X0 + W} y={160} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
              bar scale is fixed across steps
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

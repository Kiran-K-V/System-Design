import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { GPUS, ridge, roofline } from './ai2MathA';

const H100 = GPUS[0];
const PEAK = H100.denseBf16 / 1e12; // TFLOPS
const BW = H100.bw / 1e12; // TB/s, so intensity x BW = TFLOPS
const RIDGE = ridge(H100.denseBf16, H100.bw);

// Log-log chart. x: FLOP per byte 1..10^4. y: TFLOPS 1..10^3.
const X0 = 90;
const X1 = 690;
const Y0 = 270;
const Y1 = 40;
const px = (i: number) => X0 + (Math.log10(i) / 4) * (X1 - X0);
const py = (t: number) => Y0 - (Math.log10(t) / 3) * (Y0 - Y1);

interface Step {
  caption: string;
  dot?: { i: number; label: string };
  showRidge?: boolean;
  readout: string;
}

const pctOf = (i: number) => `${((roofline(i, PEAK, BW) / PEAK) * 100).toFixed(1)}%`;

const steps: Step[] = [
  {
    caption:
      'A roofline plot shows the two ceilings of a GPU for one precision. x is arithmetic intensity: FLOPs of work per byte moved from memory. y is the FLOP/s you can reach. The sloped line is the memory ceiling: more work per byte means more FLOP/s. The flat line is the compute ceiling: 989 TFLOPS (H100, BF16, dense).',
    readout: 'slope = memory ceiling, flat = compute ceiling',
  },
  {
    caption: `The two lines meet at the ridge point: peak FLOPs divided by bandwidth. 989 TFLOPS / 3.35 TB/s = ${RIDGE.toFixed(0)} FLOP per byte. Left of the ridge a kernel is memory-bound. Right of it, compute-bound.`,
    showRidge: true,
    readout: `ridge = 989 / 3.35 = ${RIDGE.toFixed(0)} FLOP/byte`,
  },
  {
    caption:
      'Decode at batch 1. Each BF16 weight is 2 bytes and gives 2 FLOPs (one multiply, one add) for one token. That is 1 FLOP per byte. The dot sits at the far left: 3.35 TFLOPS, about 0.3% of the compute ceiling. The math units are idle almost all the time.',
    dot: { i: 1, label: 'batch 1' },
    showRidge: true,
    readout: `intensity 1 -> 3.35 TFLOPS (${pctOf(1)} of peak)`,
  },
  {
    caption:
      'Batch 16. The same weight read now serves 16 tokens, so intensity is about 16. The dot slides up the slope: 53.6 TFLOPS. The step takes about as long as at batch 1, because the weight read sets the time. You got 16 tokens for the price of one.',
    dot: { i: 16, label: 'batch 16' },
    showRidge: true,
    readout: `intensity 16 -> 53.6 TFLOPS (${pctOf(16)} of peak)`,
  },
  {
    caption: 'Batch 64: intensity 64, 214 TFLOPS. Still on the slope, so still memory-bound. Each doubling of batch doubles useful work per step until the ridge.',
    dot: { i: 64, label: 'batch 64' },
    showRidge: true,
    readout: `intensity 64 -> 214 TFLOPS (${pctOf(64)} of peak)`,
  },
  {
    caption:
      'Batch near 295 reaches the ridge and the roof. Past it, a bigger batch no longer makes steps cheaper per token. This model is simple: it ignores the KV cache reads, which grow with batch and context and push the real ridge to a larger batch.',
    dot: { i: RIDGE, label: 'batch ~295' },
    showRidge: true,
    readout: `intensity ${RIDGE.toFixed(0)} -> 989 TFLOPS (100% of peak)`,
  },
  {
    caption:
      'Prefill. The prompt tokens go through the weights together, so a 2,000-token prompt has intensity about 2,000. It sits on the flat roof: compute-bound. A prompt shorter than about 295 tokens is still on the slope. Long prompts cost compute time. Decode costs memory time.',
    dot: { i: 2000, label: 'prefill 2,000' },
    showRidge: true,
    readout: 'intensity 2,000 -> compute-bound (on the roof)',
  },
];

export default function Ai2PdRoof() {
  return (
    <AnimFrame title="Roofline: one H100, BF16, dense" steps={steps} interval={6000}>
      {(_, s) => (
        <SketchSvg width={720} height={350} label="Roofline plot with a memory slope, a compute roof, the ridge point at 295, and a dot for batch size">
          <SketchArrow points={[[X0, Y0], [X0, Y1 - 12]]} seed={seedOf('rf-y')} />
          <SketchArrow points={[[X0, Y0], [X1 + 10, Y0]]} seed={seedOf('rf-x')} />
          <HandText x={X0 - 12} y={Y1 - 22} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            TFLOPS reached
          </HandText>
          <HandText x={X1} y={Y0 + 40} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
            FLOP per byte (log scale)
          </HandText>
          {[1, 10, 100, 1000, 10000].map((v) => (
            <HandText key={v} x={px(v)} y={Y0 + 16} size={TEXT_SIZES.note} mono color="var(--muted)">
              {v.toLocaleString('en-US')}
            </HandText>
          ))}
          {[1, 10, 100, 1000].map((v) => (
            <HandText key={v} x={X0 - 8} y={py(v)} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
              {String(v)}
            </HandText>
          ))}
          <SketchArrow points={[[px(1), py(BW)], [px(RIDGE), py(PEAK)]]} head="none" seed={seedOf('rf-slope')} stroke="var(--accent)" strokeWidth={2.2} />
          <SketchArrow points={[[px(RIDGE), py(PEAK)], [px(10000), py(PEAK)]]} head="none" seed={seedOf('rf-roof')} stroke="var(--ok)" strokeWidth={2.2} />
          <HandText x={px(14)} y={py(3)} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">
            memory-bound
          </HandText>
          <HandText x={px(5500)} y={py(PEAK) - 14} size={TEXT_SIZES.note} color="var(--ok)">
            compute-bound
          </HandText>
          {s.showRidge && (
            <>
              <SketchArrow points={[[px(RIDGE), py(PEAK) + 4], [px(RIDGE), Y0]]} head="none" dashed seed={seedOf('rf-ridge')} stroke="var(--muted)" />
              <HandText x={px(RIDGE) - 8} y={Y0 - 22} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">
                ridge 295
              </HandText>
            </>
          )}
          {s.dot && (
            <>
              <SketchEllipse cx={px(s.dot.i)} cy={py(roofline(s.dot.i, PEAK, BW))} w={18} h={18} seed={seedOf('rf-dot')} stroke="var(--accent)" strokeWidth={2.2} fill="var(--accent)" />
              <HandText x={px(s.dot.i) + (s.dot.i > 1000 ? -16 : 16)} y={py(roofline(s.dot.i, PEAK, BW)) + (s.dot.i > 1000 ? 22 : 20)} anchor={s.dot.i > 1000 ? 'end' : 'start'} size={TEXT_SIZES.label} color="var(--accent)">
                {s.dot.label}
              </HandText>
            </>
          )}
          <HandText x={360} y={332} size={TEXT_SIZES.label} mono color="var(--fg)">
            {s.readout}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

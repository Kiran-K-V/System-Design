import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { STEP_SEC, latency } from './Ai12DiffLogic';

const COLS = 14;
const ROWS = 8;
const CELL = 30;
const X0 = 24;
const Y0 = 30;

/** Deterministic hash in [0, 1). No Math.random: the render must match on server and client. */
function h(i: number, salt: number): number {
  let x = (i * 2654435761 + salt * 40503) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

/** The picture the model is "heading to": a sun over a hill. */
function target(c: number, r: number): string {
  if ((c - 10) ** 2 + (r - 2) ** 2 <= 3.2) return 'var(--warn)';
  const hill = 5.2 + Math.sin(c / 2.2) * 1.1;
  if (r >= hill) return 'var(--ok)';
  return 'var(--accent)';
}
const NOISE = ['var(--muted)', 'var(--bad)', 'var(--warn)', 'var(--accent)', 'var(--ok)', 'var(--surface)'];

interface Step {
  caption: string;
  n: number;
  level: number;
  decoded?: boolean;
  label: string;
}

const TOTAL = 30;
const steps: Step[] = [
  {
    caption:
      'Start: pure noise. The model works on a latent, a small grid of numbers that stands for the picture (about 8 times smaller on each side than the final pixels). Every cell is random. Nothing is drawn yet. Time spent: 0.',
    n: 0,
    level: 1,
    label: 'noise',
  },
  {
    caption:
      'Step 1. The model looks at the noisy latent and the prompt, and predicts which part is noise. The scheduler removes a small slice of it. The change is tiny. Time: 1 x 0.086 s = 0.09 s. Guidance (blending a with-prompt and a without-prompt prediction) makes this one call do double the work.',
    n: 1,
    level: 0.97,
    label: 'step 1',
  },
  {
    caption: 'Step 5. Coarse layout is forming: a light sky, a dark ground. Fine detail is still noise. Time: 5 x 0.086 s = 0.43 s.',
    n: 5,
    level: 0.8,
    label: 'step 5',
  },
  {
    caption: 'Step 15. Shapes are clear, edges are rough. Half the steps are done and half the time is spent: 15 x 0.086 s = 1.29 s.',
    n: 15,
    level: 0.45,
    label: 'step 15',
  },
  {
    caption: 'Step 30. The latent is clean. Each step reused the same weights, so the cost is linear: 30 x 0.086 s = 2.58 s. Illustrative picture; the step time comes from a vendor benchmark (see the numbers section).',
    n: 30,
    level: 0,
    label: 'step 30',
  },
  {
    caption:
      'Last, the VAE decoder turns the clean latent into the full pixel image in one pass. In the benchmark number this decode is already inside the 0.086 s per step average, so it adds no extra time here.',
    n: 30,
    level: 0,
    decoded: true,
    label: 'decoded',
  },
  {
    caption:
      'Same prompt on a distilled model: 4 steps, 4 x 0.086 s = 0.34 s, about 7.5 times faster than 30 steps. The result is a little softer here. That is the trade. This assumes a distilled step costs the same as a normal one. Quality here is illustrative.',
    n: 4,
    level: 0.12,
    label: 'distilled, 4 steps',
  },
];

export default function Ai12DiffDenoise() {
  return (
    <AnimFrame title="Noise to image: each step is one model call" steps={steps} interval={6500}>
      {(_, s) => {
        const sec = s.label.startsWith('distilled') ? latency(4) : latency(s.n);
        const frac = Math.min(1, sec / latency(TOTAL));
        const total = s.label.startsWith('distilled') ? 4 : TOTAL;
        const cells = [];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            const clean = h(i, 1) >= s.level;
            const fill = clean ? target(c, r) : NOISE[Math.floor(h(i, 7) * NOISE.length)];
            cells.push(
              <SketchBox key={i} cx={X0 + c * CELL + CELL / 2} cy={Y0 + r * CELL + CELL / 2} w={CELL - 2} h={CELL - 2} r={6} seed={seedOf(`dd${i}`)} stroke="var(--border)" fill={fill} />,
            );
          }
        }
        return (
          <SketchSvg width={720} height={310} label={`Denoising picture at ${s.label}. Time spent ${sec.toFixed(2)} seconds.`}>
            {cells}
            <HandText x={24} y={286} anchor="start" size={TEXT_SIZES.label} color={s.decoded ? 'var(--ok)' : 'var(--fg)'}>
              {s.decoded ? 'pixels (decoded)' : s.n === 0 ? 'latent: noise' : 'latent: ' + s.label}
            </HandText>
            <HandText x={580} y={44} size={TEXT_SIZES.heading} color="var(--muted)">
              Time spent
            </HandText>
            <HandText x={580} y={92} size={TEXT_SIZES.display} mono color="var(--accent)">
              {sec.toFixed(2) + ' s'}
            </HandText>
            <HandText x={580} y={134} size={TEXT_SIZES.label} mono color="var(--muted)">
              {`${s.n} of ${total} steps`}
            </HandText>
            <HandText x={580} y={164} size={TEXT_SIZES.note} mono color="var(--muted)">
              {`${STEP_SEC * 1000} ms per step`}
            </HandText>
            <SketchBox cx={580} cy={208} w={200} h={22} r={6} seed={seedOf('ddbar')} stroke="var(--muted)" />
            {frac > 0 && <SketchBox cx={480 + (200 * frac) / 2} cy={208} w={Math.max(12, 200 * frac)} h={22} r={6} seed={seedOf('ddfill')} stroke="var(--accent)" fill="var(--accent)" />}
            <HandText x={580} y={244} size={TEXT_SIZES.note} color="var(--muted)">
              bar = share of the 30-step time
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

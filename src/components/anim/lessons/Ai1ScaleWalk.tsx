import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { chinchillaSplit, fmtCount, kaplanSplit, trainFlops } from './Ai1ScaleMath';

const C = 5.76e23;
const ch = chinchillaSplit(C);
const kp = kaplanSplit(C);
const LLAMA_C = trainFlops(8e9, 15e12);

type Tone = 'accent' | 'ok' | 'bad' | 'warn' | 'muted';
interface Box {
  title: string;
  value: string;
  tone: Tone;
}
interface Step {
  caption: string;
  boxes: [Box, Box, Box];
  formula: string;
  note?: string;
}

const steps: Step[] = [
  {
    caption:
      'Start with a budget. Chinchilla used about 5.76e23 FLOPs, the same as its predecessor Gopher. The question: for this fixed C, how many parameters N and how many training tokens D give the lowest loss?',
    boxes: [
      { title: 'Budget C', value: '5.76e23', tone: 'accent' },
      { title: 'Params N', value: '?', tone: 'muted' },
      { title: 'Tokens D', value: '?', tone: 'muted' },
    ],
    formula: 'C = 6 x N x D',
    note: '6 = 2 (forward) + 4 (backward), per parameter per token',
  },
  {
    caption:
      'One equation, two unknowns. Any pair with N x D = C / 6 = 9.6e22 fits the budget: 10B params and 9.6T tokens, or 100B and 960B. They do not give the same loss. Kaplan et al. 2020 and Hoffmann et al. 2022 measured which pair wins, and they disagreed.',
    boxes: [
      { title: 'Budget C', value: '5.76e23', tone: 'muted' },
      { title: 'Params N', value: '?', tone: 'accent' },
      { title: 'Tokens D', value: '?', tone: 'accent' },
    ],
    formula: 'N x D = 9.6e22',
  },
  {
    caption:
      'Chinchilla fits many training runs and finds that N and D should grow together. Table 3 of the paper lists the best token count for each size, and the ratio is about 20 tokens per parameter (our reading of that table, not a sentence in the paper). Put D = 20 N into C = 6ND and you get C = 120 N squared.',
    boxes: [
      { title: 'Budget C', value: '5.76e23', tone: 'muted' },
      { title: 'Params N', value: 'N', tone: 'accent' },
      { title: 'Tokens D', value: '20 N', tone: 'accent' },
    ],
    formula: 'C = 6 x N x 20N = 120 N^2',
  },
  {
    caption: `Solve it. N = sqrt(5.76e23 / 120) = sqrt(4.8e21) = ${fmtCount(ch.n)} params. D = 20 N = ${fmtCount(ch.d)} tokens. Table 3 row for this budget says 67B params and 1.5T tokens. Our simple rule is within 4% on N and 8% on D. Chinchilla itself is 70B params and 1.4T tokens.`,
    boxes: [
      { title: 'Budget C', value: '5.76e23', tone: 'muted' },
      { title: 'Params N', value: fmtCount(ch.n), tone: 'ok' },
      { title: 'Tokens D', value: fmtCount(ch.d), tone: 'ok' },
    ],
    formula: 'N = sqrt(C / 120)',
    note: 'Table 3: 67B and 1.5T',
  },
  {
    caption: `Now apply Kaplan's rule to the same budget. It says N grows as C to the power 0.73, against Chinchilla's 0.49 to 0.50. Extrapolated from Kaplan's fit, the rule gives about ${fmtCount(kp.n)} params and only ${fmtCount(kp.d)} tokens, about ${(kp.d / kp.n).toFixed(2)} tokens per parameter. Following it, you would build a giant model and starve it of data.`,
    boxes: [
      { title: 'Budget C', value: '5.76e23', tone: 'muted' },
      { title: 'Params N (Kaplan)', value: fmtCount(kp.n), tone: 'bad' },
      { title: 'Tokens D (Kaplan)', value: fmtCount(kp.d), tone: 'bad' },
    ],
    formula: 'N = 1.3e9 x (C / 8.64e19)^0.73',
    note: 'Derived by us from Kaplan Table 5',
  },
  {
    caption: `Real teams then break the rule on purpose. Llama 3 8B saw about 15T tokens. Its budget is 6 x 8e9 x 15e12 = ${(LLAMA_C / 1e23).toFixed(1)}e23 FLOPs. Optimal for that budget would be about ${fmtCount(chinchillaSplit(LLAMA_C).n)} params. They chose 8B, so each served token costs 2N = 16 GFLOPs, not about 155 GFLOPs. Training is not the bill that matters most. Serving is.`,
    boxes: [
      { title: 'Budget C', value: '7.2e23', tone: 'muted' },
      { title: 'Params N', value: '8B', tone: 'warn' },
      { title: 'Tokens D', value: '15T', tone: 'warn' },
    ],
    formula: '15T / 8B = 1,875 tokens per param',
    note: 'about 94 times the 20 per param ratio',
  },
];

const tone = (t: Tone) => `var(--${t})`;
const BX = [130, 360, 590];

export default function Ai1ScaleWalk() {
  return (
    <AnimFrame title="From a compute budget to a model size" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={720} height={250} label={`Step ${i + 1} of a compute-optimal sizing walk`}>
          {s.boxes.map((b, k) => (
            <g key={b.title + k}>
              <SketchBox cx={BX[k]} cy={80} w={190} h={110} r={8} seed={seedOf(`sw-${k}`)} fill={tone(b.tone)} stroke={tone(b.tone)} strokeWidth={b.tone === 'muted' ? 1.4 : 2.2} />
              <HandText x={BX[k]} y={46} size={TEXT_SIZES.label} color={b.tone === 'muted' ? 'var(--muted)' : tone(b.tone)}>
                {b.title}
              </HandText>
              <HandText x={BX[k]} y={92} size={TEXT_SIZES.display} mono color={b.tone === 'muted' ? 'var(--muted)' : 'var(--fg)'}>
                {b.value}
              </HandText>
            </g>
          ))}
          <SketchArrow points={[[232, 80], [258, 80]]} seed={seedOf('sw-a1')} stroke="var(--muted)" />
          <SketchArrow points={[[462, 80], [488, 80]]} seed={seedOf('sw-a2')} stroke="var(--muted)" />
          <HandText x={360} y={180} size={TEXT_SIZES.title} mono>
            {s.formula}
          </HandText>
          <HandText x={360} y={218} size={TEXT_SIZES.note} color="var(--muted)">
            {s.note ?? ''}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

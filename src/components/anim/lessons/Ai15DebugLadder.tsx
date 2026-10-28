import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Suspect = 'open' | 'cleared' | 'culprit';

interface Step {
  caption: string;
  /** Which ladder rung is active. -1 means none yet. */
  rung: number;
  title: string;
  lines: string;
  suspects: [Suspect, Suspect, Suspect, Suspect, Suspect];
}

const RUNGS = ['Capture request', 'Minimal repro', 'Rerun 20 times', 'Read logprobs', 'Check tokens', 'Retrieval or model', 'Bisect the prompt'];
const SUSPECTS = ['One-off luck', 'Tokenizer', 'Retrieval', 'Prompt', 'Model'];

const O: Suspect = 'open';
const C: Suspect = 'cleared';

const steps: Step[] = [
  {
    caption: 'A grocery bot told a customer "24 hours" for a UPI refund. The policy says 5 to 7 days. Five suspects are open, and the numbers here are illustrative. Step 1. Pull the saved request from the trace. It holds the system prompt, the examples, the retrieved text, and the settings. The playground copy had none of these, so it was a different request. A repro must start from the real one.',
    rung: 0,
    title: 'Saved request 7f3a',
    lines: 'Has: system prompt, 3 examples,\n2 retrieved chunks, temperature 0.\nThe playground copy had none of it.\nPlayground: fine. Saved request: fails.',
    suspects: [O, O, O, O, O],
  },
  {
    caption: 'Step 2. Turn the saved request into one file and one command, and cut what is clearly unrelated. Here the chat history goes from 12 turns to the last question. The failure stays, so the cut was safe. Now a try takes seconds.',
    rung: 1,
    title: 'repro.py',
    lines: 'Reads request.json, calls the same\npinned model, prints the answer.\nChat history: 12 turns cut to 1.\nStill fails. One try takes 3 seconds.',
    suspects: [O, O, O, O, O],
  },
  {
    caption: 'Step 3. Run the repro many times. 6 wrong in 20 is a steady rate, not a one-off. A bug that fails every time points at the input. A bug that fails sometimes points at a close call inside the model. This one is a close call.',
    rung: 2,
    title: '20 runs of repro.py',
    lines: 'Wrong ("24 hours"):        6\nRight ("5 to 7 days"):    14\nA 30% rate is not luck.\nThe model is torn between two answers.',
    suspects: [C, O, O, O, O],
  },
  {
    caption: 'Step 4. Compare a wrong run and a right run. Find the first token where they differ. Read the logprobs there. The two top choices are almost equal, so a tiny shift in the numbers can flip the answer.',
    rung: 3,
    title: 'First token that differs',
    lines: 'Token "24":  logprob -0.65  = 52%\nToken "5":   logprob -0.84  = 43%\nA near tie. Both answers look\nplausible to the model.',
    suspects: [C, O, O, O, O],
  },
  {
    caption: 'Step 5. Print the exact text the model got and look at how it is cut into tokens. Only a few cases need this: odd whitespace, long numbers, rare names. Here the text is clean, so the tokenizer is cleared. The check took one minute.',
    rung: 4,
    title: 'Exact prompt, with repr()',
    lines: 'No stray space. No odd characters.\nNumbers and the rupee sign cut\nin the usual way.\nNothing odd. Tokenizer cleared.',
    suspects: [C, C, O, O, O],
  },
  {
    caption: 'Step 6. Ask: is the answer in the context at all? It is. Then run the golden test: give the model only the right chunk. It still fails 4 times in 20. So retrieval is not the main cause. The fault is on the prompt and model side.',
    rung: 5,
    title: 'Retrieval or model?',
    lines: 'Chunk 1 says "5 to 7 days".\nThe answer is in the context.\nGolden test, only the right chunk,\n20 runs: still 4 wrong. Not retrieval.',
    suspects: [C, C, C, O, O],
  },
  {
    caption: 'Step 7. Remove one prompt part at a time and rerun 20 times. Removing example 3 gives 0 wrong in 20. That example pulled the model toward "24 hours". The fix is to word it as a wallet-refund case. Add this case to the golden set.',
    rung: 6,
    title: 'Bisect the prompt',
    lines: 'Drop one example at a time.\nDrop example 3 ("Wallet refunds are\ninstant, within 24 hours."): 0 wrong.\nFix: say it applies to wallet refunds.',
    suspects: [C, C, C, 'culprit', C],
  },
];

const RX = 150;
const RW = 250;
const RY0 = 38;
const RDY = 50;
const PCX = 505;
const PW = 380;
const PTOP = 18;
const PH = 340;
const SY = 446;
const SW = 124;
const SGAP = 13;

export default function Ai15DebugLadder() {
  return (
    <AnimFrame title="Seven steps from a bad answer to a cause" steps={steps} interval={6000}>
      {(i, s) => (
        <SketchSvg width={720} height={490} label="Seven debugging steps on the left, the evidence for the current step on the right, and five suspects at the bottom.">
          {RUNGS.map((label, r) => {
            const active = s.rung === r;
            const done = s.rung > r;
            return (
              <g key={label}>
                <SketchBox
                  cx={RX}
                  cy={RY0 + r * RDY}
                  w={RW}
                  h={40}
                  r={8}
                  seed={seedOf(`rung${r}`)}
                  stroke={active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)'}
                  strokeWidth={active ? 2.2 : 1.4}
                  fill={active ? 'var(--accent)' : done ? 'var(--ok)' : undefined}
                />
                <HandText x={RX} y={RY0 + r * RDY} size={TEXT_SIZES.label} color={active ? 'var(--accent)' : done ? 'var(--fg)' : 'var(--muted)'}>
                  {`${r + 1}  ${label}`}
                </HandText>
              </g>
            );
          })}
          <SketchBox cx={PCX} cy={PTOP + PH / 2} w={PW} h={PH} r={8} seed={seedOf(`panel${i}`)} stroke="var(--accent)" />
          <HandText x={PCX - PW / 2 + 18} y={PTOP + 28} anchor="start" size={TEXT_SIZES.heading} color="var(--accent)">
            {s.title}
          </HandText>
          <HandText x={PCX - PW / 2 + 18} y={PTOP + 130} anchor="start" size={TEXT_SIZES.label} lineHeight={1.5}>
            {s.lines}
          </HandText>
          {SUSPECTS.map((label, k) => {
            const st = s.suspects[k];
            const cx = 24 + SW / 2 + k * (SW + SGAP);
            const stroke = st === 'culprit' ? 'var(--bad)' : st === 'cleared' ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={label}>
                <SketchBox cx={cx} cy={SY} w={SW} h={44} r={8} seed={seedOf(`sus${k}`)} stroke={stroke} fill={st === 'open' ? undefined : stroke} strokeWidth={st === 'culprit' ? 2.2 : 1.4} dashed={st === 'open'} />
                <HandText x={cx} y={SY} size={TEXT_SIZES.note} color={st === 'open' ? 'var(--muted)' : 'var(--fg)'}>
                  {label}
                </HandText>
              </g>
            );
          })}
          <HandText x={24} y={SY - 36} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
            Suspects: dashed = open, green = cleared, red = cause
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

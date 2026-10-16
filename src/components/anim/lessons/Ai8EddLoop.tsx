import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

// Illustrative: 40 test cases, indexes 0..39. A case in a failing set fails. Index 40 is added at the last step.
const FAIL_V1 = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const FAIL_V2 = new Set([5, 6, 7, 8, 9, 20, 21]);
const FAIL_V3 = new Set([5, 6, 7, 8, 9]);

type Stage = 0 | 1 | 2 | 3;
const STAGES = ['Change', 'Run', 'Compare', 'Ship'];

interface Step {
  caption: string;
  stage: Stage;
  fail: Set<number>;
  /** Show only the cases that flipped between v1 and this run. */
  diff: boolean;
  total: number;
  version: string;
  lines: string[];
  shipped?: boolean;
}

const steps: Step[] = [
  {
    caption: 'The baseline. Prompt v1 ran on all 40 test cases. 30 pass and 10 fail, so the pass rate is 30 / 40 = 75%. Every green square is a case that passed. Every red square is a case that failed. This is the scoreboard to beat.',
    stage: 1, fail: FAIL_V1, diff: false, total: 40, version: 'v1', lines: ['prompt v1', '30 of 40 pass', 'pass rate 75%'],
  },
  {
    caption: 'Change one thing. The team adds a rule about refund windows to the prompt and calls it v2. Nothing has been measured yet, so nothing may be claimed yet. The scoreboard still shows the v1 run.',
    stage: 0, fail: FAIL_V1, diff: false, total: 40, version: 'v2', lines: ['prompt v2 (new rule)', 'not measured yet'],
  },
  {
    caption: 'Run the same 40 cases on v2. The pass rate rises to 33 / 40 = 82.5%. If you looked only at this number, you would ship. Look at which cases moved.',
    stage: 1, fail: FAIL_V2, diff: false, total: 40, version: 'v2', lines: ['prompt v2', '33 of 40 pass', 'pass rate 82.5%'],
  },
  {
    caption: 'Compare case by case. Squares with a thick outline changed since v1. Five were failing and now pass (green). Two were passing and now fail (red). A hand test of three examples would have found only the good news. The two broken cases are the price of this change.',
    stage: 2, fail: FAIL_V2, diff: true, total: 40, version: 'v2', lines: ['fixed 5', 'broken 2', 'do not ship v2'],
  },
  {
    caption: 'Revise the rule and run again as v3. Five cases fixed, none broken, 35 / 40 = 87.5%. The gate is green, so v3 ships. Shipping is the end of one loop, and it is the start of the next.',
    stage: 3, fail: FAIL_V3, diff: true, total: 40, version: 'v3', lines: ['prompt v3', 'fixed 5, broken 0', '35 of 40 pass'], shipped: true,
  },
  {
    caption: 'Real users find a failure the set did not cover. It becomes case 41, and v3 fails it. The set grows and the loop starts again from Change. An eval set is never finished.',
    stage: 0, fail: new Set([...FAIL_V3, 40]), diff: false, total: 41, version: 'v3', lines: ['new case 41 fails', '35 of 41 pass', 'pass rate 85.4%'],
  },
];

const COLS = 10;
const CELL = 24;
const PITCH = 30;
const GX = 52;
const GY = 128;
const SX = [105, 265, 425, 585];

export default function Ai8EddLoop() {
  return (
    <AnimFrame title="The eval loop: change, run, compare, ship" steps={steps} interval={5200}>
      {(i, s) => {
        return (
          <SketchSvg width={720} height={290} label={`Step ${i + 1}: ${STAGES[s.stage]}. ${s.lines.join('. ')}.`}>
            {STAGES.map((name, n) => {
              const on = n === s.stage;
              const tone = on ? (s.shipped ? 'var(--ok)' : 'var(--accent)') : 'var(--muted)';
              return (
                <g key={name}>
                  <SketchBox cx={SX[n]} cy={44} w={130} h={44} r={8} seed={seedOf(`edd-st${n}`)} stroke={tone} fill={on ? tone : undefined} strokeWidth={on ? 2.2 : 1.4} dashed={!on} />
                  <HandText x={SX[n]} y={44} size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'}>{name}</HandText>
                  {n < 3 && <SketchArrow points={[[SX[n] + 72, 44], [SX[n + 1] - 72, 44]]} seed={seedOf(`edd-ar${n}`)} stroke="var(--muted)" />}
                </g>
              );
            })}
            <HandText x={GX - 12} y={102} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              one square = one test case
            </HandText>
            {Array.from({ length: s.total }, (_, c) => {
              const col = c % COLS;
              const row = Math.floor(c / COLS);
              const x = GX + col * PITCH;
              const y = GY + row * PITCH;
              const failNow = s.fail.has(c);
              const failBefore = FAIL_V1.has(c);
              const flipped = c < 40 && failNow !== failBefore;
              const isNew = c === 40;
              let fill: string | undefined = failNow ? 'var(--bad)' : 'var(--ok)';
              let stroke = failNow ? 'var(--bad)' : 'var(--ok)';
              let sw = 1.4;
              if (s.diff && !isNew) {
                if (flipped) {
                  sw = 2.2;
                  stroke = 'var(--accent)';
                } else {
                  fill = undefined;
                  stroke = 'var(--muted)';
                }
              }
              return <SketchBox key={c} cx={x} cy={y} w={CELL} h={CELL} r={6} seed={seedOf(`edd-c${c}`)} stroke={stroke} fill={fill} strokeWidth={sw} dashed={isNew} />;
            })}
            <HandText x={420} y={140} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">{s.lines[0]}</HandText>
            {s.lines.slice(1).map((l, k) => (
              <HandText key={k} x={420} y={176 + k * 32} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">{l}</HandText>
            ))}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

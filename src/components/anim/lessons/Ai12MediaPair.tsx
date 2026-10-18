import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { onlineUpdate, winProb } from './Ai12MediaMath';

const K = 0.5;

interface Step {
  caption: string;
  a: number;
  b: number;
  expect: number;
  note: string;
}

const s0 = { a: 0, b: 0 };
const [a1, b1] = onlineUpdate(s0.a, s0.b, K);
const [a2, b2] = onlineUpdate(a1, b1, K);
const [b3, a3] = onlineUpdate(b2, a2, K);

const f = (n: number) => n.toFixed(2);
const pct = (p: number) => `${Math.round(p * 100)}%`;

const steps: Step[] = [
  {
    caption: `Two models start with the same strength, 0. The chance that A wins a vote is ${pct(winProb(0, 0))}, a coin flip. A strength is a score on a log-odds scale: a gap of 0 means even odds. Model names and numbers are illustrative.`,
    a: 0,
    b: 0,
    expect: winProb(0, 0),
    note: 'start',
  },
  {
    caption: `A voter sees two anonymous images and picks A. A was expected to win ${pct(winProb(0, 0))} of the time, so the surprise is 1 - 0.50 = 0.50. With a step size of ${K}, A moves up ${f(K * 0.5)} and B moves down ${f(K * 0.5)}. Now A = ${f(a1)} and B = ${f(b1)}.`,
    a: a1,
    b: b1,
    expect: winProb(a1, b1),
    note: 'A wins, as a coin flip',
  },
  {
    caption: `Another vote for A. The board now expects A to win ${pct(winProb(a1, b1))}. The surprise is 1 - ${f(winProb(a1, b1))} = ${f(1 - winProb(a1, b1))}, so the move is smaller: ${f(K * (1 - winProb(a1, b1)))}. A = ${f(a2)}, B = ${f(b2)}.`,
    a: a2,
    b: b2,
    expect: winProb(a2, b2),
    note: 'A wins, as expected',
  },
  {
    caption: `An upset: B wins. The board expected A to win ${pct(winProb(a2, b2))}, so B winning has surprise ${f(winProb(a2, b2))}. B moves up ${f(K * winProb(a2, b2))} and A down the same. A = ${f(a3)}, B = ${f(b3)}. Big surprises move the scores most. The arena paper fits all votes at once instead of updating one by one, so order does not matter there.`,
    a: a3,
    b: b3,
    expect: winProb(a3, b3),
    note: 'B wins, an upset',
  },
];

const X0 = 360;
const SCALE = 200;

export default function Ai12MediaPair() {
  return (
    <AnimFrame title="One vote moves two scores, and surprises move them more" steps={steps} interval={6500}>
      {(_, s) => (
        <SketchSvg width={720} height={240} label={`Model A strength ${f(s.a)}, model B strength ${f(s.b)}. Chance A wins ${pct(s.expect)}.`}>
          <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            Strength (log-odds). Event: {s.note}
          </HandText>
          <SketchBox cx={X0} cy={120} w={560} h={4} r={2} seed={seedOf('mp-axis')} stroke="var(--muted)" />
          <HandText x={X0} y={150} size={TEXT_SIZES.note} color="var(--muted)">0</HandText>
          <SketchBox cx={X0 + s.a * SCALE} cy={95} w={90} h={44} r={8} seed={seedOf('mp-a')} stroke="var(--accent)" fill="var(--accent)" />
          <HandText x={X0 + s.a * SCALE} y={95} size={TEXT_SIZES.label}>{`A ${f(s.a)}`}</HandText>
          <SketchBox cx={X0 + s.b * SCALE} cy={145} w={90} h={44} r={8} seed={seedOf('mp-b')} stroke="var(--warn)" fill="var(--warn)" />
          <HandText x={X0 + s.b * SCALE} y={145} size={TEXT_SIZES.label}>{`B ${f(s.b)}`}</HandText>
          <HandText x={24} y={212} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">
            {`chance A wins next vote: ${pct(s.expect)}`}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

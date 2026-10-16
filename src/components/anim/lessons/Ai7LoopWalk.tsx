import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { turnCost } from './Ai7LoopLogic';

const CALLS = ['q1', 'q2', 'q2', 'q2', 'q2', 'q2', 'q2', 'q2'];
const CUM = CALLS.map((_, i) => CALLS.slice(0, i + 1).reduce((s, __, k) => s + turnCost(k + 1), 0));
const BUDGET = 0.3;

interface Step {
  caption: string;
  turns: number;
  stop?: 'stuck' | 'budget';
  detector: boolean;
}

const steps: Step[] = [
  { caption: 'An agent searches for a refund policy. Limits: budget $0.30, 10 turns, and a stuck detector that fires when the same call (tool and arguments) is made 3 times. Turn 1 calls search(q1). The result is empty. Cost so far: $0.025.', turns: 1, detector: true },
  { caption: 'Turn 2 changes the query: search(q2). Different arguments mean the agent is trying something new. Cost so far: $0.056. Each turn costs more than the last, because the context grows with every tool result.', turns: 2, detector: true },
  { caption: 'Turn 3 repeats search(q2) with the same arguments. The detector counts 2 of 3. The call returned nothing new, yet the agent is asking again.', turns: 3, detector: true },
  { caption: 'Turn 4 repeats search(q2) a third time. The detector fires. The loop stops at $0.136 with the reason "stuck". The harness can summarize what it tried and ask a person.', turns: 4, stop: 'stuck', detector: true },
  { caption: 'Now remove the detector. Turns 5 and 6 repeat the same call. Spend reaches $0.240. Neither cap has fired, because 10 turns and $0.30 are both still ahead.', turns: 6, detector: false },
  { caption: 'Turn 7 pushes spend to $0.301 and the budget cap fires. The response that crosses the cap still completes, so spend passes $0.30 by $0.001. The caps worked, but they cost $0.165 more than the detector (0.301 - 0.136).', turns: 7, stop: 'budget', detector: false },
];

const X0 = 29;
const BW = 74;
const GAP = 10;

export default function Ai7LoopWalk() {
  return (
    <AnimFrame title="A stuck loop: detector first, caps as backstop" steps={steps} interval={5000}>
      {(_, s) => {
        const cum = CUM[s.turns - 1];
        const track = 640;
        const w = Math.max((cum / 0.35) * track, 6);
        const tone = s.stop === 'stuck' ? 'var(--warn)' : s.stop === 'budget' ? 'var(--bad)' : 'var(--accent)';
        return (
          <SketchSvg width={720} height={290} label={`Turn ${s.turns} of the loop. Cost so far ${cum.toFixed(3)} dollars.`}>
            <HandText x={X0} y={22} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
              {s.detector ? 'Caps and a stuck detector' : 'Caps only'}
            </HandText>
            {CALLS.map((c, i) => {
              const on = i < s.turns;
              const last = i === s.turns - 1;
              const cx = X0 + BW / 2 + i * (BW + GAP);
              const stopHere = last && s.stop;
              return (
                <g key={i}>
                  <HandText x={cx} y={58} size={TEXT_SIZES.note} color="var(--muted)">
                    {`turn ${i + 1}`}
                  </HandText>
                  <SketchBox cx={cx} cy={96} w={BW} h={44} r={8} seed={seedOf(`lp${i}`)} stroke={stopHere ? tone : on ? 'var(--accent)' : 'var(--muted)'} fill={stopHere ? tone : on && last ? 'var(--accent)' : undefined} dashed={!on} strokeWidth={last ? 2.2 : 1.4} />
                  <HandText x={cx} y={96} size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'} mono>
                    {c}
                  </HandText>
                </g>
              );
            })}
            <HandText x={X0} y={150} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              search(query): each box is one tool call
            </HandText>
            <HandText x={X0} y={190} anchor="start" size={TEXT_SIZES.label}>
              Spend so far
            </HandText>
            <SketchBox cx={X0 + track / 2} cy={225} w={track} h={30} r={6} seed={seedOf('lptrack')} stroke="var(--muted)" dashed />
            <SketchBox cx={X0 + w / 2} cy={225} w={w} h={30} r={6} seed={seedOf(`lpbar${s.turns}`)} stroke={tone} fill={tone} strokeWidth={2.2} />
            <SketchBox cx={X0 + (BUDGET / 0.35) * track} cy={225} w={2} h={44} r={1} seed={seedOf('lpcap')} stroke="var(--bad)" />
            <HandText x={X0 + (BUDGET / 0.35) * track} y={262} size={TEXT_SIZES.note} color="var(--bad)">
              budget $0.30
            </HandText>
            <HandText x={X0 + 40} y={262} size={TEXT_SIZES.label} anchor="start" color={tone} mono>
              {`$${cum.toFixed(3)}${s.stop === 'stuck' ? '  stopped: stuck' : s.stop === 'budget' ? '  stopped: budget' : ''}`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

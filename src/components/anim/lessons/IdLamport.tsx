import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { lamportReceive, vcCompare, vcReceive } from './idsMath';

/** Three processes with a Lamport counter (L) and a vector clock (V) on every event. Values come from idsMath.ts. */
interface Ev {
  id: string;
  lane: number;
  x: number;
  born: number;
  L: number;
  V: number[];
}

const A1: Ev = { id: 'a1', lane: 0, x: 120, born: 1, L: 1, V: [1, 0, 0] };
const A2: Ev = { id: 'a2', lane: 0, x: 260, born: 2, L: 2, V: [2, 0, 0] };
const B1: Ev = { id: 'b1', lane: 1, x: 190, born: 3, L: 1, V: [0, 1, 0] };
const B2: Ev = { id: 'b2', lane: 1, x: 420, born: 4, L: lamportReceive(B1.L, A2.L), V: vcReceive(B1.V, A2.V, 1) };
const C1: Ev = { id: 'c1', lane: 2, x: 340, born: 5, L: 1, V: [0, 0, 1] };
const EVENTS = [A1, A2, B1, B2, C1];
const LANES = ['A', 'B', 'C'];
const Y = [76, 156, 236];

const vs = (v: number[]) => `[${v.join(',')}]`;
const steps = [
  { caption: 'Three processes A, B, and C, each with its own clock that we do not trust. Each keeps two logical clocks. L is a Lamport counter: one number. V is a vector clock: one number per process, here [A, B, C]. Both start at zero.' },
  { caption: 'A does a local event a1. Rule: add 1 to your own counter. L = 1. In V, A raises its own entry: [1,0,0].' },
  { caption: 'A sends message m to B (event a2). A adds 1 again and attaches its clocks to the message: L = 2, V = [2,0,0].' },
  { caption: 'B, which has not heard from A, does a local event b1: L = 1, V = [0,1,0]. A and B have not talked yet, so nothing links a1 and b1.' },
  { caption: `B receives m (event b2). Lamport rule: max(local, received) + 1 = max(1, 2) + 1 = ${B2.L}. Vector rule: take the larger entry in each slot, [0,1,0] and [2,0,0] give [2,1,0], then add 1 to B's own entry: ${vs(B2.V)}.` },
  { caption: 'C does a local event c1 and never talks to anyone: L = 1, V = [0,0,1].' },
  { caption: `Compare. a1 and b2: V [1,0,0] is at most ${vs(B2.V)} in every slot, so a1 happened before b2. Now c1 and a2: Lamport says 1 < 2, as if c1 came first. But ${vs(C1.V)} and ${vs(A2.V)} are each larger in some slot, so they are concurrent. The vector shows what the single number hides.` },
];

export default function IdLamport() {
  return (
    <AnimFrame title="Lamport and vector clocks on three processes" steps={steps} interval={3400}>
      {(i) => {
        const cmp = vcCompare(C1.V, A2.V);
        return (
          <SketchSvg width={720} height={300} label="Three horizontal time lanes with events, one message from A to B, and each event's Lamport and vector clock values">
            {LANES.map((n, k) => (
              <g key={n}>
                <HandText x={26} y={Y[k]} size={TEXT_SIZES.heading}>
                  {n}
                </HandText>
                <SketchArrow points={[[50, Y[k]], [700, Y[k]]]} stroke="var(--border)" seed={seedOf(`lane${n}`)} />
              </g>
            ))}
            {i >= 2 && (
              <SketchArrow points={[[A2.x + 4, Y[0] + 10], [B2.x - 4, Y[1] - 12]]} stroke={i === 2 ? 'var(--accent)' : 'var(--muted)'} dashed={i !== 2} seed={seedOf('msg')} />
            )}
            {i >= 2 && (
              <HandText x={360} y={110} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">
                message m
              </HandText>
            )}
            {EVENTS.filter((e) => e.born <= i).map((e) => {
              const fresh = e.born === i;
              const flag = i === 6 && (e.id === 'c1' || e.id === 'a2');
              const above = e.lane === 0;
              const y = Y[e.lane];
              return (
                <g key={e.id}>
                  <SketchEllipse
                    cx={e.x}
                    cy={y}
                    w={20}
                    h={20}
                    seed={seedOf(`ev${e.id}`)}
                    stroke={flag ? 'var(--warn)' : fresh ? 'var(--accent)' : 'var(--ok)'}
                    fill={flag ? 'var(--warn)' : fresh ? 'var(--accent)' : 'var(--ok)'}
                    fillStyle="solid"
                  />
                  <HandText x={e.x} y={above ? y - 36 : y + 34} size={TEXT_SIZES.note} mono color={fresh ? 'var(--accent)' : 'var(--fg)'}>
                    {`${e.id}  L=${e.L}`}
                  </HandText>
                  <HandText x={e.x} y={above ? y - 20 : y + 50} size={TEXT_SIZES.note} mono color={fresh ? 'var(--accent)' : 'var(--muted)'}>
                    {`V=${vs(e.V)}`}
                  </HandText>
                </g>
              );
            })}
            {i === 6 && (
              <HandText x={450} y={236} size={TEXT_SIZES.label} anchor="start" color="var(--warn)">
                {`c1 and a2: ${cmp}`}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

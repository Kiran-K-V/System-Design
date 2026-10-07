import AnimFrame from '../AnimFrame';
import { HashRingView, NODE_COLORS, type RingKeyView, type RingPointView } from '../HashRing';
import { RING, ownerOf } from '../ringMath';

const f = (x: number) => Math.round(x * RING);
const pt = (node: string, x: number): RingPointView => ({ node, pos: f(x) });

const COLORS = { A: NODE_COLORS[0], B: NODE_COLORS[1], C: NODE_COLORS[2], D: NODE_COLORS[3] };

const KEY_FRACS = [0.02, 0.15, 0.2, 0.28, 0.4, 0.44, 0.55, 0.62, 0.75, 0.85, 0.92];

const P3 = [pt('A', 0.08), pt('B', 0.33), pt('C', 0.66)];
const P4 = [...P3, pt('D', 0.47)];
const P4_NO_B = P4.filter((p) => p.node !== 'B');
const VN_ALL = [
  pt('A', 0.05), pt('B', 0.12), pt('D', 0.17), pt('C', 0.27), pt('B', 0.38), pt('C', 0.45),
  pt('D', 0.5), pt('A', 0.6), pt('C', 0.7), pt('A', 0.78), pt('D', 0.85), pt('B', 0.93),
];

interface Step {
  caption: string;
  points: RingPointView[];
  keys: boolean;
  /** Owners are compared with this ring to mark moved keys. */
  from?: RingPointView[];
  focus?: number;
  letters: boolean;
}

const steps: Step[] = [
  { caption: 'Picture a circle of positions from 0 to 2³²−1. Going clockwise, the numbers grow. At the top, the last position wraps to 0.', points: [], keys: false, letters: true },
  { caption: 'Hash each server name onto the circle. The hash of "cache-A" gives one position. B and C land elsewhere. Each server now sits at a point.', points: P3, keys: false, letters: true },
  { caption: 'Hash each key onto the same circle. Rule: a key belongs to the first server you meet going clockwise. The colored arc behind each key shows its owner.', points: P3, keys: true, letters: true },
  { caption: 'To find the owner of one key, hash it, then walk clockwise. This key meets C first, so C stores it. The lookup needs only the sorted list of server positions.', points: P3, keys: true, focus: 4, letters: true },
  { caption: 'Add server D between B and C. D takes over the arc from B to D. Only the two keys in that arc move, from C to D. Every other key keeps its owner.', points: P4, from: P3, keys: true, letters: true },
  { caption: 'Server B crashes. Its arc now belongs to the next server clockwise, D. Only B’s three keys move. Keys on A, C, and D do not move.', points: P4_NO_B, from: P4, keys: true, letters: true },
  { caption: 'The problem: three random points make uneven arcs. A owns about 42% of the ring and C owns about 19%. The ideal is 33% each. A is more than twice as loaded as C.', points: P4_NO_B, keys: true, letters: true },
  { caption: 'The fix: give each server many points on the ring. These are virtual nodes. Here each of four servers owns three points. The arcs are short and mixed, so each server gets a fair share.', points: VN_ALL, keys: true, letters: false },
  { caption: 'If one server (D) now crashes, each of its small arcs goes to a different successor. Here D’s two keys land on C and on B. With one point per server, all of D’s keys would fall on one neighbor.', points: VN_ALL.filter((p) => p.node !== 'D'), from: VN_ALL, keys: true, letters: false },
];

export default function RingWalkthrough() {
  return (
    <AnimFrame title="Consistent hashing, one idea per step" steps={steps}>
      {(_, s) => {
        const ring = [...s.points].sort((a, b) => a.pos - b.pos);
        const keys: RingKeyView[] = s.keys
          ? KEY_FRACS.map((x, i) => {
              const pos = f(x);
              const moved = s.from ? ownerOf([...s.from].sort((a, b) => a.pos - b.pos), pos) !== ownerOf(ring, pos) : false;
              return { pos, moved, focus: s.focus === i };
            })
          : [];
        return (
          <div className="mx-auto max-w-[27rem]">
            <HashRingView points={s.points} colors={COLORS} keys={keys} pointLabels={s.letters} label="Hash ring walkthrough" arcs={s.points.length > 0} />
          </div>
        );
      }}
    </AnimFrame>
  );
}

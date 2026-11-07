import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type Vec3 } from '../three/blocks';
import { Dot, Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * A DynamoDB table as a row of partitions. Each partition has a glass lid at its write ceiling of 1,000 units a
 * second. Bars show write load. One hot key overflows one lid while the rest idle; a write-shard suffix spreads it.
 */

const PARTS = 10;
const CEIL = 1000;
const H = 2.4; // bar height of a full ceiling
const px = (i: number) => (i - (PARTS - 1) / 2) * 1.05;
const hOf = (units: number) => (units / CEIL) * H;
const HOT = 6; // the partition that post#17 hashes to
const DEMAND = 4000; // toy demand for one viral post, in write units a second

type Mode = 'empty' | 'even' | 'hot' | 'sharded' | 'read';
/** Background load per partition from ordinary keys, in write units a second. */
const BASE = [220, 310, 180, 260, 240, 300, 200, 280, 230, 190];

interface Step {
  caption: string;
  mode: Mode;
  view: [number, number];
  distance: number;
  focusY: number;
}

const steps: Step[] = [
  {
    caption: 'A table is split into partitions. Each one is designed to deliver at most 1,000 write units and 3,000 read units a second. The glass lid on each partition marks its write ceiling.',
    mode: 'empty',
    view: [0.4, -0.45],
    distance: 15,
    focusY: 1,
  },
  {
    caption: 'With a good partition key, such as a user ID, the hash spreads writes over all partitions. Every bar stays well under its lid. The table can use its full quota.',
    mode: 'even',
    view: [0.35, -0.5],
    distance: 15,
    focusY: 1,
  },
  {
    caption: `Now one post goes viral. Suppose it gets ${DEMAND.toLocaleString('en-US')} writes a second, all with the key post#17. One key hashes to one partition, so all of it lands here. Anything above the lid is throttled: rejected with an error, to retry later. The other partitions sit idle.`,
    mode: 'hot',
    view: [0.25, -0.3],
    distance: 14,
    focusY: 2,
  },
  {
    caption: `The fix for a key that must stay hot: a write-shard suffix. Each write adds a random number from 0 to 9, such as post#17#3. Now ten keys hash to ten partitions, and each gets about ${(DEMAND / PARTS).toLocaleString('en-US')} units. Everything fits under the lids.`,
    mode: 'sharded',
    view: [0.4, -0.55],
    distance: 15,
    focusY: 1,
  },
  {
    caption: 'The price is paid on reads. To read post#17 you must query all ten keys, post#17#0 to post#17#9, and merge the results. Writes got cheap. Reads got ten times the work.',
    mode: 'read',
    view: [0.55, -0.4],
    distance: 15,
    focusY: 2,
  },
];

export default function DdbHotPartition3D() {
  const p = usePalette();
  return (
    <AnimFrame title="A hot partition, then a write-shard suffix" steps={steps} interval={5600}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const m = step.mode;
  const hotLoad = (i: number) => (m === 'hot' && i === HOT ? DEMAND : m === 'sharded' || m === 'read' ? DEMAND / PARTS : 0);
  const base = (i: number) => (m === 'empty' ? 0 : m === 'hot' ? BASE[i] * 0.25 : BASE[i]);
  const merge: Vec3 = [0, H + 2.2, 0];
  const readLinks: [Vec3, Vec3][] = m === 'read' ? Array.from({ length: PARTS }, (_, i) => [[px(i), H + 0.1, 0], merge]) : [];

  const legend = [
    { label: 'Write ceiling (1,000 units a second)' },
    { label: 'Ordinary writes', color: p.muted },
    ...(m === 'hot' || m === 'sharded' || m === 'read' ? [{ label: 'Writes for post#17', color: p.warn }] : []),
    ...(m === 'hot' ? [{ label: 'Throttled', color: p.bad }] : []),
    ...(m === 'read' ? [{ label: 'One read, ten queries', color: p.accent }] : []),
  ];

  return (
    <Stage3D
      label="Ten partitions in a row, each with a glass lid at its write ceiling. Bars show write load. One hot key overflows a single partition; with a suffix, the load spreads over all ten."
      distance={step.distance}
      focus={[0, step.focusY, 0]}
      view={step.view}
      legend={legend}
      angle={[0.4, -0.45]}
      ground={-0.1}
      groundSize={16}
    >
      {Array.from({ length: PARTS }, (_, i) => {
        const b = base(i);
        const hot = hotLoad(i);
        const within = Math.min(hot, CEIL - b);
        const over = Math.max(0, b + hot - CEIL);
        const isHot = m === 'hot' && i === HOT;
        return (
          <group key={i}>
            {/* Partition slab. */}
            <Cube pos={[px(i), 0, 0]} size={[0.9, 0.16, 0.9]} color={isHot ? p.bad : p.fg} face={0.25} edge={0.7} edgeColor={isHot ? p.bad : p.fg} hint={`Partition ${i + 1}. Up to 1,000 write units and 3,000 read units a second.`} />
            {/* Glass lid at the write ceiling. */}
            <Cube pos={[px(i), H + 0.08, 0]} size={[0.86, 0.03, 0.86]} color={p.fg} face={0.08} edge={0.55} edgeColor={p.fg} hint="The write ceiling: 1,000 write units a second." />
            {/* Ordinary writes. */}
            <Cube pos={[px(i), 0.08 + hOf(b) / 2, 0]} size={[0.5, Math.max(hOf(b), 0.001), 0.5]} color={p.muted} face={b ? 0.55 : 0} edge={b ? 0.5 : 0} edgeColor={p.fg} hint={`Ordinary writes: about ${Math.round(b)} units a second.`} />
            {/* Writes for the hot post, up to the lid. */}
            <Cube
              pos={[px(i), 0.08 + hOf(b) + hOf(within) / 2, 0]}
              size={[0.5, Math.max(hOf(within), 0.001), 0.5]}
              color={p.warn}
              face={within ? 0.8 : 0}
              edge={within ? 0.7 : 0}
              edgeColor={p.warn}
              pop={isHot}
              hint={m === 'hot' ? 'post#17: every write for this key lands on this one partition.' : `post#17#${i}: about ${Math.round(hot)} units a second.`}
            />
            {/* Above the lid: throttled. */}
            <Cube
              pos={[px(i), 0.08 + H + 0.14 + (hOf(over) * 0.35) / 2, 0]}
              size={[0.5, Math.max(hOf(over) * 0.35, 0.001), 0.5]}
              color={p.bad}
              face={over ? 0.45 : 0}
              edge={over ? 0.8 : 0}
              edgeColor={p.bad}
              hint={`About ${Math.round(over).toLocaleString('en-US')} units a second above the ceiling: throttled.`}
            />
            <Tag position={[px(i), -0.45, 0.6]} text={`#${i}`} show={m === 'sharded' || m === 'read'} color="var(--warn)" />
          </group>
        );
      })}

      <Links segments={readLinks} color={p.accent} opacity={m === 'read' ? 0.9 : 0} width={1.8} />
      <Dot pos={merge} color={p.accent} r={0.16} opacity={m === 'read' ? 1 : 0} pop={m === 'read'} hint="The app merges ten query results into one answer." />
      <Tag position={[merge[0] + 1.4, merge[1], 0]} text="merge 10 results" color="var(--accent)" show={m === 'read'} />
      <Tag position={[px(HOT) + 1.3, H + 0.7, 0]} text="throttled" color="var(--bad)" show={m === 'hot'} />
      <Tag position={[px(HOT), -0.5, 0.6]} text="post#17" color="var(--warn)" show={m === 'hot'} />
      <Tag position={[px(0) - 1.6, H + 0.1, 0]} text="1,000 units a second" show={m !== 'read'} />
    </Stage3D>
  );
}

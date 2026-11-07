import { useMemo } from 'react';
import AnimFrame from '../AnimFrame';
import Stage3D, { type LegendItem } from '../three/Stage3D';
import { Cube, type CubeTarget, type Vec3 } from '../three/blocks';
import { Arc, Tag, liftArc } from '../three/extras';
import { usePalette } from '../three/theme';

/** Shards (left to right) and regions (front to back). Shard 0 = A to H, 1 = I to P, 2 = Q to Z. Region 0 = US-East, 1 = Europe, 2 = Asia. */
interface Look {
  face: number;
  edge: number;
}

type TagName = 'all' | 'shards' | 'regions' | 'write' | 'read';

interface Step {
  caption: string;
  /** The one block that holds every row. */
  whole: Look;
  /** Look of the server at [shard, region]. */
  server: (shard: number, region: number) => Look;
  /** Which floating labels are on. */
  tags: TagName[];
  /** How far the change arcs have drawn, 0 to 1. */
  arcProgress: number;
  arcOpacity: number;
}

const HIDDEN: Look = { face: 0, edge: 0 };
const lit = (face: number, edge: number): Look => ({ face, edge });

const steps: Step[] = [
  {
    caption: 'One database holds every row, A to Z. It is too big and too busy for one machine.',
    whole: lit(0.5, 0.6),
    server: () => HIDDEN,
    tags: ['all'],
    arcProgress: 0,
    arcOpacity: 1,
  },
  {
    caption: 'Sharding splits the rows. A to H, I to P and Q to Z each live on their own machine. Splitting adds room and speed.',
    whole: HIDDEN,
    server: (_, r) => (r === 0 ? lit(0.6, 0.6) : HIDDEN),
    tags: ['shards'],
    arcProgress: 0,
    arcOpacity: 1,
  },
  {
    caption: 'Replication copies each shard to other regions. Copying adds safety and nearby reads. It does not add room, because every copy holds the same rows.',
    whole: HIDDEN,
    server: (_, r) => lit(r === 0 ? 0.6 : 0.3, 0.5),
    tags: ['shards', 'regions'],
    arcProgress: 0,
    arcOpacity: 1,
  },
  {
    caption: 'A write for key M goes only to the I to P shard, to its leader in US-East. The leader then sends the change to the copies of the same shard in Europe and Asia.',
    whole: HIDDEN,
    server: (s, r) => (s === 1 && r === 0 ? lit(0.95, 1) : lit(0.15, 0.3)),
    tags: ['regions', 'write'],
    arcProgress: 1,
    arcOpacity: 1,
  },
  {
    caption: 'A reader in Europe reads key M from the copy in Europe, which is close by. Right after a write, that copy may be a moment behind. That delay is called replication lag.',
    whole: HIDDEN,
    server: (s, r) => {
      if (s === 1 && r === 1) return lit(0.95, 1);
      if (s === 1 && r === 0) return lit(0.5, 0.5);
      return lit(0.15, 0.3);
    },
    tags: ['regions', 'read'],
    arcProgress: 1,
    arcOpacity: 0.3,
  },
];

const SHARD_X = [-2.4, 0, 2.4];
const SHARD_ROWS = ['rows A to H', 'rows I to P', 'rows Q to Z'];
const REGION_Z = [1.8, 0, -1.8];
const REGION_NAME = ['US-East', 'Europe', 'Asia'];
const SERVER: Vec3 = [1.8, 1.2, 1.2];
const WHOLE: Vec3 = [6.6, 1.2, 1.2];

export default function ShardRegionBlock3D() {
  const p = usePalette();
  return (
    <AnimFrame title="Shards and copies: split across, copy front to back" steps={steps} interval={5000}>
      {(i, s) => <Scene index={i} step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ index, step, p }: { index: number; step: Step; p: ReturnType<typeof usePalette> }) {
  const shardColor = [p.accent, p.ok, p.warn];
  const arcs = useMemo(() => [liftArc([0, 0.6, 1.8], [0, 0.6, 0], 0.8), liftArc([0, 0.6, 1.8], [0, 0.6, -1.8], 1.2)], []);
  const has = (tag: TagName) => step.tags.includes(tag);

  const cubes: { key: string; t: CubeTarget }[] = [
    { key: 'whole', t: { pos: [0, 0, 1.8], size: WHOLE, color: p.muted, ...step.whole, edgeColor: p.fg, hint: 'One database holds every row. It is full, and every write lands here.' } },
  ];
  for (let s = 0; s < 3; s++) {
    for (let r = 0; r < 3; r++) {
      const look = step.server(s, r);
      cubes.push({
        key: `s${s}-${r}`,
        t: { pos: [SHARD_X[s], 0, REGION_Z[r]], size: SERVER, color: shardColor[s], face: look.face, edge: look.edge, edgeColor: p.fg, hint: `Shard ${s + 1} (${SHARD_ROWS[s]}), copy in ${REGION_NAME[r]}.` },
      });
    }
  }

  const legend: LegendItem[] = [];
  if (index === 0) {
    legend.push({ label: 'One big database', color: p.muted });
  } else {
    legend.push({ label: 'Left to right: shards (split the rows)' });
    if (index >= 2) legend.push({ label: 'Front to back: regions (copies of each shard)' });
  }
  if (index >= 3) legend.push({ label: 'Change sent to copies', color: p.ok });

  return (
    <Stage3D label="Nine servers: three shards side by side, each copied into three regions front to back." distance={13} legend={legend} angle={[0.45, -0.5]} view={index === 0 ? [0.3, -0.2] : index === 1 ? [0.35, -0.15] : [0.5, -0.7]} ground={-0.75} groundSize={13}>
      {cubes.map((c) => (
        <Cube key={c.key} {...c.t} />
      ))}
      <Arc key="arc-a" points={arcs[0]} color={p.ok} width={0.03} progress={step.arcProgress} opacity={step.arcOpacity} />
      <Arc key="arc-b" points={arcs[1]} color={p.ok} width={0.03} progress={step.arcProgress} opacity={step.arcOpacity} />
      <Tag key="tag-all" position={[0, 1.0, 1.8]} text="all rows, A to Z" show={has('all')} />
      {SHARD_ROWS.map((text, s) => (
        <Tag key={`tag-shard-${s}`} position={[SHARD_X[s], 1.0, 1.8]} text={text} show={has('shards')} />
      ))}
      {REGION_NAME.map((text, r) => (
        <Tag key={`tag-region-${r}`} position={[-3.9, 0, REGION_Z[r]]} text={text} show={has('regions')} />
      ))}
      <Tag key="tag-write" position={[0, 1.1, 1.8]} text="write: key M" show={has('write')} />
      <Tag key="tag-read" position={[0, 1.1, 0]} text="read: key M (may lag)" show={has('read')} />
    </Stage3D>
  );
}

import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type Vec3 } from '../three/blocks';
import { Dot, Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * A B+tree drawn as floors: one root page, a floor of inner pages, a wide floor of leaf pages, and the table below.
 * Each floor is one page read. The toy shows 5 children per page; the tags give the real count for a fan-out of 500.
 */

const Y = { root: 2.4, inner: 0.8, leaf: -0.9, table: -2.5 };
const INNER = 5;
const PER = 4;
const LEAVES = INNER * PER;
const innerX = (i: number) => (i - (INNER - 1) / 2) * 2.15;
const leafX = (j: number) => (j - (LEAVES - 1) / 2) * 0.54;
const TABLE = 8;
const tableX = (t: number) => (t - (TABLE - 1) / 2) * 1.3;

/** Toy keys: inner page i covers 100*i to 100*i+99; each leaf covers 25 keys. */
const KEY = 142;
const HIT_INNER = Math.floor(KEY / 100);
const HIT_LEAF = Math.floor(KEY / 25);
const HIT_TABLE = 3;
const RANGE = [4, 5, 6, 7]; // leaves for keys 100 to 199

interface Step {
  caption: string;
  inner: boolean;
  leaves: boolean;
  /** How far down the lookup has gone: 0 none, 1 root, 2 inner, 3 leaf, 4 table page. */
  look: number;
  /** Colors the floors by where they live: RAM or SSD. */
  memory: boolean;
  range: boolean;
  focusY: number;
  distance: number;
  view: [number, number];
}

const steps: Step[] = [
  {
    caption: 'The root is one page, 8 KB on disk. It holds sorted keys, and between them pointers to child pages. With small keys one page holds several hundred of them.',
    inner: false,
    leaves: false,
    look: 0,
    memory: false,
    range: false,
    focusY: 1.6,
    distance: 13,
    view: [0.45, -0.5],
  },
  {
    caption: 'Each pointer leads to a child page that covers one range of keys. Five are drawn. A real page has about 500 children, so this floor holds about 500 pages.',
    inner: true,
    leaves: false,
    look: 0,
    memory: false,
    range: false,
    focusY: 1,
    distance: 15,
    view: [0.45, -0.55],
  },
  {
    caption: 'One more floor: the leaves. In a real tree it holds about 500 × 500 = 250,000 pages and reaches over 100 million keys. Look at the shape: the leaves are almost the whole tree. PostgreSQL says over 99% of index pages are leaves.',
    inner: true,
    leaves: true,
    look: 0,
    memory: false,
    range: false,
    focusY: 0,
    distance: 17,
    view: [0.5, -0.65],
  },
  {
    caption: `Find key ${KEY}. Read the root and pick the child for 100 to 199. Read that page and pick the leaf for 125 to 149. Read the leaf, which points at the row's table page. One page read per floor: the tree's height is the cost.`,
    inner: true,
    leaves: true,
    look: 4,
    memory: false,
    range: false,
    focusY: -0.3,
    distance: 15,
    view: [0.35, -0.3],
  },
  {
    caption: 'Now color the floors by where they live. The root and inner floor are small, so every server keeps them in RAM. Only the leaf and the table page come from the SSD: two reads, well under a millisecond.',
    inner: true,
    leaves: true,
    look: 4,
    memory: true,
    range: false,
    focusY: 0,
    distance: 16,
    view: [0.3, -0.85],
  },
  {
    caption: 'A range query, BETWEEN 100 AND 199, finds the first leaf the same way. Then it walks sideways along the chain of leaves, with no trip back up the tree. That chain is what the "+" in B+tree adds.',
    inner: true,
    leaves: true,
    look: 3,
    memory: false,
    range: true,
    focusY: -0.6,
    distance: 13,
    view: [0.75, -0.2],
  },
];

export default function BTreeFloors3D() {
  const p = usePalette();
  return (
    <AnimFrame title="A B+tree as floors: one page read per floor" steps={steps} interval={5200}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const ram = step.memory ? p.ok : null;
  const ssd = step.memory ? p.warn : null;

  const rootPos: Vec3 = [0, Y.root, 0];
  const innerPos = (i: number): Vec3 => [innerX(i), Y.inner, 0];
  const leafPos = (j: number): Vec3 => [leafX(j), Y.leaf, 0];
  const tablePos = (t: number): Vec3 => [tableX(t), Y.table, 0];

  const fan: [Vec3, Vec3][] = Array.from({ length: INNER }, (_, i) => [
    [rootPos[0] + (i - 2) * 0.45, Y.root - 0.16, 0],
    [innerX(i), Y.inner + 0.16, 0],
  ]);
  const fan2: [Vec3, Vec3][] = Array.from({ length: LEAVES }, (_, j) => {
    const i = Math.floor(j / PER);
    return [
      [innerX(i) + ((j % PER) - 1.5) * 0.38, Y.inner - 0.16, 0],
      [leafX(j), Y.leaf + 0.12, 0],
    ];
  });
  const chain: [Vec3, Vec3][] = Array.from({ length: LEAVES - 1 }, (_, j) => [
    [leafX(j) + 0.21, Y.leaf, 0.25],
    [leafX(j + 1) - 0.21, Y.leaf, 0.25],
  ]);
  const rangeChain = chain.filter((_, j) => RANGE.includes(j) && RANGE.includes(j + 1));

  // The lookup path, drawn down to the floor it has reached.
  const stops: Vec3[] = [rootPos, innerPos(HIT_INNER), leafPos(HIT_LEAF), tablePos(HIT_TABLE)];
  const reached = Math.max(0, Math.min(step.look, 4));
  const path: [Vec3, Vec3][] = stops.slice(1, reached).map((s, k) => [stops[k], s]);
  const ball = reached > 0 ? stops[reached - 1] : rootPos;
  const lit = (floor: number) => step.look >= floor + 1;

  const page = (color: string, on: boolean, floorColor: string | null) => ({
    color: floorColor ?? (on ? p.warn : color),
    face: on ? 0.75 : 0.42,
    edge: 0.7,
    edgeColor: on ? p.warn : p.fg,
    pop: on && !step.memory,
  });

  const legend = step.memory
    ? [
        { label: 'In RAM: no disk read', color: p.ok },
        { label: 'Read from SSD', color: p.warn },
        { label: 'On SSD, not read', color: p.muted },
      ]
    : [
        { label: 'Index page', color: p.muted },
        { label: 'Lookup path', color: p.warn },
        ...(step.range ? [{ label: 'Leaf chain walk', color: p.accent }] : []),
        { label: 'Table page', color: p.fg },
      ];

  const hide = { face: 0, edge: 0 };

  return (
    <Stage3D
      label="A B+tree drawn as floors: one root page on top, a row of inner pages, a wide floor of leaf pages, and table pages at the bottom. A lookup drops one floor per page read."
      distance={step.distance}
      focus={[0, step.focusY, 0]}
      view={step.view}
      legend={legend}
      angle={[0.45, -0.5]}
      ground={-3}
      groundSize={18}
    >
      <Cube pos={rootPos} size={[2.4, 0.32, 1.1]} {...page(p.muted, lit(0), ram)} hint="Root page: one 8 KB page. Every lookup reads it, so it is always in RAM." />
      {Array.from({ length: INNER }, (_, i) => (
        <Cube
          key={`i${i}`}
          pos={innerPos(i)}
          size={[1.7, 0.3, 1]}
          {...page(p.muted, lit(1) && i === HIT_INNER, ram)}
          {...(step.inner ? {} : hide)}
          hint={`Inner page for keys ${i * 100} to ${i * 100 + 99}.`}
        />
      ))}
      {Array.from({ length: LEAVES }, (_, j) => {
        const inRange = step.range && RANGE.includes(j);
        const hit = lit(2) && j === HIT_LEAF;
        const base = page(p.muted, hit, hit ? ssd : null);
        return (
          <Cube
            key={`l${j}`}
            pos={leafPos(j)}
            size={[0.42, 0.22, 0.8]}
            {...base}
            color={inRange ? p.accent : base.color}
            edgeColor={inRange ? p.accent : base.edgeColor}
            pop={base.pop || inRange}
            {...(step.leaves ? {} : hide)}
            hint={`Leaf page for keys ${j * 25} to ${j * 25 + 24}. Holds the keys and pointers to table rows.`}
          />
        );
      })}
      {Array.from({ length: TABLE }, (_, t) => {
        const hit = lit(3) && t === HIT_TABLE;
        return (
          <Cube
            key={`t${t}`}
            pos={tablePos(t)}
            size={[1.05, 0.26, 0.9]}
            color={step.memory && hit ? p.warn : hit ? p.warn : p.fg}
            face={step.leaves ? (hit ? 0.7 : 0.16) : 0}
            edge={step.leaves ? 0.55 : 0}
            edgeColor={hit ? p.warn : p.fg}
            pop={hit && !step.memory}
            hint="Table page: holds the full rows. The leaf only points here."
          />
        );
      })}

      <Links segments={fan} color={p.fg} opacity={step.inner ? 0.5 : 0} width={1.2} sketch />
      <Links segments={fan2} color={p.fg} opacity={step.leaves ? 0.3 : 0} width={1} />
      <Links segments={chain} color={p.fg} opacity={step.leaves ? 0.35 : 0} width={1.2} />
      <Links segments={rangeChain} color={p.accent} opacity={step.range ? 1 : 0} width={3.2} />
      <Links segments={path} color={p.warn} opacity={path.length ? 1 : 0} width={3.2} />
      <Dot pos={[ball[0], ball[1] + 0.32, ball[2]]} color={p.warn} r={0.13} opacity={step.look > 0 ? 1 : 0} pop={step.look > 0} hint={`Looking for key ${KEY}.`} />

      <Tag position={[-3.6, Y.root, 0]} text="root · 1 page" color={step.memory ? 'var(--ok)' : undefined} />
      <Tag position={[-6.9, Y.inner, 0]} text="inner · ~500 pages" color={step.memory ? 'var(--ok)' : undefined} show={step.inner} />
      <Tag position={[-6.9, Y.leaf, 0]} text={step.memory ? 'leaves · on SSD' : 'leaves · ~250,000 pages'} show={step.leaves} />
      <Tag position={[-6.9, Y.table, 0]} text="table pages" show={step.leaves} />
      <Tag position={[ball[0] + 0.9, ball[1] + 0.6, 0]} text={`key ${KEY}`} color="var(--warn)" show={step.look > 0 && !step.range} />
      <Tag position={[leafX(5.5), Y.leaf + 0.75, 0.3]} text="100 … 199" color="var(--accent)" show={step.range} />
    </Stage3D>
  );
}

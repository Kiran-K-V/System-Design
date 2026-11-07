import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { CellField, Cube, type GridCell, type Vec3 } from '../three/blocks';
import { Dot, Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';

/**
 * A quadtree drawn as floors, one per depth. The root square is on top. Each floor below shows the cells at that
 * depth. A dense cluster keeps splitting; sparse corners stop early. A radius search then descends only into cells
 * that touch the circle. The tree is built for real from the points below, with a capacity of 4.
 */

type P2 = [number, number];
const CAP = 4;
const MAX_DEPTH = 4;
const HALF = 3; // the root square spans -3 to 3

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const POINTS: P2[] = (() => {
  const r = rng(42);
  const out: P2[] = [];
  // A dense downtown cluster.
  for (let i = 0; i < 20; i++) out.push([1.1 + (r() - 0.5) * 1.5 * (0.4 + r()), -0.9 + (r() - 0.5) * 1.5 * (0.4 + r())]);
  // A thin spread elsewhere.
  for (let i = 0; i < 9; i++) out.push([(r() - 0.5) * 5.6, (r() - 0.5) * 5.6]);
  return out;
})();

interface Cell {
  x: number;
  y: number;
  size: number;
  depth: number;
  pts: number[];
  leaf: boolean;
  path: string;
}
const CELLS: Cell[] = [];
function build(x: number, y: number, size: number, depth: number, pts: number[], path: string) {
  const leaf = pts.length <= CAP || depth === MAX_DEPTH;
  CELLS.push({ x, y, size, depth, pts, leaf, path });
  if (leaf) return;
  const h = size / 2;
  const quads: [number, number][] = [
    [x - h / 2, y + h / 2],
    [x + h / 2, y + h / 2],
    [x - h / 2, y - h / 2],
    [x + h / 2, y - h / 2],
  ];
  quads.forEach(([qx, qy], i) => {
    const inside = pts.filter((k) => Math.abs(POINTS[k][0] - qx) <= h / 2 && Math.abs(POINTS[k][1] - qy) <= h / 2);
    // A point on a shared border goes to the first quadrant that claims it.
    const claimed = new Set(CELLS.filter((c) => c.depth === depth + 1 && c.path.startsWith(path)).flatMap((c) => c.pts));
    build(qx, qy, h, depth + 1, inside.filter((k) => !claimed.has(k)), path + i);
  });
}
build(0, 0, HALF * 2, 0, POINTS.map((_, i) => i), 'r');
const DEPTH = Math.max(...CELLS.map((c) => c.depth));

const Q: P2 = [1.5, -0.3];
const RADIUS = 0.5;
const touches = (c: Cell) => {
  const dx = Math.max(Math.abs(Q[0] - c.x) - c.size / 2, 0);
  const dy = Math.max(Math.abs(Q[1] - c.y) - c.size / 2, 0);
  return dx * dx + dy * dy <= RADIUS * RADIUS;
};
/** Cells the search opens: a cell is opened only if its parent was opened and it touches the circle. */
const OPENED = new Set(CELLS.filter((c) => touches(c) && CELLS.filter((a) => c.path.startsWith(a.path)).every(touches)).map((c) => c.path));
const CANDIDATES = new Set(CELLS.filter((c) => c.leaf && OPENED.has(c.path)).flatMap((c) => c.pts));
const near = (k: number) => Math.hypot(POINTS[k][0] - Q[0], POINTS[k][1] - Q[1]) <= RADIUS;
const HITS = [...CANDIDATES].filter(near);
/** Depth of the leaf cell that holds each place. */
const LEAF_DEPTH = POINTS.map((_, k) => CELLS.find((c) => c.leaf && c.pts.includes(k))!.depth);
/** Floors that hold at least one leaf the search reached. The circle is drawn on each. */
const SEARCH_FLOORS = [...new Set(CELLS.filter((c) => c.leaf && OPENED.has(c.path)).map((c) => c.depth))];

const FLOOR_GAP = 1.15;
const fy = (depth: number) => 2.2 - depth * FLOOR_GAP;
const at = (p: P2, depth: number, lift = 0.05): Vec3 => [p[0], fy(depth) + lift, -p[1]];

interface Step {
  caption: string;
  /** Deepest floor shown. */
  shown: number;
  search: boolean;
  filter: boolean;
  focusY: number;
  distance: number;
  view: [number, number];
}

const steps: Step[] = [
  {
    caption: `A quadtree starts as one cell. This one holds all ${POINTS.length} places. The capacity is ${CAP}, so it must split. Most places sit in one dense downtown, and a few are spread out.`,
    shown: 0,
    search: false,
    filter: false,
    focusY: fy(0),
    distance: 12,
    view: [0.75, -0.45],
  },
  {
    caption: `It splits into four equal quadrants, one floor down. A quadrant with ${CAP} places or fewer is done: it turns green and stops. The quadrant with the downtown is still too full.`,
    shown: 1,
    search: false,
    filter: false,
    focusY: fy(0.5),
    distance: 13,
    view: [0.6, -0.5],
  },
  {
    caption: `Only full cells keep splitting. The downtown goes ${DEPTH} floors deep. The empty corners stay as big cells. The cells follow the data, which a fixed geohash grid cannot do.`,
    shown: DEPTH,
    search: false,
    filter: false,
    focusY: fy(DEPTH / 2),
    distance: 15,
    view: [0.35, -0.65],
  },
  {
    caption: `A search for places within the circle. Start at the root and open only the cells that touch the circle. Every other branch is skipped, with its places never read. ${OPENED.size} of ${CELLS.length} cells are opened.`,
    shown: DEPTH,
    search: true,
    filter: false,
    focusY: fy(DEPTH / 2),
    distance: 14,
    view: [0.45, -0.3],
  },
  {
    caption: `The leaf cells reached hold ${CANDIDATES.size} candidate places. The cells are squares and the search is a circle, so check the true distance of each. ${HITS.length} are inside. The rest are dropped.`,
    shown: DEPTH,
    search: true,
    filter: true,
    focusY: fy(DEPTH * 0.6),
    distance: 15,
    view: [0.7, -0.4],
  },
];

export default function ProxQuadFloors3D() {
  const p = usePalette();
  return (
    <AnimFrame title="A quadtree as floors: split where it is crowded" steps={steps} interval={5400}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function ring(depth: number): [Vec3, Vec3][] {
  const n = 48;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const b = ((i + 1) / n) * Math.PI * 2;
    return [at([Q[0] + Math.cos(a) * RADIUS, Q[1] + Math.sin(a) * RADIUS], depth, 0.07), at([Q[0] + Math.cos(b) * RADIUS, Q[1] + Math.sin(b) * RADIUS], depth, 0.07)];
  });
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const bottom = step.shown;
  // Each place sits on the floor of its own leaf cell, or on the deepest floor shown so far.
  const pts: GridCell[] = POINTS.map((pt, k) => {
    const [x, y, z] = at(pt, Math.min(LEAF_DEPTH[k], bottom), 0.02);
    const color = step.filter ? (CANDIDATES.has(k) ? (near(k) ? p.ok : p.bad) : p.muted) : step.search && CANDIDATES.has(k) ? p.accent : p.fg;
    return { x, y, z, color, h: 1 };
  });
  // Each cell drops a faint line to its children, so the tree reads as one structure.
  const parentLinks: [Vec3, Vec3][] = CELLS.filter((c) => c.depth > 0 && c.depth <= step.shown).map((c) => {
    const parent = CELLS.find((a) => a.path === c.path.slice(0, -1))!;
    return [at([parent.x, parent.y], parent.depth, -0.02), at([c.x, c.y], c.depth, 0.04)];
  });

  const legend = [
    { label: 'Cell still splitting', color: p.muted },
    { label: `Leaf cell (≤ ${CAP} places)`, color: p.ok },
    ...(step.search ? [{ label: 'Opened by the search', color: p.accent }] : []),
    ...(step.filter ? [{ label: 'Outside the circle', color: p.bad }] : []),
  ];

  return (
    <Stage3D
      label="Stacked floors, one per quadtree depth. The top floor is one square; lower floors show smaller squares where places are crowded. A circle marks a radius search."
      distance={step.distance}
      focus={[0.4, step.focusY, 0.4]}
      view={step.view}
      legend={legend}
      angle={[0.75, -0.45]}
      ground={fy(DEPTH) - 0.6}
      groundSize={14}
    >
      {CELLS.map((c) => {
        const on = c.depth <= step.shown;
        const opened = step.search && OPENED.has(c.path);
        const color = opened ? p.accent : c.leaf ? p.ok : p.muted;
        return (
          <Cube
            key={c.path}
            pos={[c.x, fy(c.depth), -c.y]}
            size={[c.size * 0.97, 0.04, c.size * 0.97]}
            color={color}
            face={on ? (opened ? 0.3 : c.leaf ? 0.18 : 0.06) : 0}
            edge={on ? (step.search && !opened ? 0.25 : 0.7) : 0}
            edgeColor={opened ? p.accent : c.leaf ? p.ok : p.fg}
            hint={`Depth ${c.depth}: ${c.pts.length} place${c.pts.length === 1 ? '' : 's'}${c.leaf ? '. Leaf: no split needed.' : `, over capacity ${CAP}, so it split.`}`}
          />
        );
      })}
      <Links segments={parentLinks} color={p.fg} opacity={0.18} width={1} />
      <CellField key={`pts-${bottom}`} cells={pts} size={[0.09, 0.09, 0.09]} opacity={0.95} />

      {step.search && (
        <>
          {SEARCH_FLOORS.map((d) => (
            <Links key={d} segments={ring(d)} color={p.accent} opacity={1} width={2.4} />
          ))}
          <Links segments={ring(0)} color={p.accent} opacity={0.5} width={1.4} />
          <Links segments={[[at(Q, 0, 0.6), at(Q, DEPTH, 0)]]} color={p.accent} opacity={0.5} width={1.2} />
        </>
      )}
      <Dot pos={at(Q, DEPTH, 0.12)} color={p.accent} r={0.1} opacity={step.search ? 1 : 0} pop={step.filter} hint="The query point. Find places inside the circle." />
      {HITS.map((k) => (
        <Dot key={k} pos={at(POINTS[k], LEAF_DEPTH[k], 0.1)} color={p.ok} r={0.07} opacity={step.filter ? 1 : 0} pop={step.filter} hint="Inside the circle: a result." />
      ))}

      {Array.from({ length: DEPTH + 1 }, (_, d) => (
        <Tag key={d} position={[-3.9, fy(d), 2.9]} text={d === 0 ? 'depth 0 · one cell' : `depth ${d}`} show={d <= step.shown} />
      ))}
      <Tag position={[1.1, fy(0) + 0.4, 0.9]} text="downtown" show={step.shown === 0} />
    </Stage3D>
  );
}

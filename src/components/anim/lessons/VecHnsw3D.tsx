import { useMemo } from 'react';
import AnimFrame from '../AnimFrame';
import Stage3D from '../three/Stage3D';
import { Cube, type Vec3 } from '../three/blocks';
import { Dot, Links, Tag } from '../three/extras';
import { usePalette, type Palette } from '../three/theme';
import { TOY_ENTRY, TOY_LEVELS, TOY_POINTS, TOY_Q, buildLayers, exactKnn, l2 } from './vecMath';

/**
 * The HNSW toy from VecHnsw, drawn as three glass floors stacked in space. A node that lives on an upper floor
 * has a pillar down to its copy on every floor below. The search walks on a floor, then rides a pillar down.
 * All paths are computed from vecMath.ts, so they match the 2D walk-through.
 */

const LAYERS = buildLayers(TOY_POINTS, TOY_LEVELS, 2, 3);
const TRUE_NN = exactKnn(TOY_POINTS, TOY_Q, 1)[0];
const d = (i: number) => l2(TOY_POINTS[i], TOY_Q);

/** Plain greedy walk on one layer: hop to the closest neighbor while it is closer than where you stand. */
function greedy(layer: number, start: number): number[] {
  const path = [start];
  for (;;) {
    const here = path[path.length - 1];
    const next = LAYERS[layer][here].reduce((b, n) => (d(n) < d(b) ? n : b), here);
    if (next === here) return path;
    path.push(next);
  }
}
const P2 = greedy(2, TOY_ENTRY);
const P1 = greedy(1, P2[P2.length - 1]);
const P0 = greedy(0, P1[P1.length - 1]);
const STUCK = P0[P0.length - 1];
/** The second-best candidate on layer 0 whose neighbor is the true nearest. The efSearch = 3 list keeps it. */
const RESCUE = LAYERS[0][STUCK].filter((n) => LAYERS[0][n].includes(TRUE_NN)).sort((a, b) => d(a) - d(b))[0] ?? STUCK;
const onLayer = (l: number) => TOY_POINTS.map((_, i) => i).filter((i) => TOY_LEVELS[i] >= l);

const FLOOR_Y = [-1.7, 0, 1.7];
const at = (i: number | number[], layer: number): Vec3 => {
  const [x, y] = Array.isArray(i) ? i : TOY_POINTS[i];
  return [((x - 50) / 100) * 6.4, FLOOR_Y[layer] + 0.02, ((50 - y) / 100) * 4.6];
};
const hops = (path: number[], layer: number): [Vec3, Vec3][] => path.slice(1).map((n, k) => [at(path[k], layer), at(n, layer)]);

interface Step {
  caption: string;
  /** Layer the search is on; -1 before it starts, 3 when the whole path is shown at the end. */
  on: number;
  /** True once the efSearch = 3 candidate list has found the true nearest. */
  rescued: boolean;
  focusY: number;
  distance: number;
  view: [number, number];
}

const steps: Step[] = [
  {
    caption: `Each floor is one layer of the same graph. The bottom floor holds all ${onLayer(0).length} points. Floor 1 holds ${onLayer(1).length}, and the top floor holds ${onLayer(2).length}. A point that was promoted to an upper floor has a pillar down to its copies below. The pink beam is the query, at the same spot on every floor.`,
    on: -1,
    rescued: false,
    focusY: 0,
    distance: 15,
    view: [0.5, -0.6],
  },
  {
    caption: `The search starts on the top floor at the entry point ${TOY_ENTRY}. Its linked neighbor ${P2[P2.length - 1]} is closer to the query, so it hops there. Few points means long jumps: one hop crosses most of the map.`,
    on: 2,
    rescued: false,
    focusY: 1.7,
    distance: 11,
    view: [0.62, -0.45],
  },
  {
    caption: `No neighbor up there is closer, so the search rides the pillar of point ${P1[0]} down to floor 1. It walks again: ${P1.join(' → ')}. The hops are shorter now, because this floor has more points.`,
    on: 1,
    rescued: false,
    focusY: 0,
    distance: 11,
    view: [0.62, -0.75],
  },
  {
    caption: `Down the pillar of point ${P0[0]} to the bottom floor, where every point lives. A plain greedy walk goes ${P0.join(' → ')} and stops at ${STUCK}: no linked neighbor is closer. But ${STUCK} is not the nearest point. The walk is stuck in a dead end.`,
    on: 0,
    rescued: false,
    focusY: -1.7,
    distance: 11,
    view: [0.7, -0.5],
  },
  {
    caption: `With efSearch = 3 the search keeps 3 candidates, not 1. Point ${RESCUE} stays on the list though it is not the best, and its neighbor ${TRUE_NN} is the true nearest. That is the recall knob of the next animation.`,
    on: 0,
    rescued: true,
    focusY: -1.7,
    distance: 10,
    view: [0.8, -0.35],
  },
  {
    caption: `The whole route: long jumps on the sparse top, short steps at the bottom. With M = 16 each floor holds about one sixteenth of the floor below, so a million points need only about five floors. Each floor adds only a few hops, which is why search cost grows so slowly as the data grows.`,
    on: 3,
    rescued: true,
    focusY: 0,
    distance: 15,
    view: [0.38, -0.95],
  },
];

export default function VecHnsw3D() {
  const p = usePalette();
  return (
    <AnimFrame title="HNSW as floors: walk, drop, walk again" steps={steps} interval={5200}>
      {(_, s) => <Scene step={s} p={p} />}
    </AnimFrame>
  );
}

function Scene({ step, p }: { step: Step; p: Palette }) {
  const geo = useMemo(() => {
    const edges = [0, 1, 2].map((l) => onLayer(l).flatMap((a) => LAYERS[l][a].filter((b) => b > a).map((b) => [at(a, l), at(b, l)] as [Vec3, Vec3])));
    const pillars = onLayer(1).map((i) => [at(i, TOY_LEVELS[i]), at(i, 0)] as [Vec3, Vec3]);
    const beamTop = at(TOY_Q, 2);
    const beamBottom = at(TOY_Q, 0);
    const beam: [Vec3, Vec3][] = [[[beamBottom[0], beamBottom[1] - 0.4, beamBottom[2]], [beamTop[0], beamTop[1] + 0.6, beamTop[2]]]];
    return { edges, pillars, beam };
  }, []);

  // Which parts of the route are drawn at this step.
  const seen = (layer: number) => step.on === 3 || (step.on >= 0 && step.on <= layer);
  const route: [Vec3, Vec3][] = [
    ...(seen(2) ? hops(P2, 2) : []),
    ...(seen(1) ? [[at(P1[0], 2), at(P1[0], 1)] as [Vec3, Vec3], ...hops(P1, 1)] : []),
    ...(seen(0) ? [[at(P0[0], 1), at(P0[0], 0)] as [Vec3, Vec3], ...hops(P0, 0)] : []),
  ];
  const rescue: [Vec3, Vec3][] = step.rescued ? [[at(STUCK, 0), at(RESCUE, 0)], [at(RESCUE, 0), at(TRUE_NN, 0)]] : [];
  const onRoute = new Set<string>();
  if (seen(2)) P2.forEach((n) => onRoute.add(`${n}@2`));
  if (seen(1)) P1.forEach((n) => onRoute.add(`${n}@1`));
  if (seen(0)) P0.forEach((n) => onRoute.add(`${n}@0`));

  // The node the search stands on right now: it gets a halo.
  const here = step.on === 2 ? `${P2[P2.length - 1]}@2` : step.on === 1 ? `${P1[P1.length - 1]}@1` : step.on === 0 && !step.rescued ? `${STUCK}@0` : step.rescued ? `${TRUE_NN}@0` : '';

  const legend = [
    { label: 'Point', color: p.muted },
    { label: 'Query', color: p.accent },
    { label: 'Search route', color: p.warn },
    ...(step.rescued ? [{ label: 'True nearest', color: p.ok }] : []),
  ];

  return (
    <Stage3D
      label="Three stacked floors, one per HNSW layer. Pillars join copies of a point. A highlighted route walks the top floor, drops, and walks the floors below toward a query."
      distance={step.distance}
      focus={[0, step.focusY, 0]}
      view={step.view}
      legend={legend}
      angle={[0.5, -0.6]}
      ground={-2.3}
      groundSize={14}
    >
      {[0, 1, 2].map((l) => {
        const active = step.on === l;
        return (
          <group key={l}>
            <Cube
              pos={[0, FLOOR_Y[l] - 0.03, 0]}
              size={[7.2, 0.04, 5.4]}
              color={active ? p.accent : p.fg}
              face={active ? 0.1 : 0.05}
              edge={active ? 0.7 : 0.3}
              edgeColor={active ? p.accent : p.fg}
              hint={`Layer ${l}: ${onLayer(l).length} points, each linked to its ${l === 0 ? 3 : 2} nearest neighbors on this floor.`}
            />
            <Links segments={geo.edges[l]} color={p.fg} opacity={step.on === -1 || active || step.on === 3 ? 0.45 : 0.18} width={1.1} />
            <Tag position={[-4.3, FLOOR_Y[l] + 0.05, 2.7]} text={`layer ${l} · ${onLayer(l).length} pts`} color={active ? 'var(--accent)' : undefined} />
          </group>
        );
      })}

      <Links segments={geo.pillars} color={p.fg} opacity={0.22} width={1} sketch />
      <Links segments={geo.beam} color={p.accent} opacity={0.55} width={1.4} />
      <Links segments={route} color={p.warn} opacity={route.length ? 1 : 0} width={3.2} />
      <Links segments={rescue} color={p.ok} opacity={rescue.length ? 1 : 0} width={3.2} />

      {[0, 1, 2].flatMap((l) =>
        onLayer(l).map((i) => {
          const key = `${i}@${l}`;
          const nearest = l === 0 && i === TRUE_NN && step.rescued;
          const color = nearest ? p.ok : onRoute.has(key) ? p.warn : p.muted;
          return (
            <Dot
              key={key}
              pos={at(i, l)}
              color={color}
              r={l === 0 ? 0.09 : 0.11}
              pop={here === key}
              hint={`Point ${i}, distance ${d(i).toFixed(1)} from the query.${TOY_LEVELS[i] > 0 ? ` Lives on layers 0 to ${TOY_LEVELS[i]}.` : ''}`}
            />
          );
        }),
      )}
      {[0, 1, 2].map((l) => (
        <Dot key={`q${l}`} pos={at(TOY_Q, l)} color={p.accent} r={0.1} opacity={step.on === -1 || step.on === l || step.on === 3 ? 1 : 0.35} hint="The query point." />
      ))}
      <Tag position={at(TOY_ENTRY, 2).map((v, k) => (k === 1 ? v + 0.45 : v)) as Vec3} text="entry" show={step.on === 2 || step.on === -1} />
      <Tag position={at(TRUE_NN, 0).map((v, k) => (k === 1 ? v + 0.45 : v)) as Vec3} text={`nearest: ${TRUE_NN}`} color="var(--ok)" show={step.rescued} />
    </Stage3D>
  );
}

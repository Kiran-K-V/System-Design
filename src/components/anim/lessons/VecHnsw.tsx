import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TOY_ENTRY, TOY_LEVELS, TOY_POINTS, TOY_Q, buildLayers, exactKnn, hnswSearch, l2 } from './vecMath';

/** Nearest-neighbor search through three HNSW layers on 18 points. All paths come from vecMath.ts. */
const LAYERS = buildLayers(TOY_POINTS, TOY_LEVELS, 2, 3);
const T1 = hnswSearch(TOY_POINTS, LAYERS, TOY_ENTRY, TOY_Q, 1, 1);
const T3 = hnswSearch(TOY_POINTS, LAYERS, TOY_ENTRY, TOY_Q, 1, 3);
const TRUE_NN = exactKnn(TOY_POINTS, TOY_Q, 1)[0];
const dist = (i: number) => l2(TOY_POINTS[i], TOY_Q).toFixed(1);

const steps = [
  { caption: `18 points, three layers. Layer 0 holds all 18. Layer 1 holds 6 of them, chosen at random. Layer 2 holds 2. In each layer a point links to its nearest neighbors (2 in the upper layers, 3 in layer 0 in this toy). The dot with no links is the query. Which stored point is nearest to it?`, layer: -1, ef: 1 },
  { caption: `Layer 2. Start at the entry point ${TOY_ENTRY}, ${dist(TOY_ENTRY)} away from the query. Its only neighbor, ${T1.layers[0].best[0]}, is closer (${dist(T1.layers[0].best[0])}). Hop there. It has no closer neighbor, so go down. Two distances computed.`, layer: 2, ef: 1 },
  { caption: `Layer 1. Start at ${T1.layers[0].best[0]}. Its neighbors are 9, 6, and 15. Point ${T1.layers[1].best[0]} is the closest (${dist(T1.layers[1].best[0])}). Hop. Nothing closer next to it, so go down. Four distances computed on this layer. The long jumps are done on the sparse layers.`, layer: 1, ef: 1 },
  { caption: `Layer 0 with efSearch = 1, a plain greedy walk. It starts at ${T1.layers[1].best[0]}, moves to its closest neighbors, and stops at ${T1.layers[2].best[0]} (${dist(T1.layers[2].best[0])}) because no neighbor of ${T1.layers[2].best[0]} is closer. But the true nearest is point ${TRUE_NN} (${dist(TRUE_NN)}). The walk is stuck in a dead end: every linked neighbor looks worse, though a better point exists further away. This is an approximate answer. ${T1.layers[2].visited.length} distances here.`, layer: 0, ef: 1 },
  { caption: `Same layer with efSearch = 3. The search keeps 3 candidates, not 1. Point 14 (${dist(14)}) is not the best, but it stays in the list, and the search expands it. Its neighbor ${TRUE_NN} is the true nearest (${dist(TRUE_NN)}). A larger efSearch costs more distances (${T3.layers[2].visited.length} here) and raises recall.`, layer: 0, ef: 3 },
  { caption: `Total for efSearch = 3: ${T3.distanceCalls} distance computations. An exact scan needs 18, so with 18 points we save nothing. The saving appears at scale. With M = 16 each layer holds one sixteenth of the layer below, and the walk per layer is short. The cost grows slowly with N, where an exact scan grows in step with it.`, layer: 0, ef: 3, done: true },
];

const PW = 200;
const PX = [20, 260, 500];
const PY = 56;
const sx = (p: number, x: number) => PX[p] + (x / 100) * PW;
const sy = (y: number) => PY + ((100 - y) / 100) * PW;
const PANELS = [2, 1, 0];

export default function VecHnsw() {
  return (
    <AnimFrame title="Searching an HNSW graph, layer by layer" steps={steps} interval={3600}>
      {(_, s) => {
        return (
          <SketchSvg width={720} height={324} label="Three panels, one per HNSW layer, with the points visited by the search">
            {PANELS.map((layer, p) => {
              const adj = LAYERS[layer];
              const nodes = TOY_POINTS.map((_, n) => n).filter((n) => TOY_LEVELS[n] >= layer);
              const run = s.ef === 3 && layer === 0 ? T3 : T1;
              const trace = s.layer < 0 ? null : layer === s.layer ? run.layers[2 - layer] : layer > s.layer ? T1.layers[2 - layer] : null;
              const visited = new Set(trace ? trace.visited : []);
              const best = new Set(trace ? trace.best : []);
              return (
                <g key={layer}>
                  <HandText x={PX[p] + PW / 2} y={24} size={TEXT_SIZES.heading}>
                    {`Layer ${layer}: ${nodes.length} points`}
                  </HandText>
                  <SketchBox cx={PX[p] + PW / 2} cy={PY + PW / 2} w={PW + 16} h={PW + 16} r={8} seed={seedOf(`panel${layer}`)} stroke="var(--border)" fill="var(--surface)" fillStyle="solid" dashed={s.layer !== layer} />
                  {nodes.flatMap((a) =>
                    adj[a]
                      .filter((b) => b > a)
                      .map((b) => (
                        <SketchArrow key={`${a}-${b}`} points={[[sx(p, TOY_POINTS[a][0]), sy(TOY_POINTS[a][1])], [sx(p, TOY_POINTS[b][0]), sy(TOY_POINTS[b][1])]]} head="none" stroke="var(--muted)" seed={seedOf(`e${layer}${a}${b}`)} />
                      )),
                  )}
                  {nodes.map((n) => {
                    const isBest = best.has(n);
                    const isVisited = visited.has(n);
                    return (
                      <g key={n}>
                        <SketchEllipse
                          cx={sx(p, TOY_POINTS[n][0])}
                          cy={sy(TOY_POINTS[n][1])}
                          w={layer === 0 ? 11 : 14}
                          h={layer === 0 ? 11 : 14}
                          seed={seedOf(`n${layer}${n}`)}
                          stroke={isBest ? 'var(--ok)' : isVisited ? 'var(--accent)' : 'var(--fg)'}
                          fill={isBest ? 'var(--ok)' : isVisited ? 'var(--accent)' : 'var(--bg)'}
                          fillStyle="solid"
                        />
                        {(isBest || (layer === 0 && n === TRUE_NN && s.layer === 0)) && (
                          <HandText x={sx(p, TOY_POINTS[n][0]) + 12} y={sy(TOY_POINTS[n][1]) - 11} size={TEXT_SIZES.note} anchor="start" color={n === TRUE_NN ? 'var(--ok)' : 'var(--fg)'} halo>
                            {String(n)}
                          </HandText>
                        )}
                      </g>
                    );
                  })}
                  <SketchEllipse cx={sx(p, TOY_Q[0])} cy={sy(TOY_Q[1])} w={16} h={16} seed={seedOf(`q${layer}`)} stroke="var(--bad)" fill="var(--bad)" fillStyle="solid" />
                </g>
              );
            })}
            <HandText x={130} y={284} size={TEXT_SIZES.note} color="var(--bad)">
              query
            </HandText>
            <HandText x={360} y={284} size={TEXT_SIZES.note} color="var(--accent)">
              compared with the query
            </HandText>
            <HandText x={590} y={284} size={TEXT_SIZES.note} color="var(--ok)">
              best so far
            </HandText>
            <HandText x={360} y={308} size={TEXT_SIZES.label} color="var(--muted)">
              {s.layer === 0 && s.ef === 1 ? `efSearch 1 returns ${T1.result[0]}. True nearest: ${TRUE_NN}.` : s.layer === 0 ? `efSearch 3 returns ${T3.result[0]}, the true nearest.` : s.layer > 0 ? 'The result of this layer is the start of the next.' : 'Three layers, one search.'}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

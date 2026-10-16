import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { DEG, POINTS, QUERY, descend, edges, inLayer, trueNearest } from './Ai5AnnGraph';

const walks = descend(0);
const total = walks.reduce((a, w) => a + w.checked, 0);
const found = walks[2].path[walks[2].path.length - 1];
const truth = trueNearest();

interface S {
  caption: string;
  layer: number;
  /** Number of hops of that layer's path already drawn (0 = only the start). */
  hops: number;
}

const steps: S[] = [
  { layer: 2, hops: 0, caption: `Top layer (layer 2). Only ${inLayer(2).length} of the 16 toy points live here, with long links. The search always enters at point ${walks[0].path[0]}. The orange cross is the query.` },
  { layer: 2, hops: walks[0].path.length - 1, caption: `Greedy hop: look at the neighbors of the current point, move to the one closest to the query. Here it moves to point ${walks[0].path[walks[0].path.length - 1]}. No neighbor is closer, so this layer is done after ${walks[0].checked} distance checks.` },
  { layer: 1, hops: 0, caption: `Drop to layer 1 and start from the same point. This layer has ${inLayer(1).length} points and shorter links, so the walk can refine the position.` },
  { layer: 1, hops: walks[1].path.length - 1, caption: `One more hop to point ${walks[1].path[walks[1].path.length - 1]}. Again no neighbor is closer. ${walks[1].checked} points seen on this layer.` },
  { layer: 0, hops: 0, caption: `Layer 0 holds every point. The search starts from point ${walks[2].path[0]} and checks its neighbors. The real index keeps a list of efSearch candidates here, not just the single best one.` },
  { layer: 0, hops: walks[2].path.length - 1, caption: `Result: point ${found}${found === truth ? ', which is also the true nearest point' : ` (the true nearest is point ${truth})`}. The walk saw ${total} distinct points, counting each layer. In 16 points that is not a big saving. The saving shows at millions of points, where each layer is a small fraction of the one below. Toy data, illustrative.` },
];

export default function Ai5AnnHops() {
  return (
    <AnimFrame title="HNSW greedy search across layers (toy graph)" steps={steps} interval={6500}>
      {(_, s) => {
        const es = edges(s.layer, DEG[s.layer]);
        const w = walks.find((x) => x.layer === s.layer)!;
        const path = w.path.slice(0, s.hops + 1);
        const cur = path[path.length - 1];
        const nodes = inLayer(s.layer);
        return (
          <SketchSvg width={720} height={320} label={`HNSW layer ${s.layer} with the greedy path`}>
            <HandText x={24} y={22} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">{`Layer ${s.layer}: ${nodes.length} points`}</HandText>
            {es.map(([a, b]) => (
              <SketchArrow key={`${s.layer}-${a}-${b}`} points={[[POINTS[a].x, POINTS[a].y + 20], [POINTS[b].x, POINTS[b].y + 20]]} head="none" seed={seedOf(`e${s.layer}-${a}-${b}`)} stroke="var(--muted)" />
            ))}
            {path.slice(1).map((id, i) => (
              <SketchArrow key={`p${s.layer}-${i}`} points={[[POINTS[path[i]].x, POINTS[path[i]].y + 20], [POINTS[id].x, POINTS[id].y + 20]]} seed={seedOf(`p${s.layer}-${i}`)} stroke="var(--accent)" strokeWidth={2.2} />
            ))}
            {nodes.map((p) => (
              <g key={p.id}>
                <SketchEllipse cx={p.x} cy={p.y + 20} w={28} h={28} seed={seedOf(`n${p.id}`)} stroke={p.id === cur ? 'var(--accent)' : 'var(--fg)'} strokeWidth={p.id === cur ? 2.2 : 1.4} fill={p.id === cur ? 'var(--accent)' : 'var(--surface)'} />
                <HandText x={p.x} y={p.y + 21} size={TEXT_SIZES.note} mono>{String(p.id)}</HandText>
              </g>
            ))}
            <HandText x={QUERY.x} y={QUERY.y + 20} size={TEXT_SIZES.heading} mono color="var(--warn)">x</HandText>
            <HandText x={QUERY.x + 20} y={QUERY.y + 4} size={TEXT_SIZES.note} color="var(--warn)">query</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

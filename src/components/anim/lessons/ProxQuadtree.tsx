import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { QUAD_POINTS, buildLeaves, queryCircle, type Leaf } from './proxGeo';

/** A quadtree with leaf capacity 4. The points and the tree come from proxGeo.ts; the test checks the leaf counts. */
const CAP = 4;
const Q = { c: { x: 69, y: 69 }, r: 4 };

const steps = [
  { caption: 'A quadtree covers a square with one cell. Capacity is 4 points per cell. Four points arrive. The tree is one cell.', n: 4, q: false },
  { caption: 'The 5th point (the highlighted dot) is one too many. The cell splits into 4 equal quadrants and each point moves into its quadrant. Three quadrants hold 1 point each. The north-east one holds 2.', n: 5, q: false },
  { caption: 'Points 6, 7, and 8 all land in the north-east quadrant. It reaches 5 points, so it splits again. The empty and sparse quadrants stay big. The tree has 7 cells.', n: 8, q: false },
  { caption: 'The 9th point lands in a cell that already holds 4. All 5 points fall in the same quarter, so the split repeats. After two more splits the tree has 13 cells and is 4 levels deep. Dense areas get small cells.', n: 9, q: false },
  { caption: 'A "within radius" query visits only the cells that touch the circle: 4 small cells. It scans 5 of the 9 points and keeps the 2 that are truly inside. The three big cells are skipped without looking at them.', n: 9, q: true },
];

const key = (l: Leaf) => `${l.x},${l.y},${l.size}`;
const S = 280;
const X0 = 30;
const Y0 = 24;
const sx = (x: number) => X0 + (x / 100) * S;
const sy = (y: number) => Y0 + S - (y / 100) * S;

export default function ProxQuadtree() {
  return (
    <AnimFrame title="A quadtree splits where the points are dense" steps={steps} interval={3000}>
      {(i, s) => {
        const pts = QUAD_POINTS.slice(0, s.n);
        const leaves = buildLeaves(pts, CAP);
        const prev = i > 0 ? new Set(buildLeaves(QUAD_POINTS.slice(0, steps[i - 1].n), CAP).map(key)) : new Set<string>();
        const q = s.q ? queryCircle(leaves, Q.c, Q.r) : null;
        const hit = new Set(q?.hit.map(key));
        const deepest = Math.min(...leaves.map((l) => l.size));
        const last = pts[pts.length - 1];
        return (
          <SketchSvg width={720} height={330} label="A square divided into smaller cells where the points are dense">
            {leaves.map((l) => {
              const isHit = hit.has(key(l));
              const isNew = i > 0 && !prev.has(key(l)) && !s.q;
              return (
                <SketchBox
                  key={key(l)}
                  cx={sx(l.x + l.size / 2)}
                  cy={sy(l.y + l.size / 2)}
                  w={(l.size / 100) * S - 2}
                  h={(l.size / 100) * S - 2}
                  r={l.size < 10 ? 3 : 6}
                  seed={seedOf(`leaf${key(l)}`)}
                  stroke={isHit ? 'var(--ok)' : isNew ? 'var(--accent)' : 'var(--muted)'}
                  fill={isHit ? 'var(--ok)' : undefined}
                  fillStyle="solid"
                />
              );
            })}
            {pts.map((p, k) => (
              <SketchEllipse
                key={k}
                cx={sx(p.x)}
                cy={sy(p.y)}
                w={9}
                h={9}
                seed={seedOf(`p${k}`)}
                stroke={p === last && !s.q ? 'var(--bad)' : 'var(--fg)'}
                fill={p === last && !s.q ? 'var(--bad)' : 'var(--fg)'}
                fillStyle="solid"
              />
            ))}
            {s.q && <SketchEllipse cx={sx(Q.c.x)} cy={sy(Q.c.y)} w={(Q.r * 2 * S) / 100} h={(Q.r * 2 * S) / 100} seed={seedOf('qc')} stroke="var(--accent)" dashed />}

            <HandText x={380} y={50} size={TEXT_SIZES.heading} anchor="start">
              {`${pts.length} points, capacity ${CAP}`}
            </HandText>
            <HandText x={380} y={90} size={TEXT_SIZES.label} anchor="start" color="var(--muted)" mono>
              {`cells: ${leaves.length}`}
            </HandText>
            <HandText x={380} y={120} size={TEXT_SIZES.label} anchor="start" color="var(--muted)" mono>
              {`smallest cell: ${deepest} (of 100)`}
            </HandText>
            <HandText x={380} y={150} size={TEXT_SIZES.label} anchor="start" color="var(--muted)" mono>
              {`largest cell: ${Math.max(...leaves.map((l) => l.size))} (of 100)`}
            </HandText>
            {q ? (
              <>
                <HandText x={380} y={205} size={TEXT_SIZES.label} anchor="start" color="var(--ok)" mono>
                  {`cells touched: ${q.hit.length} of ${leaves.length}`}
                </HandText>
                <HandText x={380} y={235} size={TEXT_SIZES.label} anchor="start" color="var(--ok)" mono>
                  {`points scanned: ${q.scanned} of ${pts.length}`}
                </HandText>
                <HandText x={380} y={265} size={TEXT_SIZES.label} anchor="start" color="var(--ok)" mono>
                  {`inside radius ${Q.r}: ${q.inside}`}
                </HandText>
              </>
            ) : (
              <>
                <HandText x={380} y={215} size={TEXT_SIZES.note} anchor="start" color="var(--accent)">
                  Accent outline: cells made this step
                </HandText>
                <HandText x={380} y={240} size={TEXT_SIZES.note} anchor="start" color="var(--bad)">
                  Highlighted dot: the newest point
                </HandText>
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

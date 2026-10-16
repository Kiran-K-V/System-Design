/** Toy layered graph for the HNSW walk. Points and layers are illustrative. Pure and deterministic. */

export interface Pt { id: number; x: number; y: number; top: number }

export const POINTS: Pt[] = [
  { id: 0, x: 80, y: 70, top: 2 },
  { id: 1, x: 330, y: 200, top: 0 },
  { id: 2, x: 150, y: 150, top: 0 },
  { id: 3, x: 230, y: 60, top: 1 },
  { id: 4, x: 420, y: 90, top: 0 },
  { id: 5, x: 540, y: 170, top: 1 },
  { id: 6, x: 610, y: 70, top: 0 },
  { id: 7, x: 90, y: 230, top: 0 },
  { id: 8, x: 260, y: 150, top: 0 },
  { id: 9, x: 460, y: 220, top: 2 },
  { id: 10, x: 360, y: 130, top: 1 },
  { id: 11, x: 580, y: 240, top: 0 },
  { id: 12, x: 200, y: 230, top: 0 },
  { id: 13, x: 500, y: 100, top: 0 },
  { id: 14, x: 40, y: 140, top: 0 },
  { id: 15, x: 650, y: 150, top: 0 },
];

export const QUERY = { x: 520, y: 135 };

const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const inLayer = (l: number) => POINTS.filter((p) => p.top >= l);

/** Each point links to its `deg` nearest points in the same layer (undirected). */
export function edges(l: number, deg: number): [number, number][] {
  const nodes = inLayer(l);
  const set = new Set<string>();
  const out: [number, number][] = [];
  for (const a of nodes) {
    const near = nodes.filter((b) => b.id !== a.id).sort((p, q) => d2(a, p) - d2(a, q)).slice(0, deg);
    for (const b of near) {
      const k = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
      if (!set.has(k)) {
        set.add(k);
        out.push([Math.min(a.id, b.id), Math.max(a.id, b.id)]);
      }
    }
  }
  return out;
}

export const DEG = [3, 2, 2];

export interface LayerWalk { layer: number; path: number[]; checked: number }

/** Greedy descent from entry point `entry`: on each layer hop to the neighbor nearest the query until none is nearer. */
export function descend(entry = 0): LayerWalk[] {
  const walks: LayerWalk[] = [];
  let cur = entry;
  for (let l = 2; l >= 0; l--) {
    const es = edges(l, DEG[l]);
    const nb = (id: number) => es.filter((e) => e.includes(id)).map((e) => (e[0] === id ? e[1] : e[0]));
    const path = [cur];
    const seen = new Set<number>([cur]);
    for (;;) {
      let best = cur;
      for (const n of nb(cur)) {
        seen.add(n);
        if (d2(POINTS[n], QUERY) < d2(POINTS[best], QUERY)) best = n;
      }
      if (best === cur) break;
      cur = best;
      path.push(cur);
    }
    walks.push({ layer: l, path, checked: seen.size });
  }
  return walks;
}

export const trueNearest = () => POINTS.reduce((b, p) => (d2(p, QUERY) < d2(b, QUERY) ? p : b)).id;

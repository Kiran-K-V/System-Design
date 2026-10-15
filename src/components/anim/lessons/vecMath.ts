/** Vector math and a toy HNSW for the vector-databases lesson. No imports, so a node test can load it. */

export type V = number[];

export const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0);
export const norm = (a: V) => Math.sqrt(dot(a, a));
export const cosine = (a: V, b: V) => dot(a, b) / (norm(a) * norm(b));
export const cosineDistance = (a: V, b: V) => 1 - cosine(a, b);
export const l2 = (a: V, b: V) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));

/** Exact k nearest by L2. Compares the query to every point: N distance computations. */
export function exactKnn(points: V[], q: V, k: number): number[] {
  return points
    .map((p, i) => ({ i, d: l2(p, q) }))
    .sort((x, y) => x.d - y.d || x.i - y.i)
    .slice(0, k)
    .map((x) => x.i);
}

/** Layer l holds the nodes with level >= l. Each node links to its m nearest nodes in that layer (links are mutual). */
export function buildLayers(points: V[], levels: number[], m: number, m0: number): number[][][] {
  const top = Math.max(...levels);
  const layers: number[][][] = [];
  for (let l = 0; l <= top; l++) {
    const adj: number[][] = points.map(() => []);
    const ids = points.map((_, i) => i).filter((i) => levels[i] >= l);
    const deg = l === 0 ? m0 : m;
    for (const i of ids) {
      const near = ids
        .filter((j) => j !== i)
        .sort((a, b) => l2(points[i], points[a]) - l2(points[i], points[b]) || a - b)
        .slice(0, deg);
      for (const j of near) {
        if (!adj[i].includes(j)) adj[i].push(j);
        if (!adj[j].includes(i)) adj[j].push(i);
      }
    }
    layers.push(adj);
  }
  return layers;
}

export interface LayerTrace {
  /** Nodes in the order their distance to the query was computed. */
  visited: number[];
  /** The ef best nodes found, nearest first. */
  best: number[];
}

/** Beam search in one layer. ef = 1 is the plain greedy walk. */
export function searchLayer(points: V[], adj: number[][], q: V, entry: number[], ef: number): LayerTrace {
  const d = (i: number) => l2(points[i], q);
  const seen = new Set<number>(entry);
  const visited = [...entry];
  const cand = [...entry].sort((a, b) => d(a) - d(b));
  let best = [...cand];
  while (cand.length) {
    const c = cand.shift()!;
    const worst = best[best.length - 1];
    if (best.length >= ef && d(c) > d(worst)) break;
    for (const n of adj[c]) {
      if (seen.has(n)) continue;
      seen.add(n);
      visited.push(n);
      if (best.length < ef || d(n) < d(best[best.length - 1])) {
        cand.push(n);
        cand.sort((a, b) => d(a) - d(b));
        best.push(n);
        best.sort((a, b) => d(a) - d(b));
        if (best.length > ef) best.pop();
      }
    }
  }
  return { visited, best: best.slice(0, ef) };
}

export interface HnswTrace {
  layers: LayerTrace[]; // index 0 = top layer searched first
  result: number[];
  distanceCalls: number;
}

/** Search from the top layer down. Upper layers use ef = 1. The bottom layer uses efSearch. Returns the k nearest found. */
export function hnswSearch(points: V[], layers: number[][][], entry: number, q: V, k: number, efSearch: number): HnswTrace {
  const out: LayerTrace[] = [];
  let ep = [entry];
  for (let l = layers.length - 1; l >= 1; l--) {
    const t = searchLayer(points, layers[l], q, ep, 1);
    out.push(t);
    ep = t.best;
  }
  const t0 = searchLayer(points, layers[0], q, ep, Math.max(efSearch, k));
  out.push(t0);
  const called = new Set<number>();
  out.forEach((t) => t.visited.forEach((v) => called.add(v)));
  return { layers: out, result: t0.best.slice(0, k), distanceCalls: out.reduce((n, t) => n + t.visited.length, 0) };
}

/** Probability an element reaches layer l or higher is M^-l, because mL = 1 / ln(M). Expected nodes on layer l among N. */
export const expectedOnLayer = (n: number, m: number, l: number) => n / Math.pow(m, l);

/** Bytes for float32 vectors. */
export const vectorBytes = (n: number, d: number) => n * d * 4;

/** The toy data set of the animation: 18 points in a 100 x 100 square, a level per point, one query, and the entry point. */
export const TOY_POINTS: V[] = [[92,52],[12,92],[5,52],[84,42],[55,66],[43,23],[66,40],[59,62],[54,21],[41,63],[86,37],[20,43],[91,29],[14,31],[38,42],[23,59],[68,87],[59,88]];
export const TOY_LEVELS = [0, 0, 0, 1, 2, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0];
export const TOY_Q: V = [31, 24];
export const TOY_ENTRY = 12;

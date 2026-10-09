/** Pure B-tree insert logic (max 3 keys per node) shared by BTreeSim and its test. */
export const MAX = 3;

export interface N {
  id: number;
  keys: number[];
  kids: N[];
}

export interface Ctx {
  next: number;
  path: number[];
  splits: { left: number; right: number; up: number }[];
  dup: boolean;
}

export function split(n: N, ctx: Ctx): { left: N; up: number; right: N } {
  const mid = Math.floor(n.keys.length / 2);
  const left: N = { id: n.id, keys: n.keys.slice(0, mid), kids: n.kids.slice(0, n.kids.length ? mid + 1 : 0) };
  const right: N = { id: ctx.next++, keys: n.keys.slice(mid + 1), kids: n.kids.slice(n.kids.length ? mid + 1 : 0) };
  ctx.splits.push({ left: left.id, right: right.id, up: n.keys[mid] });
  return { left, up: n.keys[mid], right };
}

export function ins(n: N, k: number, ctx: Ctx): { node: N; up?: { key: number; right: N } } {
  ctx.path.push(n.id);
  if (n.keys.includes(k)) {
    ctx.dup = true;
    return { node: n };
  }
  let idx = n.keys.findIndex((x) => k < x);
  if (idx === -1) idx = n.keys.length;
  let cur: N;
  if (n.kids.length === 0) {
    const keys = [...n.keys.slice(0, idx), k, ...n.keys.slice(idx)];
    cur = { ...n, keys };
  } else {
    const res = ins(n.kids[idx], k, ctx);
    if (ctx.dup) return { node: n };
    const kids = [...n.kids];
    kids[idx] = res.node;
    let keys = n.keys;
    if (res.up) {
      keys = [...keys.slice(0, idx), res.up.key, ...keys.slice(idx)];
      kids.splice(idx + 1, 0, res.up.right);
    }
    cur = { ...n, keys, kids };
  }
  if (cur.keys.length > MAX) {
    const s = split(cur, ctx);
    return { node: s.left, up: { key: s.up, right: s.right } };
  }
  return { node: cur };
}

export interface Insert {
  tree: N;
  path: number[];
  splits: Ctx['splits'];
  dup: boolean;
  next: number;
  rootSplit: boolean;
}

export function insert(root: N, k: number, next: number): Insert {
  const ctx: Ctx = { next, path: [], splits: [], dup: false };
  const res = ins(root, k, ctx);
  if (ctx.dup) return { tree: root, path: ctx.path, splits: [], dup: true, next, rootSplit: false };
  if (res.up) {
    const tree: N = { id: ctx.next++, keys: [res.up.key], kids: [res.node, res.up.right] };
    return { tree, path: ctx.path, splits: ctx.splits, dup: false, next: ctx.next, rootSplit: true };
  }
  return { tree: res.node, path: ctx.path, splits: ctx.splits, dup: false, next: ctx.next, rootSplit: false };
}

export function depthOf(n: N): number {
  return n.kids.length ? 1 + depthOf(n.kids[0]) : 1;
}
export function countNodes(n: N): number {
  return 1 + n.kids.reduce((a, k) => a + countNodes(k), 0);
}
export function countKeys(n: N): number {
  return n.keys.length + n.kids.reduce((a, k) => a + countKeys(k), 0);
}


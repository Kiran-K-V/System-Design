import { useEffect, useRef, useState } from 'react';
import { HandText, SketchArrow, SketchBox, seedOf } from '../sketch';
import { WidgetFrame } from '../data-kit';

/** A small B-tree (max 3 keys per node) you can insert into. Real databases use the B+tree variant with ~hundreds of keys per page. */

const MAX = 3;
const CELL = 38;
const NODE_W = MAX * CELL + 12;
const NODE_H = 38;
const GAP = 16;
const LEVEL = 86;

interface N {
  id: number;
  keys: number[];
  kids: N[];
}

interface Ctx {
  next: number;
  path: number[];
  splits: { left: number; right: number; up: number }[];
  dup: boolean;
}

function split(n: N, ctx: Ctx): { left: N; up: number; right: N } {
  const mid = Math.floor(n.keys.length / 2);
  const left: N = { id: n.id, keys: n.keys.slice(0, mid), kids: n.kids.slice(0, n.kids.length ? mid + 1 : 0) };
  const right: N = { id: ctx.next++, keys: n.keys.slice(mid + 1), kids: n.kids.slice(n.kids.length ? mid + 1 : 0) };
  ctx.splits.push({ left: left.id, right: right.id, up: n.keys[mid] });
  return { left, up: n.keys[mid], right };
}

function ins(n: N, k: number, ctx: Ctx): { node: N; up?: { key: number; right: N } } {
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

interface Insert {
  tree: N;
  path: number[];
  splits: Ctx['splits'];
  dup: boolean;
  next: number;
  rootSplit: boolean;
}

function insert(root: N, k: number, next: number): Insert {
  const ctx: Ctx = { next, path: [], splits: [], dup: false };
  const res = ins(root, k, ctx);
  if (ctx.dup) return { tree: root, path: ctx.path, splits: [], dup: true, next, rootSplit: false };
  if (res.up) {
    const tree: N = { id: ctx.next++, keys: [res.up.key], kids: [res.node, res.up.right] };
    return { tree, path: ctx.path, splits: ctx.splits, dup: false, next: ctx.next, rootSplit: true };
  }
  return { tree: res.node, path: ctx.path, splits: ctx.splits, dup: false, next: ctx.next, rootSplit: false };
}

interface Placed {
  id: number;
  keys: number[];
  cx: number;
  depth: number;
}

function place(n: N, left: number, depth: number, out: Placed[]): { cx: number; width: number } {
  if (n.kids.length === 0) {
    const cx = left + NODE_W / 2;
    out.push({ id: n.id, keys: n.keys, cx, depth });
    return { cx, width: NODE_W };
  }
  const idx = out.length;
  out.push({ id: n.id, keys: n.keys, cx: 0, depth });
  let x = left;
  const centers: number[] = [];
  for (const kid of n.kids) {
    const r = place(kid, x, depth + 1, out);
    centers.push(r.cx);
    x += r.width + GAP;
  }
  const width = x - GAP - left;
  const cx = (centers[0] + centers[centers.length - 1]) / 2;
  out[idx].cx = cx;
  return { cx, width: Math.max(width, NODE_W) };
}

function depthOf(n: N): number {
  return n.kids.length ? 1 + depthOf(n.kids[0]) : 1;
}
function countNodes(n: N): number {
  return 1 + n.kids.reduce((a, k) => a + countNodes(k), 0);
}
function countKeys(n: N): number {
  return n.keys.length + n.kids.reduce((a, k) => a + countKeys(k), 0);
}

const SCRIPT = [10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 35, 45];

interface View {
  tree: N;
  hi: number[];
  hiTone: 'accent' | 'warn';
  msg: string;
}

export default function BTreeSim() {
  const [committed, setCommitted] = useState<{ tree: N; next: number; count: number }>({ tree: { id: 0, keys: [], kids: [] }, next: 1, count: 0 });
  const [view, setView] = useState<View>({ tree: committed.tree, hi: [], hiTone: 'accent', msg: 'Type a number and press Insert. Start with 10, 20, 30, 40.' });
  const [text, setText] = useState('10');
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const [locked, setLocked] = useState(false);
  const scriptPos = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const run = (k: number) => {
    if (busy.current || !Number.isFinite(k)) return;
    const before = committed.tree;
    const res = insert(before, k, committed.next);
    if (res.dup) {
      setView({ tree: before, hi: res.path, hiTone: 'warn', msg: `Key ${k} is already in the tree. A primary-key index rejects duplicates.` });
      return;
    }
    busy.current = true;
    setLocked(true);
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const step = calm ? 0 : 650;
    const byId = new Map<number, N>();
    const walk = (n: N) => {
      byId.set(n.id, n);
      n.kids.forEach(walk);
    };
    walk(before);
    // Phase 1: descend through the old tree.
    res.path.forEach((id, i) => {
      later(i * step, () => {
        const n = byId.get(id)!;
        const isLeaf = n.kids.length === 0;
        let msg: string;
        if (isLeaf) msg = `Reached leaf [${n.keys.join(', ') || 'empty'}]. Insert ${k} here, in sorted order.`;
        else {
          const at = n.keys.findIndex((x) => k < x);
          const idx = at === -1 ? n.keys.length : at;
          const where = idx === 0 ? `before ${n.keys[0]}` : idx === n.keys.length ? `after ${n.keys[idx - 1]}` : `between ${n.keys[idx - 1]} and ${n.keys[idx]}`;
          msg = `Node [${n.keys.join(', ')}]: ${k} sorts ${where}. Follow that child pointer down.`;
        }
        setView({ tree: before, hi: res.path.slice(0, i + 1), hiTone: 'accent', msg });
      });
    });
    // Phase 2: show the result.
    later(res.path.length * step, () => {
      const touched = res.splits.length ? res.splits.flatMap((s) => [s.left, s.right]) : [res.path[res.path.length - 1]];
      const splitMsg = res.splits.length
        ? `Node overflowed (more than ${MAX} keys). Split it: ${res.splits.map((s) => `${s.up} moves up`).join(', then ')}.${res.rootSplit ? ' The root split, so the tree grew one level taller.' : ''}`
        : `Inserted ${k}. The leaf had room, so no split. One page changed.`;
      setView({ tree: res.tree, hi: touched, hiTone: res.splits.length ? 'warn' : 'accent', msg: splitMsg });
      setCommitted({ tree: res.tree, next: res.next, count: committed.count + 1 });
      busy.current = false;
      setLocked(false);
    });
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setLocked(false);
    scriptPos.current = 0;
    const t = { id: 0, keys: [], kids: [] } as N;
    setCommitted({ tree: t, next: 1, count: 0 });
    setView({ tree: t, hi: [], hiTone: 'accent', msg: 'Empty tree. Insert a key.' });
  };

  const placed: Placed[] = [];
  const total = place(view.tree, 0, 0, placed);
  const depth = depthOf(view.tree);
  const W = Math.max(total.width + 40, 560);
  const H = 40 + depth * LEVEL;
  const shift = (W - total.width) / 2;
  const byDepthCx = new Map<string, Placed>();
  placed.forEach((p) => byDepthCx.set(`${p.id}`, p));

  // Parent links by id.
  const parentOf = new Map<number, Placed>();
  const link = (n: N) => {
    n.kids.forEach((k) => {
      parentOf.set(k.id, byDepthCx.get(String(n.id))!);
      link(k);
    });
  };
  link(view.tree);

  return (
    <WidgetFrame
      title="B-tree sandbox: insert a key and watch it descend and split"
      caption={
        <>
          <span aria-live="polite">{view.msg}</span>
          <span className="mt-1 block text-xs text-muted">
            Each node is one page holding up to {MAX} keys. Real pages hold hundreds, so real trees are 3–4 levels deep, not 10. Real indexes also use the B+tree variant: data pointers live only in the leaves.
          </span>
        </>
      }
    >
      <form
        className="mb-3 flex flex-wrap items-center gap-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          run(parseInt(text, 10));
        }}
      >
        <label className="flex items-center gap-2">
          Key
          <input
            type="text"
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            className="w-20 rounded-md border border-line bg-bg px-2 py-1 font-mono"
            aria-label="Key to insert"
          />
        </label>
        <button type="submit" disabled={locked || text === ''} className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-40">
          Insert
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            const k = SCRIPT[scriptPos.current % SCRIPT.length];
            scriptPos.current += 1;
            setText(String(k));
            run(k);
          }}
          className="rounded-md border border-line px-3 py-1.5 hover:bg-surface disabled:opacity-40"
        >
          Insert next from sample
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => {
            const k = 1 + Math.floor(Math.random() * 99);
            setText(String(k));
            run(k);
          }}
          className="rounded-md border border-line px-3 py-1.5 hover:bg-surface disabled:opacity-40"
        >
          Random key
        </button>
        <button type="button" onClick={reset} className="text-xs text-accent hover:underline">
          Reset
        </button>
        <span className="ml-auto font-mono text-xs text-muted">
          {countKeys(view.tree)} keys · {countNodes(view.tree)} pages · height {depth}
        </span>
      </form>
      <div className="overflow-x-auto rounded-lg bg-surface/50">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="B-tree with nodes holding up to three keys" className="mx-auto block max-w-none">
          {placed.map((p) => {
            const par = parentOf.get(p.id);
            if (!par) return null;
            const x1 = par.cx + shift;
            const y1 = 20 + par.depth * LEVEL + NODE_H / 2 + 2;
            const x2 = p.cx + shift;
            const y2 = 20 + p.depth * LEVEL - NODE_H / 2 - 2;
            return <SketchArrow key={`e${p.id}`} points={[[x1, y1], [x2, y2]]} head="none" stroke="var(--muted)" seed={seedOf(`edge${p.id}`)} />;
          })}
          {placed.map((p) => {
            const on = view.hi.includes(p.id);
            const cy = 20 + p.depth * LEVEL;
            const cx = p.cx + shift;
            const color = on ? (view.hiTone === 'warn' ? 'var(--warn)' : 'var(--accent)') : 'var(--fg)';
            return (
              <g key={p.id}>
                <SketchBox cx={cx} cy={cy} w={NODE_W} h={NODE_H} r={6} seed={seedOf(`node${p.id}`)} stroke={color} strokeWidth={on ? 2.2 : 1.4} fill={on ? 'var(--accent-soft)' : 'var(--bg)'} fillStyle="solid" />
                {Array.from({ length: MAX - 1 }).map((_, i) => (
                  <line key={i} x1={cx - NODE_W / 2 + 6 + (i + 1) * CELL} x2={cx - NODE_W / 2 + 6 + (i + 1) * CELL} y1={cy - 11} y2={cy + 11} stroke="var(--border)" />
                ))}
                {p.keys.map((k, i) => (
                  <HandText key={i} x={cx - NODE_W / 2 + 6 + i * CELL + CELL / 2} y={cy + 1} size={17} weight={600} mono color={color}>
                    {String(k)}
                  </HandText>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </WidgetFrame>
  );
}

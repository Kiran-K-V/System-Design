/** Pure math for hash rings. No React, so it runs the same on the server and in the browser. */

export const RING = 2 ** 32;

/** 32-bit FNV-1a followed by a murmur-style finalizer. Spreads similar strings evenly over the ring. */
export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export interface VNode {
  node: string;
  pos: number;
}

/** Ring positions of every node. Each node owns `vnodes` points. */
export function buildRing(nodes: string[], vnodes: number): VNode[] {
  const pts: VNode[] = [];
  for (const node of nodes) for (let v = 0; v < vnodes; v++) pts.push({ node, pos: hash32(vnodes === 1 ? node : `${node}#${v}`) });
  return pts.sort((a, b) => a.pos - b.pos);
}

/** Owner of a key position: the first ring point at or after it, clockwise. */
export function ownerOf(ring: VNode[], pos: number): string {
  let lo = 0;
  let hi = ring.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ring[mid].pos < pos) lo = mid + 1;
    else hi = mid;
  }
  return ring[lo === ring.length ? 0 : lo].node;
}

export const keyName = (i: number) => `key-${i}`;

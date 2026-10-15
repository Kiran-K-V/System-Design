/** Geohash and quadtree math for the proximity-search lesson. No imports, so a node test can load it. */

export const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export interface Box {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export interface BitStep {
  axis: 'lng' | 'lat';
  bit: 0 | 1;
  lo: number;
  hi: number;
  mid: number;
  box: Box;
}

/** One bisection step per bit. Bits alternate, longitude first. Each bit keeps the upper half (1) or the lower half (0). */
export function bitSteps(lat: number, lng: number, nBits: number): BitStep[] {
  const box: Box = { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 };
  const out: BitStep[] = [];
  for (let i = 0; i < nBits; i++) {
    const axis = i % 2 === 0 ? 'lng' : 'lat';
    const lo = axis === 'lng' ? box.lngMin : box.latMin;
    const hi = axis === 'lng' ? box.lngMax : box.latMax;
    const mid = (lo + hi) / 2;
    const v = axis === 'lng' ? lng : lat;
    const bit = v >= mid ? 1 : 0;
    if (axis === 'lng') {
      if (bit) box.lngMin = mid;
      else box.lngMax = mid;
    } else if (bit) box.latMin = mid;
    else box.latMax = mid;
    out.push({ axis, bit, lo, hi, mid, box: { ...box } });
  }
  return out;
}

export const bitString = (lat: number, lng: number, nBits: number) => bitSteps(lat, lng, nBits).map((s) => s.bit).join('');

/** 5 bits per base32 character. */
export function geohash(lat: number, lng: number, length: number): string {
  const bits = bitString(lat, lng, length * 5);
  let out = '';
  for (let i = 0; i < length; i++) out += BASE32[parseInt(bits.slice(i * 5, i * 5 + 5), 2)];
  return out;
}

/** The cell a hash covers. */
export function decodeBox(hash: string): Box {
  const box: Box = { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 };
  let isLng = true;
  for (const ch of hash) {
    const v = BASE32.indexOf(ch);
    for (let b = 4; b >= 0; b--) {
      const bit = (v >> b) & 1;
      if (isLng) {
        const mid = (box.lngMin + box.lngMax) / 2;
        if (bit) box.lngMin = mid;
        else box.lngMax = mid;
      } else {
        const mid = (box.latMin + box.latMax) / 2;
        if (bit) box.latMin = mid;
        else box.latMax = mid;
      }
      isLng = !isLng;
    }
  }
  return box;
}

/** Cell size for a hash length. Longitude gets the extra bit when the bit count is odd. */
export function cellSize(length: number) {
  const bits = length * 5;
  const lngBits = Math.ceil(bits / 2);
  const latBits = Math.floor(bits / 2);
  const widthDeg = 360 / 2 ** lngBits;
  const heightDeg = 180 / 2 ** latBits;
  const KM_PER_DEG = 111.32; // equator, sphere-ish; good to about 1%
  return { bits, lngBits, latBits, widthDeg, heightDeg, widthKm: widthDeg * KM_PER_DEG, heightKm: heightDeg * KM_PER_DEG };
}

/** The 8 cells around a hash (plus itself first), found by stepping one cell width and re-encoding the center. Longitude wraps. */
export function ring9(hash: string): string[] {
  const b = decodeBox(hash);
  const w = b.lngMax - b.lngMin;
  const h = b.latMax - b.latMin;
  const cLat = (b.latMin + b.latMax) / 2;
  const cLng = (b.lngMin + b.lngMax) / 2;
  const out = [hash];
  for (const dLat of [1, 0, -1]) {
    for (const dLng of [-1, 0, 1]) {
      if (dLat === 0 && dLng === 0) continue;
      const lat = cLat + dLat * h;
      if (lat > 90 || lat < -90) continue;
      let lng = cLng + dLng * w;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
      out.push(geohash(lat, lng, hash.length));
    }
  }
  return out;
}

export const commonPrefix = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

/* ---------- region quadtree ---------- */

export type Pt = { x: number; y: number };

export interface Leaf {
  x: number;
  y: number;
  size: number;
  pts: Pt[];
  depth: number;
}

/** Build a quadtree over the square [0, 100] x [0, 100]. A leaf splits when it holds more than `capacity` points. */
export function buildLeaves(points: Pt[], capacity: number): Leaf[] {
  const split = (leaf: Leaf): Leaf[] => {
    if (leaf.pts.length <= capacity || leaf.depth >= 12) return [leaf];
    const h = leaf.size / 2;
    const kids: Leaf[] = [
      { x: leaf.x, y: leaf.y + h, size: h, pts: [], depth: leaf.depth + 1 }, // NW
      { x: leaf.x + h, y: leaf.y + h, size: h, pts: [], depth: leaf.depth + 1 }, // NE
      { x: leaf.x, y: leaf.y, size: h, pts: [], depth: leaf.depth + 1 }, // SW
      { x: leaf.x + h, y: leaf.y, size: h, pts: [], depth: leaf.depth + 1 }, // SE
    ];
    for (const p of leaf.pts) {
      const east = p.x >= leaf.x + h ? 1 : 0;
      const north = p.y >= leaf.y + h ? 0 : 2;
      kids[north + east].pts.push(p);
    }
    return kids.flatMap(split);
  };
  return split({ x: 0, y: 0, size: 100, pts: points, depth: 0 });
}

/** Leaves whose square touches a circle, and how many points those leaves hold. */
export function queryCircle(leaves: Leaf[], c: Pt, r: number) {
  const hit = leaves.filter((l) => {
    const nx = Math.max(l.x, Math.min(c.x, l.x + l.size));
    const ny = Math.max(l.y, Math.min(c.y, l.y + l.size));
    return (nx - c.x) ** 2 + (ny - c.y) ** 2 <= r * r;
  });
  const scanned = hit.reduce((n, l) => n + l.pts.length, 0);
  const inside = hit.flatMap((l) => l.pts).filter((p) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= r * r).length;
  return { hit, scanned, inside };
}

export const QUAD_POINTS: Pt[] = [
  { x: 12, y: 80 },
  { x: 80, y: 15 },
  { x: 30, y: 30 },
  { x: 70, y: 70 },
  { x: 74, y: 66 },
  { x: 66, y: 74 },
  { x: 78, y: 78 },
  { x: 72, y: 72 },
  { x: 68, y: 68 },
];

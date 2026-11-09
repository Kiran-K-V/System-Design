import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

/**
 * The house look for 3D: flat toon fill in three bands, plus ink outlines that overshoot the corners
 * a little and carry a faint second stroke, like a pen sketch. Matches the hand-drawn 2D diagrams.
 */

/** Three light bands. The darkest band stays bright so colors keep their meaning on a dark page. */
export const TOON_GRADIENT = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

/** Small fixed random numbers so every page load draws the same wobble. */
function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

/**
 * Pen strokes from the edges of a geometry. Each stroke runs past its corners by `overshoot` (a share of its length)
 * and its ends move by up to `jitter`, so the outline looks drawn by hand.
 */
export function inkStrokes(source: THREE.BufferGeometry, overshoot = 0.05, jitter = 0, seed = 7): LineSegmentsGeometry {
  const pos = source.getAttribute('position');
  const r = rand(seed);
  const out: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 2) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    d.subVectors(b, a).multiplyScalar(overshoot);
    a.sub(d);
    b.add(d);
    if (jitter) {
      a.add(new THREE.Vector3(r(), r(), r()).multiplyScalar(jitter));
      b.add(new THREE.Vector3(r(), r(), r()).multiplyScalar(jitter));
    }
    out.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  return new LineSegmentsGeometry().setPositions(out);
}

/** The 12 edges of a box as pairs of corner signs. */
const BOX_EDGES: [number, number, number, number, number, number][] = [];
for (const [a, b] of [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
]) {
  const c = (i: number) => [i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5];
  BOX_EDGES.push([...c(a), ...c(b)] as [number, number, number, number, number, number]);
}
const JITTER = (() => {
  const r = rand(11);
  return BOX_EDGES.map(() => [r(), r(), r(), r(), r(), r()]);
})();

/**
 * Writes the pen strokes of a box of size sx, sy, sz into `out` (72 numbers).
 * Overshoot and wobble are in world units, so a long thin plate gets the same small ticks as a cube.
 */
export function boxStrokes(out: Float32Array, sx: number, sy: number, sz: number, overshoot: number, jitter: number) {
  BOX_EDGES.forEach((e, i) => {
    const ax = e[0] * sx, ay = e[1] * sy, az = e[2] * sz;
    const bx = e[3] * sx, by = e[4] * sy, bz = e[5] * sz;
    const len = Math.hypot(bx - ax, by - ay, bz - az) || 1;
    const o = Math.min(overshoot, len * 0.2) / len;
    const dx = (bx - ax) * o, dy = (by - ay) * o, dz = (bz - az) * o;
    const j = JITTER[i];
    out.set([ax - dx + j[0] * jitter, ay - dy + j[1] * jitter, az - dz + j[2] * jitter, bx + dx + j[3] * jitter, by + dy + j[4] * jitter, bz + dz + j[5] * jitter], i * 6);
  });
}

/** A fresh stroke geometry for one box. Update it with `setBoxStrokes`. */
export function newBoxStroke(): LineSegmentsGeometry {
  return new LineSegmentsGeometry().setPositions(new Float32Array(72));
}

/** Rewrites a box stroke geometry in place for a new size. Cheap: 72 numbers, no new buffers. */
export function setBoxStrokes(g: LineSegmentsGeometry, sx: number, sy: number, sz: number, overshoot: number, jitter: number) {
  const attr = g.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute;
  const buf = attr.data;
  boxStrokes(buf.array as Float32Array, sx, sy, sz, overshoot, jitter);
  buf.needsUpdate = true;
  // Keep culling and picking correct for the new size.
  g.computeBoundingSphere();
}

/**
 * A pen line object with its own material. Width is in screen pixels, so it stays crisp at any zoom.
 * The caller animates `material.color` and `material.opacity`, and must call `dispose` on unmount.
 */
export function makeInk(geometry: LineSegmentsGeometry, color: string, width: number, opacity: number) {
  const material = new LineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false });
  material.depthWrite = false;
  const line = new LineSegments2(geometry, material);
  line.frustumCulled = false;
  return { line, material, dispose: () => material.dispose() };
}

/** Ink line object kept for the life of a component. */
export function useInk(geometry: LineSegmentsGeometry, color: string, width: number, opacity: number) {
  // Built once. Color and opacity change later through the material, not by rebuilding.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ink = useMemo(() => makeInk(geometry, color, width, opacity), [geometry, width]);
  useEffect(() => () => ink.dispose(), [ink]);
  return ink;
}

/* ---------- Hover hints ---------- */

export interface HintApi {
  show: (text: string, clientX: number, clientY: number) => void;
  hide: () => void;
}
export const HintContext = createContext<HintApi | null>(null);

/**
 * Pointer handlers that show `text` in a small label next to the cursor. A tap shows it on touch screens.
 * `active` lets a hidden object stop catching the pointer. Returns nothing when there is no text.
 */
export function useHint(text: string | undefined, active: () => boolean = () => true) {
  const api = useContext(HintContext);
  return useMemo(() => {
    if (!text || !api) return {};
    const on = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
      if (!active()) return;
      e.stopPropagation();
      api.show(text, e.nativeEvent.clientX, e.nativeEvent.clientY);
    };
    return {
      onPointerOver: on,
      onPointerMove: on,
      onPointerOut: () => api.hide(),
      onClick: (e: ThreeEvent<MouseEvent>) => {
        // A drag to turn the scene is not a tap.
        if (e.delta < 6) on(e);
      },
    };
  }, [text, api, active]);
}

/* ---------- Render on demand ---------- */

/** Call it when something starts to move, so the scene keeps drawing for a few seconds. */
export const WakeContext = createContext<() => void>(() => {});
export const useWake = () => useContext(WakeContext);

/* ---------- Floating labels ---------- */

/** One floating label as the label layer sees it. Tags write the wanted spot; the layer decides what shows. */
export interface LabelEntry {
  el: HTMLDivElement;
  x: number;
  y: number;
  want: boolean;
  w: number;
  h: number;
}
export interface LabelApi {
  add: (e: LabelEntry) => void;
  remove: (e: LabelEntry) => void;
}
export const LabelContext = createContext<LabelApi | null>(null);

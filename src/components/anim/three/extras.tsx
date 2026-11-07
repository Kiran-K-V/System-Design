import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from './blocks';
import { MAX_DT, springStep, useReducedMotion } from './theme';
import { TOON_GRADIENT, inkStrokes, makeInk, useHint, useWake } from './ink';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

const SPHERE = new THREE.SphereGeometry(1, 20, 14);

/**
 * A text label that floats over a point in the scene. It is a plain HTML element, so it stays sharp and readable.
 * `hideBehind` hides it when the point is on the far side of a globe centered at the origin.
 */
export function Tag({ position, text, color, show = true, hideBehind = false }: { position: Vec3; text: string; color?: string; show?: boolean; hideBehind?: boolean }) {
  const obj = useRef<THREE.Object3D>(null);
  const { camera, size, gl } = useThree();
  const el = useMemo(() => document.createElement('div'), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const cam = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    Object.assign(el.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      fontSize: '12px',
      fontWeight: '500',
      lineHeight: '1.2',
      padding: '2px 6px',
      borderRadius: '6px',
      background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
      transition: 'opacity 250ms',
      opacity: '0',
    });
    parent.appendChild(el);
    return () => el.remove();
  }, [el, gl]);

  useEffect(() => {
    el.textContent = text;
    el.style.color = color ?? 'var(--fg)';
  }, [el, text, color]);

  useFrame(() => {
    const o = obj.current;
    if (!o) return;
    o.getWorldPosition(v);
    let visible = show;
    if (hideBehind) {
      cam.copy(camera.position).normalize();
      if (v.clone().normalize().dot(cam) < 0.15) visible = false;
    }
    const p = v.clone().project(camera);
    if (p.z > 1) visible = false;
    const x = (p.x * 0.5 + 0.5) * size.width;
    const y = (-p.y * 0.5 + 0.5) * size.height;
    el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    el.style.opacity = visible ? '1' : '0';
  });

  return <object3D ref={obj} position={position} />;
}

/**
 * A small ball, toon-shaded. It moves to new positions on a spring and fades in and out, so it can be a graph node
 * that travels between steps. `hint` shows a note on hover or tap. `pop` grows it and adds a ring to draw the eye.
 */
export function Dot({ pos, color, r = 0.08, opacity = 1, hint, pop = false }: { pos: Vec3; color: string; r?: number; opacity?: number; hint?: string; pop?: boolean }) {
  const reduced = useReducedMotion();
  const wake = useWake();
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshToonMaterial>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const init = useRef({ pos, opacity, r }).current;
  const st = useRef({ p: pos.map((x) => ({ x, v: 0 })), r: { x: r, v: 0 }, ring: 0 }).current;
  const tint = useMemo(() => new THREE.Color(color), [color]);
  const want = useRef({ pos, opacity, r, pop });
  want.current = { pos, opacity, r, pop };
  useEffect(wake, [pos[0], pos[1], pos[2], opacity, r, color, pop, wake]);
  const active = useCallback(() => (mat.current?.opacity ?? 0) > 0.1, []);
  const handlers = useHint(hint, active);

  useFrame((_, rawDt) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const dt = Math.min(rawDt, MAX_DT);
    const w = want.current;
    const size = w.r * (w.pop ? 1.5 : 1);
    if (reduced) {
      st.p.forEach((s, i) => (s.x = w.pos[i]));
      st.r.x = size;
    } else {
      st.p.forEach((s, i) => springStep(s, w.pos[i], dt));
      springStep(st.r, size, dt, 140, 12);
    }
    g.position.set(st.p[0].x, st.p[1].x, st.p[2].x);
    g.scale.setScalar(Math.max(0.0001, st.r.x));
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    m.opacity += (w.opacity - m.opacity) * k;
    m.color.lerp(tint, k);
    st.ring += ((w.pop ? 1 : 0) - st.ring) * k;
    if (ring.current) {
      ring.current.opacity = st.ring * m.opacity * 0.45;
      ring.current.color.copy(m.color);
    }
    g.visible = m.opacity > 0.01;
  });

  return (
    <group ref={group} position={init.pos} scale={init.r}>
      <mesh geometry={SPHERE} {...handlers}>
        <meshToonMaterial ref={mat} color={color} gradientMap={TOON_GRADIENT} transparent opacity={init.opacity} />
      </mesh>
      {/* Halo that faces the camera, shown when the dot is popped. */}
      <sprite scale={[3.4, 3.4, 1]}>
        <spriteMaterial ref={ring} map={HALO} transparent opacity={0} depthWrite={false} />
      </sprite>
    </group>
  );
}

/** Soft round glow used behind a popped dot. */
const HALO = (() => {
  if (typeof document === 'undefined') return null;
  const n = 64;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(n / 2, n / 2, n * 0.18, n / 2, n / 2, n / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
  return new THREE.CanvasTexture(c);
})();

/**
 * Many straight ink lines drawn in one call: the edges of a graph, or the links between floors.
 * All lines share one color and opacity, which glide when they change. Use several Links for several styles.
 * `sketch` adds the faint off-line second stroke of the hand-drawn look.
 */
export function Links({ segments, color, opacity = 1, width = 1.4, sketch = false }: { segments: [Vec3, Vec3][]; color: string; opacity?: number; width?: number; sketch?: boolean }) {
  const reduced = useReducedMotion();
  const wake = useWake();
  const key = JSON.stringify(segments);
  const geoms = useMemo(() => {
    const flat = segments.flatMap(([a, b]) => [...a, ...b]);
    const raw = new THREE.BufferGeometry();
    raw.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
    const main = new LineSegmentsGeometry().setPositions(flat);
    const extra = sketch ? inkStrokes(raw, 0.03, 0.02, 5) : null;
    raw.dispose();
    return { main, extra };
    // The key holds the segment list by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sketch]);
  const inks = useMemo(() => {
    const main = makeInk(geoms.main, color, width, 0);
    const extra = geoms.extra ? makeInk(geoms.extra, color, 1, 0) : null;
    return { main, extra };
    // Color changes glide in the frame loop instead of rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoms, width]);
  useEffect(
    () => () => {
      inks.main.dispose();
      inks.extra?.dispose();
      geoms.main.dispose();
      geoms.extra?.dispose();
    },
    [inks, geoms],
  );
  const tint = useMemo(() => new THREE.Color(color), [color]);
  useEffect(wake, [key, color, opacity, wake]);

  useFrame((_, rawDt) => {
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(rawDt, MAX_DT) * 6);
    for (const [ink, share] of [[inks.main, 1], [inks.extra, 0.35]] as const) {
      if (!ink) continue;
      ink.material.opacity += (opacity * share - ink.material.opacity) * k;
      ink.material.color.lerp(tint, k);
      ink.line.visible = ink.material.opacity > 0.01;
    }
  });

  if (!segments.length) return null;
  return (
    <>
      <primitive object={inks.main.line} />
      {inks.extra && <primitive object={inks.extra.line} />}
    </>
  );
}

/** Points on a curve that bows upward between a and b (lifted along +y by `lift` at the middle). */
export function liftArc(a: Vec3, b: Vec3, lift: number, n = 40): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const h = Math.sin(Math.PI * t) * lift;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + h, a[2] + (b[2] - a[2]) * t]);
  }
  return out;
}

/** Points on a great-circle path over a sphere of radius r, raised in the middle by `lift` times r. */
export function globeArc(a: Vec3, b: Vec3, r: number, lift: number, n = 48): Vec3[] {
  const va = new THREE.Vector3(...a).normalize();
  const vb = new THREE.Vector3(...b).normalize();
  const angle = va.angleTo(vb);
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = Math.sin(angle) || 1;
    const p = va
      .clone()
      .multiplyScalar(Math.sin((1 - t) * angle) / s)
      .add(vb.clone().multiplyScalar(Math.sin(t * angle) / s))
      .normalize()
      .multiplyScalar(r * (1 + lift * Math.sin(Math.PI * t) * Math.min(1, angle)));
    out.push([p.x, p.y, p.z]);
  }
  return out;
}

/** Latitude and longitude in degrees to a point on a sphere of radius r. */
export function latLon(lat: number, lon: number, r: number): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/**
 * A thick line along `points` that draws itself from start to end.
 * `progress` 0 hides it, 1 shows all of it. It glides between values.
 */
export function Arc({ points, color, progress = 1, opacity = 1, width = 0.03 }: { points: Vec3[]; color: string; progress?: number; opacity?: number; width?: number }) {
  const reduced = useReducedMotion();
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, Math.max(16, points.length), width, 6, false);
  }, [points, width]);
  useEffect(() => () => geom.dispose(), [geom]);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const shown = useRef(0);
  const wake = useWake();
  useEffect(wake, [progress, opacity, geom, wake]);
  const total = geom.index ? geom.index.count : 0;
  const ring = 6 * 6; // index entries per tube segment (6 radial sides x 6)

  useFrame((_, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(dt, MAX_DT) * 3.5);
    shown.current += (progress - shown.current) * k;
    const count = Math.floor((total * Math.max(0, Math.min(1, shown.current))) / ring) * ring;
    geom.setDrawRange(0, count);
    if (mat.current) mat.current.opacity += (opacity - mat.current.opacity) * k;
  });

  return (
    <mesh geometry={geom}>
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0} />
    </mesh>
  );
}

/** A see-through globe with latitude and longitude lines. Its fill hides lines on the far side. */
export function Globe({ r, line, fill }: { r: number; line: string; fill: string }) {
  const grid = useMemo(() => {
    const pts: number[] = [];
    const seg = 64;
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < seg; i++) {
        const a = latLon(lat, (i / seg) * 360 - 180, r * 1.003);
        const b = latLon(lat, ((i + 1) / seg) * 360 - 180, r * 1.003);
        pts.push(...a, ...b);
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < seg; i++) {
        const a = latLon((i / seg) * 180 - 90, lon, r * 1.003);
        const b = latLon(((i + 1) / seg) * 180 - 90, lon, r * 1.003);
        pts.push(...a, ...b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [r]);
  useEffect(() => () => grid.dispose(), [grid]);

  return (
    <group>
      <mesh geometry={SPHERE} scale={[r, r, r]}>
        <meshBasicMaterial color={fill} transparent opacity={0.92} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color={line} transparent opacity={0.28} />
      </lineSegments>
    </group>
  );
}

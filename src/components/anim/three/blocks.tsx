import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAX_DT, springStep, useReducedMotion } from './theme';
import { TOON_GRADIENT, makeInk, newBoxStroke, setBoxStrokes, useHint, useWake } from './ink';

const BOX = new THREE.BoxGeometry(1, 1, 1);

export type Vec3 = [number, number, number];

export interface CubeTarget {
  pos: Vec3;
  size: Vec3;
  color: string;
  /** Fill opacity, 0 to 1. */
  face: number;
  /** Outline opacity, 0 to 1. */
  edge: number;
  edgeColor: string;
  /** Short note shown when the reader hovers or taps the box. */
  hint?: string;
  /** Draws the eye: the box lifts a little and its outline turns bold. */
  pop?: boolean;
}

type Spring = { x: number; v: number };
const springs = (v: Vec3): Spring[] => v.map((x) => ({ x, v: 0 }));

/**
 * One box that moves to its target on a spring. Pass the target for the current step and it moves, resizes, and fades.
 * The fill is toon-shaded and the outline is a hand-drawn ink stroke, to match the sketch diagrams.
 */
export function Cube(t: CubeTarget) {
  const reduced = useReducedMotion();
  const wake = useWake();
  const group = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.MeshToonMaterial>(null);
  const init = useRef(t).current;
  const st = useRef({ pos: springs(t.pos), size: springs(t.size), hover: 0 }).current;
  const color = useMemo(() => new THREE.Color(t.color), [t.color]);
  const edgeColor = useMemo(() => new THREE.Color(t.edgeColor), [t.edgeColor]);
  // Ink outlines live outside the scaled group, so their corner ticks stay the same size on any box.
  const { stroke, sketch } = useMemo(() => ({ stroke: makeInk(newBoxStroke(), init.edgeColor, 1.6, init.edge), sketch: makeInk(newBoxStroke(), init.edgeColor, 1, init.edge * 0.35) }), [init]);
  useEffect(
    () => () => {
      for (const i of [stroke, sketch]) {
        i.dispose();
        i.line.geometry.dispose();
      }
    },
    [stroke, sketch],
  );
  const inkGroup = useRef<THREE.Group>(null);
  const drawnSize = useRef<Vec3>([-1, -1, -1]);
  const target = useRef(t);
  target.current = t;
  const hovered = useRef(false);

  // A new target means motion, so the scene must keep drawing.
  useEffect(wake, [t.pos, t.size, t.color, t.face, t.edge, t.pop, wake]);

  const active = useCallback(() => (faceMat.current?.opacity ?? 0) > 0.05, []);
  const hint = useHint(t.hint, active);
  const handlers = t.hint
    ? {
        ...hint,
        onPointerOver: (e: Parameters<NonNullable<typeof hint.onPointerOver>>[0]) => {
          hovered.current = active();
          wake();
          hint.onPointerOver?.(e);
        },
        onPointerOut: () => {
          hovered.current = false;
          wake();
          hint.onPointerOut?.();
        },
      }
    : {};

  useFrame((_, rawDt) => {
    const g = group.current;
    const f = faceMat.current;
    if (!g || !f) return;
    const dt = Math.min(rawDt, MAX_DT);
    const now = target.current;
    const lift = now.pop ? 0.12 : 0;
    const want = [now.pos[0], now.pos[1] + lift, now.pos[2]];
    for (let i = 0; i < 3; i++) {
      if (reduced) {
        st.pos[i].x = want[i];
        st.size[i].x = now.size[i];
      } else {
        springStep(st.pos[i], want[i], dt);
        springStep(st.size[i], now.size[i], dt);
      }
    }
    g.position.set(st.pos[0].x, st.pos[1].x, st.pos[2].x);
    g.scale.set(st.size[0].x, st.size[1].x, st.size[2].x);
    inkGroup.current?.position.copy(g.position);
    const [sx, sy, sz] = [st.size[0].x, st.size[1].x, st.size[2].x];
    const d = drawnSize.current;
    if (Math.abs(d[0] - sx) + Math.abs(d[1] - sy) + Math.abs(d[2] - sz) > 1e-4) {
      setBoxStrokes(stroke.line.geometry, sx, sy, sz, 0.07, 0);
      setBoxStrokes(sketch.line.geometry, sx, sy, sz, 0.11, 0.022);
      drawnSize.current = [sx, sy, sz];
    }

    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    st.hover += ((hovered.current ? 1 : 0) - st.hover) * k;
    const bold = Math.max(now.pop ? 1 : 0, st.hover);
    f.color.lerp(color, k);
    f.opacity += (now.face + bold * 0.12 * Math.sign(now.face) - f.opacity) * k;
    stroke.material.color.lerp(edgeColor, k);
    sketch.material.color.lerp(edgeColor, k);
    const edge = now.edge > 0 ? Math.min(1, now.edge + bold * 0.4) : 0;
    stroke.material.opacity += (edge - stroke.material.opacity) * k;
    sketch.material.opacity += (edge * 0.35 - sketch.material.opacity) * k;
    stroke.material.linewidth = 1.6 + bold * 1.2;
    g.visible = f.opacity > 0.01;
    if (inkGroup.current) inkGroup.current.visible = stroke.material.opacity > 0.01;
  });

  return (
    <>
      <group ref={group} position={init.pos} scale={init.size}>
        <mesh geometry={BOX} {...handlers}>
          <meshToonMaterial ref={faceMat} color={init.color} gradientMap={TOON_GRADIENT} transparent opacity={init.face} depthWrite={false} />
        </mesh>
      </group>
      <group ref={inkGroup} position={init.pos}>
        <primitive object={stroke.line} />
        <primitive object={sketch.line} />
      </group>
    </>
  );
}

export interface GridCell {
  x: number;
  y: number;
  z: number;
  color: string;
  /** Height as a multiple of the shared size. The cell grows up from y, so bars of different heights share a floor. */
  h?: number;
}

/**
 * Many equal boxes drawn in one call. Use it when a scene has hundreds of cells.
 * Remount it (change its key) when the cell list changes. It fades in on mount.
 */
export function CellField({ cells, size, opacity }: { cells: GridCell[]; size: Vec3; opacity: number }) {
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshToonMaterial>(null);
  const born = useRef(0);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    cells.forEach((cell, i) => {
      const h = cell.h ?? 1;
      dummy.position.set(cell.x, cell.h === undefined ? cell.y : cell.y + (size[1] * h) / 2, cell.z);
      dummy.scale.set(size[0], size[1] * Math.max(h, 0.001), size[2]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, c.set(cell.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cells, size]);

  const wake = useWake();
  useEffect(wake, [cells, wake]);

  useFrame((_, dt) => {
    if (!mat.current) return;
    born.current = reduced ? 1 : Math.min(1, born.current + Math.min(dt, MAX_DT) * 3);
    mat.current.opacity = opacity * born.current;
  });

  if (!cells.length) return null;
  return (
    <instancedMesh ref={mesh} args={[BOX, undefined, cells.length]} frustumCulled={false}>
      <meshToonMaterial ref={mat} gradientMap={TOON_GRADIENT} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

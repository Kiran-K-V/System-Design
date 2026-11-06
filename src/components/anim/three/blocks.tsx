import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from './theme';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const EDGES = new THREE.EdgesGeometry(BOX);

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
}

/**
 * One box that glides to its target each frame. Pass the target for the current step and it moves, resizes, and fades.
 * The initial values are frozen on first render so React does not snap the box to a new target.
 */
export function Cube(t: CubeTarget) {
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const init = useRef(t).current;
  const color = useMemo(() => new THREE.Color(t.color), [t.color]);
  const edgeColor = useMemo(() => new THREE.Color(t.edgeColor), [t.edgeColor]);
  const target = useRef(t);
  target.current = t;

  useFrame((_, dt) => {
    const g = group.current;
    const f = faceMat.current;
    const e = edgeMat.current;
    if (!g || !f || !e) return;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    const now = target.current;
    g.position.x += (now.pos[0] - g.position.x) * k;
    g.position.y += (now.pos[1] - g.position.y) * k;
    g.position.z += (now.pos[2] - g.position.z) * k;
    g.scale.x += (now.size[0] - g.scale.x) * k;
    g.scale.y += (now.size[1] - g.scale.y) * k;
    g.scale.z += (now.size[2] - g.scale.z) * k;
    f.color.lerp(color, k);
    e.color.lerp(edgeColor, k);
    f.opacity += (now.face - f.opacity) * k;
    e.opacity += (now.edge - e.opacity) * k;
    g.visible = f.opacity > 0.01 || e.opacity > 0.01;
  });

  return (
    <group ref={group} position={init.pos} scale={init.size}>
      <mesh geometry={BOX}>
        <meshBasicMaterial ref={faceMat} color={init.color} transparent opacity={init.face} depthWrite={false} />
      </mesh>
      <lineSegments geometry={EDGES}>
        <lineBasicMaterial ref={edgeMat} color={init.edgeColor} transparent opacity={init.edge} />
      </lineSegments>
    </group>
  );
}

export interface GridCell {
  x: number;
  y: number;
  z: number;
  color: string;
}

/**
 * Many equal boxes drawn in one call. Use it when a scene has hundreds of cells.
 * Remount it (change its key) when the cell list changes. It fades in on mount.
 */
export function CellField({ cells, size, opacity }: { cells: GridCell[]; size: Vec3; opacity: number }) {
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const born = useRef(0);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    cells.forEach((cell, i) => {
      dummy.position.set(cell.x, cell.y, cell.z);
      dummy.scale.set(size[0], size[1], size[2]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, c.set(cell.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cells, size]);

  useFrame((_, dt) => {
    if (!mat.current) return;
    born.current = reduced ? 1 : Math.min(1, born.current + dt * 3);
    mat.current.opacity = opacity * born.current;
  });

  if (!cells.length) return null;
  return (
    <instancedMesh ref={mesh} args={[BOX, undefined, cells.length]} frustumCulled={false}>
      <meshBasicMaterial ref={mat} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

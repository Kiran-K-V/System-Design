import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import { useReducedMotion } from './theme';

export interface LegendItem {
  label: string;
  /** CSS color for the chip dot. Leave out for a plain text note. */
  color?: string;
}

interface Props {
  /** Describes the picture for screen readers. The step caption carries the teaching text. */
  label: string;
  /** How far the camera sits from the middle of the scene. Changing it glides the camera. */
  distance: number;
  legend?: LegendItem[];
  /** Start angle in radians: [tilt down, turn right]. */
  angle?: [number, number];
  children: ReactNode;
}

class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Turns the scene when the reader drags. Sways a little until they do, so the 3D shape shows itself. */
function Rig({ angle, onTouched, children }: { angle: [number, number]; onTouched: () => void; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const reduced = useReducedMotion();
  const st = useRef({ x: angle[0], y: angle[1], vx: 0, vy: 0, down: false, lastX: 0, lastY: 0, touched: false, t: 0 });

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    const s = st.current;
    const down = (e: PointerEvent) => {
      s.down = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
      if (!s.touched) {
        s.touched = true;
        if (group.current) s.y = group.current.rotation.y;
        onTouched();
      }
    };
    const move = (e: PointerEvent) => {
      if (!s.down) return;
      s.vy = (e.clientX - s.lastX) * 0.008;
      s.vx = (e.clientY - s.lastY) * 0.008;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.y += s.vy;
      s.x = Math.max(-1.3, Math.min(1.3, s.x + s.vx));
    };
    const up = (e: PointerEvent) => {
      s.down = false;
      el.style.cursor = 'grab';
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [gl, onTouched]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = st.current;
    if (!s.down && !reduced) {
      s.y += s.vy * 0.9;
      s.vy *= 0.94;
      if (!s.touched) {
        s.t += dt;
        g.rotation.y = angle[1] + Math.sin(s.t * 0.5) * 0.22;
        g.rotation.x = s.x;
        return;
      }
    }
    g.rotation.x = s.x;
    g.rotation.y = s.y;
  });

  return <group ref={group}>{children}</group>;
}

function CameraRig({ distance }: { distance: number }) {
  const reduced = useReducedMotion();
  const size = useThree((s) => s.size);
  // A tall, narrow canvas (a phone) sees less sideways, so the camera backs off.
  const fit = Math.max(1, 1.7 / (size.width / size.height || 1));
  useFrame(({ camera }, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 4);
    camera.position.z += (distance * fit - camera.position.z) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Frame for a 3D scene. Loads only in the browser (the page shows a plain box first),
 * pauses drawing when scrolled away, and shows a text note if the device has no WebGL.
 */
export default function Stage3D({ label, distance, legend, angle = [0.45, -0.55], children }: Props) {
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [touched, setTouched] = useState(false);
  const [inView, setInView] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const note = (text: string) => <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">{text}</div>;

  return (
    <div>
      <div ref={box} role="img" aria-label={label} className="relative h-[300px] w-full overflow-hidden rounded-xl sm:h-[380px]">
        {!ready ? (
          note('Loading the 3D picture')
        ) : !webgl ? (
          note('This device cannot draw the 3D picture. The caption below says the same thing in words.')
        ) : (
          <Guard fallback={note('The 3D picture could not start. The caption below says the same thing in words.')}>
            <Canvas
              camera={{ fov: 35, position: [0, 0, distance], near: 0.1, far: 400 }}
              dpr={[1, 2]}
              frameloop={inView ? 'always' : 'never'}
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }}
            >
              <CameraRig distance={distance} />
              <Rig angle={angle} onTouched={() => setTouched(true)}>
                {children}
              </Rig>
            </Canvas>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute right-3 top-2 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[12px] text-muted transition-opacity duration-500 ${touched ? 'opacity-0' : 'opacity-100'}`}
            >
              Drag to turn
            </span>
          </Guard>
        )}
      </div>
      {legend && legend.length > 0 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5 px-2 text-[13px] text-muted">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              {l.color && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />}
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

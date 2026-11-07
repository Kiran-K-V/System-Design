import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MAX_DT, isCoarse, springStep, usePalette, useReducedMotion } from './theme';
import { HintContext, WakeContext, useWake, type HintApi } from './ink';
import type { Vec3 } from './blocks';

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
  /**
   * Angle for the current step. When it changes, the scene turns there on a spring, even if the reader dragged it.
   * Use it to show the side of the shape that the step is about.
   */
  view?: [number, number];
  /** Point the camera looks at. Changing it moves the camera on a spring, so a step can zoom to one part. */
  focus?: Vec3;
  /** Height of the sketch floor under the scene. Leave out for no floor (a globe, say). */
  ground?: number;
  /** Width of the floor. */
  groundSize?: number;
  children: ReactNode;
}

/** How long the scene keeps drawing after the last change, in ms. */
const AWAKE_MS = 3500;
/** How long the scene sways on its own before it rests, in ms. */
const SWAY_MS = 14000;

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
function Rig({ angle, view, focus = [0, 0, 0], onTouched, children }: { angle: [number, number]; view?: [number, number]; focus?: Vec3; onTouched: () => void; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  // The scene is shifted so the focus point sits at the pivot. Turning then happens around what the step is about.
  const shift = useRef<THREE.Group>(null);
  const fs = useRef(focus.map((x) => ({ x, v: 0 }))).current;
  const [fx, fy, fz] = focus;
  
  const gl = useThree((s) => s.gl);
  const reduced = useReducedMotion();
  const wake = useWake();
  useEffect(wake, [fx, fy, fz, wake]);
  const st = useRef({ x: angle[0], y: angle[1], vx: 0, vy: 0, down: false, lastX: 0, lastY: 0, touched: false, t: 0 });
  // Spring that turns the scene to the step's view. `on` is false while the reader is in control.
  const turn = useRef({ on: false, x: { x: angle[0], v: 0 }, y: { x: angle[1], v: 0 }, tx: angle[0], ty: angle[1] });
  const vx = view?.[0];
  const vy = view?.[1];
  useEffect(() => {
    if (vx === undefined || vy === undefined) return;
    const t = turn.current;
    const s = st.current;
    const g = group.current;
    t.x.x = g ? g.rotation.x : s.x;
    t.y.x = g ? g.rotation.y : s.y;
    // Take the short way round.
    const tau = Math.PI * 2;
    t.tx = vx;
    t.ty = vy + Math.round((t.y.x - vy) / tau) * tau;
    t.on = true;
    s.touched = true;
    s.vx = s.vy = 0;
    wake();
  }, [vx, vy, wake]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    const s = st.current;
    const down = (e: PointerEvent) => {
      s.down = true;
      turn.current.on = false;
      if (group.current) {
        s.x = group.current.rotation.x;
        s.y = group.current.rotation.y;
      }
      wake();
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
      if (!s.touched) {
        s.touched = true;
        onTouched();
      }
    };
    const move = (e: PointerEvent) => {
      if (!s.down) return;
      wake();
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
  }, [gl, onTouched, wake]);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, MAX_DT);
    const want = [fx, fy, fz];
    fs.forEach((f, i) => (reduced ? (f.x = want[i]) : springStep(f, want[i], dt, 30, 11)));
    shift.current?.position.set(-fs[0].x, -fs[1].x, -fs[2].x);
    const s = st.current;
    const t = turn.current;
    if (t.on && !s.down) {
      if (reduced) {
        t.x.x = t.tx;
        t.y.x = t.ty;
      } else {
        springStep(t.x, t.tx, dt, 40, 12);
        springStep(t.y, t.ty, dt, 40, 12);
      }
      g.rotation.x = s.x = t.x.x;
      g.rotation.y = s.y = t.y.x;
      return;
    }
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

  return (
    <group ref={group}>
      <group ref={shift}>{children}</group>
    </group>
  );
}

function CameraRig({ distance }: { distance: number }) {
  const reduced = useReducedMotion();
  const wake = useWake();
  const size = useThree((s) => s.size);
  // A tall, narrow canvas (a phone) sees less sideways, so the camera backs off.
  const fit = Math.max(1, 1.7 / (size.width / size.height || 1));
  const st = useRef({ d: { x: distance * fit, v: 0 } }).current;
  useEffect(wake, [distance, fit, wake]);
  useFrame(({ camera }, dt) => {
    if (reduced) st.d.x = distance * fit;
    // Soft spring with no overshoot, so the camera never seems to bump into its stop.
    else springStep(st.d, distance * fit, dt, 30, 11);
    camera.position.set(0, 0, st.d.x);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Soft light so toon fills show three bands: top faces brightest, sides darker. */
function Lights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[-3, 6, 4]} intensity={2.2} />
    </>
  );
}

/** A dotted paper floor that fades out at its rim, plus a soft dark pool under the scene. Grounds it in space. */
function Ground({ y, size, ink }: { y: number; size: number; ink: string }) {
  const tex = useMemo(() => {
    const n = 512;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d')!;
    // Soft pool of shade in the middle.
    const pool = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    pool.addColorStop(0, 'rgba(0,0,0,0.55)');
    pool.addColorStop(0.45, 'rgba(0,0,0,0.25)');
    pool.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = pool;
    g.fillRect(0, 0, n, n);
    // Dot grid, fading toward the rim.
    const step = n / 24;
    for (let x = step / 2; x < n; x += step) {
      for (let z = step / 2; z < n; z += step) {
        const r = Math.hypot(x - n / 2, z - n / 2) / (n / 2);
        if (r > 1) continue;
        g.fillStyle = `rgba(255,255,255,${(0.5 * (1 - r) ** 1.5).toFixed(3)})`;
        g.beginPath();
        g.arc(x, z, 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={tex} color={ink} transparent depthWrite={false} opacity={0.9} />
    </mesh>
  );
}

/**
 * Draws a frame only when one is needed: for a few seconds after anything changes, while the reader drags,
 * and during the first slow sway. Then the scene rests and costs no battery. Phones draw at 30 frames a second.
 */
function Ticker({ wakeAt, swayUntil }: { wakeAt: React.MutableRefObject<number>; swayUntil: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const minGap = isCoarse() ? 1000 / 30 : 0;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const busy = now - wakeAt.current < AWAKE_MS || now < swayUntil;
      if (busy && now - last >= minGap) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, wakeAt, swayUntil]);
  return null;
}

/**
 * Frame for a 3D scene. Loads only in the browser (the page shows a plain box first),
 * pauses drawing when scrolled away, and shows a text note if the device has no WebGL.
 */
export default function Stage3D({ label, distance, legend, angle = [0.45, -0.55], view, focus, ground, groundSize = 16, children }: Props) {
  const p = usePalette();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const wakeAt = useRef(0);
  const wake = useCallback(() => {
    wakeAt.current = performance.now();
  }, []);
  // Every render of the stage is a step change or a theme change: draw for a while.
  useEffect(wake);
  const swayUntil = useMemo(() => (typeof performance === 'undefined' ? 0 : performance.now() + SWAY_MS), []);

  const tip = useRef<HTMLDivElement>(null);
  const hint = useMemo<HintApi>(
    () => ({
      show: (text, x, y) => {
        const el = tip.current;
        const host = box.current;
        if (!el || !host) return;
        const r = host.getBoundingClientRect();
        el.textContent = text;
        // Keep the label inside the frame: flip it to the left of the cursor near the right edge.
        const left = x - r.left;
        const flip = left > r.width - 220;
        el.style.transform = `translate(${flip ? left - 12 : left + 14}px, ${y - r.top + 14}px) translateX(${flip ? '-100%' : '0'})`;
        el.style.opacity = '1';
        host.querySelector('canvas')?.style.setProperty('cursor', 'help');
      },
      hide: () => {
        if (tip.current) tip.current.style.opacity = '0';
        box.current?.querySelector('canvas')?.style.setProperty('cursor', 'grab');
      },
    }),
    [],
  );
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
              dpr={[1, isCoarse() ? 1.5 : 2]}
              frameloop={inView ? 'demand' : 'never'}
              gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
              style={{ background: 'transparent' }}
              onPointerMissed={hint.hide}
            >
              <WakeContext.Provider value={wake}>
                <HintContext.Provider value={hint}>
                  <Ticker wakeAt={wakeAt} swayUntil={reduced ? 0 : swayUntil} />
                  <Lights />
                  <CameraRig distance={distance} />
                  <Rig angle={angle} view={view} focus={focus} onTouched={() => setTouched(true)}>
                    {ground !== undefined && <Ground y={ground} size={groundSize} ink={p.fg} />}
                    {children}
                  </Rig>
                </HintContext.Provider>
              </WakeContext.Provider>
            </Canvas>
            <div
              ref={tip}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 max-w-[210px] rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[12.5px] leading-snug text-fg opacity-0 shadow-lg transition-opacity duration-150"
            />
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute right-3 top-2 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[12px] text-muted transition-opacity duration-500 ${touched ? 'opacity-0' : 'opacity-100'}`}
            >
              Drag to turn · hover for notes
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

import { useEffect, useState } from 'react';

/** Site colors that 3D scenes need. Read from the CSS variables so light and dark mode both work. */
export interface Palette {
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  accent: string;
  ok: string;
  warn: string;
  bad: string;
}

const FALLBACK: Palette = { bg: '#ffffff', surface: '#faf7f7', fg: '#1a1416', muted: '#6b5f63', accent: '#e11d48', ok: '#16a34a', warn: '#ca8a04', bad: '#ea580c' };

function read(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    bg: pick('--bg', FALLBACK.bg),
    surface: pick('--surface', FALLBACK.surface),
    fg: pick('--fg', FALLBACK.fg),
    muted: pick('--muted', FALLBACK.muted),
    accent: pick('--accent', FALLBACK.accent),
    ok: pick('--ok', FALLBACK.ok),
    warn: pick('--warn', FALLBACK.warn),
    bad: pick('--bad', FALLBACK.bad),
  };
}

/** Current palette. Updates when the reader switches theme. */
export function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(FALLBACK);
  useEffect(() => {
    const update = () => setPalette(read());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);
  return palette;
}

/** True when the reader asked the system for less motion. 3D scenes then jump instead of glide. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Longest frame step any scene animates by. After a pause the clock can jump, and a big step would make springs fly. */
export const MAX_DT = 1 / 30;

/**
 * One step of a damped spring, in place. `s.v` is the speed. Returns true while it still moves.
 * Stiffness 90 and damping 15 settle in about 0.5 s with a small overshoot, which reads as weight, not bounce.
 */
export function springStep(s: { x: number; v: number }, target: number, dt: number, stiffness = 90, damping = 15): boolean {
  const h = Math.min(dt, MAX_DT);
  s.v += (stiffness * (target - s.x) - damping * s.v) * h;
  s.x += s.v * h;
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-3) {
    s.x = target;
    s.v = 0;
    return false;
  }
  return true;
}

/** True on touch-first devices. Scenes draw fewer pixels and frames there to save battery. */
export function isCoarse(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

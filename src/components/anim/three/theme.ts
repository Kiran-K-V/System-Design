import { useEffect, useState } from 'react';

/** Site colors that 3D scenes need. Read from the CSS variables so light and dark mode both work. */
export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  ok: string;
  warn: string;
  bad: string;
}

const FALLBACK: Palette = { bg: '#ffffff', fg: '#1a1416', muted: '#6b5f63', accent: '#e11d48', ok: '#16a34a', warn: '#ca8a04', bad: '#ea580c' };

function read(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    bg: pick('--bg', FALLBACK.bg),
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

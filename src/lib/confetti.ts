/** Small reward burst in the current track accent. Lazy-loaded, silent under prefers-reduced-motion. */
export async function celebrate() {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { default: confetti } = await import('canvas-confetti');
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim() || '#e11d48';
    const ok = css.getPropertyValue('--ok').trim() || '#16a34a';
    const warn = css.getPropertyValue('--warn').trim() || '#ca8a04';
    confetti({
      particleCount: 42,
      spread: 62,
      startVelocity: 28,
      gravity: 1.1,
      ticks: 110,
      scalar: 0.85,
      origin: { x: 0.5, y: 0.7 },
      colors: [accent, accent, ok, warn],
      disableForReducedMotion: true,
    });
  } catch {}
}

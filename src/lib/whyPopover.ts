/**
 * Place each ".vwhy-pop" popover under its "?" button. Popovers open in the top layer,
 * so they need fixed coordinates; the browser handles open, close, Esc and outside clicks.
 */
export function placeWhyPopovers() {
  document.querySelectorAll<HTMLElement>('.vwhy-pop').forEach((pop) => {
    if (pop.dataset.wired) return;
    pop.dataset.wired = '1';
    pop.addEventListener('toggle', (e) => {
      if ((e as ToggleEvent).newState !== 'open') return;
      const btn = document.querySelector<HTMLElement>(`[popovertarget="${pop.id}"]`);
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
      const below = r.bottom + 8;
      const top = below + h > innerHeight - 12 ? Math.max(12, r.top - h - 8) : below;
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
      // Fixed coordinates go stale when the page moves, so close on the first scroll.
      addEventListener('scroll', () => pop.hidePopover(), { once: true, passive: true, capture: true });
    });
  });
}

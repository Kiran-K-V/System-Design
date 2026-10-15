/**
 * Run `fn` on first load and after every client-router navigation.
 * Bundled module scripts execute only once, so DOM work must hang off `astro:page-load`.
 * `fn` must be safe to run twice (a script that loads late runs it once now and once on the next event).
 */
export function onPage(fn: () => void) {
  document.addEventListener('astro:page-load', fn);
  if (document.readyState !== 'loading') fn();
}

/** Mark an element as wired. Returns false when it already was, so handlers bind once per DOM node. */
const wired = new WeakSet<Element>();
export function once(el: Element | null): el is Element {
  if (!el || wired.has(el)) return false;
  wired.add(el);
  return true;
}

/** Valid CSS identifier from a lesson id, for `transition:name`. */
export const tslug = (id: string) => id.replace(/[^a-z0-9]+/gi, '-');

import { once } from './page';
import { formPattern } from './termPattern';

/** Card data for one term, serialized by LessonPage into #term-data. */
export interface TermCardData {
  term: string;
  forms: string[];
  level: string;
  def: string;
  href?: string;
  ref?: string;
}

const GUTTER = 16;
const GAP = 8;
let active: HTMLElement | null = null;
let pinned = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const card = () => document.getElementById('term-card');
const data = (): Record<string, TermCardData> => {
  try {
    return JSON.parse(document.getElementById('term-data')?.textContent ?? '{}');
  } catch {
    return {};
  }
};

function place(term: HTMLElement, el: HTMLElement) {
  const r = term.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const left = Math.min(Math.max(GUTTER, r.left + r.width / 2 - w / 2), innerWidth - GUTTER - w);
  const below = r.bottom + GAP + h <= innerHeight - GUTTER || r.top - GAP - h < GUTTER;
  el.style.left = `${left}px`;
  el.style.top = `${below ? r.bottom + GAP : r.top - GAP - h}px`;
}

function show(term: HTMLElement, pin: boolean) {
  clearTimeout(timer);
  const el = card();
  const d = data()[term.dataset.term ?? ''];
  if (!el || !d) return;
  if (active && active !== term) active.setAttribute('aria-expanded', 'false');
  active = term;
  pinned = pin;
  el.querySelector('[data-f=term]')!.textContent = d.term;
  el.querySelector('[data-f=level]')!.textContent = d.level;
  el.querySelector('[data-f=def]')!.textContent = d.def;
  const link = el.querySelector<HTMLAnchorElement>('[data-f=link]')!;
  link.hidden = !d.href;
  if (d.href) {
    link.href = d.href;
    link.querySelector('[data-f=ref]')!.textContent = d.ref ?? '';
  }
  el.hidden = false;
  place(term, el);
  el.dataset.open = '';
  term.setAttribute('aria-expanded', 'true');
}

function hide() {
  clearTimeout(timer);
  const el = card();
  if (el) {
    el.hidden = true;
    delete el.dataset.open;
  }
  active?.setAttribute('aria-expanded', 'false');
  active = null;
  pinned = false;
}

const later = (fn: () => void, ms: number) => {
  clearTimeout(timer);
  timer = setTimeout(fn, ms);
};

// Text inside these is never marked: code, links, headings, and interactive islands.
const SKIP = 'a, code, pre, kbd, button, script, style, h1, h2, h3, h4, h5, h6, svg, .katex, astro-island, figure';

/** Wrap the first use of each term in the lesson body with `<button class="term">`. Runs once per article. */
function markTerms(root: HTMLElement, terms: Record<string, TermCardData>) {
  if (root.dataset.termsMarked !== undefined) return;
  root.dataset.termsMarked = '';
  // Longest form first, so "write-ahead log" wins over a shorter form at the same position.
  const patterns = Object.entries(terms)
    .flatMap(([id, d]) => d.forms.map((f) => ({ id, re: formPattern(f), len: f.length })))
    .sort((a, b) => b.len - a.len);
  const seen = new Set<string>();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (let node of nodes) {
    for (;;) {
      let best: { id: string; index: number; len: number } | undefined;
      for (const { id, re } of patterns) {
        if (seen.has(id)) continue;
        re.lastIndex = 0;
        const m = re.exec(node.data);
        if (m && (!best || m.index < best.index)) best = { id, index: m.index, len: m[0].length };
      }
      if (!best) break;
      seen.add(best.id);
      const hit = node.splitText(best.index);
      node = hit.splitText(best.len);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'term';
      btn.dataset.term = best.id;
      hit.replaceWith(btn);
      btn.append(hit);
    }
  }
}

/** Mark terms and wire every `.term` button on the page. Safe to call on each page load. */
export function initTermCards() {
  hide();
  const root = document.querySelector<HTMLElement>('article .prose');
  if (root) markTerms(root, data());
  const el = card();
  if (once(el)) {
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', () => !pinned && later(hide, 150));
  }
  for (const term of document.querySelectorAll<HTMLElement>('button.term')) {
    if (!once(term)) continue;
    term.setAttribute('aria-expanded', 'false');
    term.setAttribute('aria-describedby', 'term-card-def');
    term.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && !pinned) later(() => show(term, false), 120);
    });
    term.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !pinned) later(hide, 150);
    });
    term.addEventListener('focus', () => !pinned && show(term, false));
    term.addEventListener('blur', (e) => {
      if (!pinned && !card()?.contains(e.relatedTarget as Node)) later(hide, 100);
    });
    term.addEventListener('click', () => (active === term && pinned ? hide() : show(term, true)));
  }
}

// Document-level listeners bind once for the whole session.
document.addEventListener('pointerdown', (e) => {
  const t = e.target as Element;
  if (active && !t.closest('button.term, #term-card')) hide();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && active) {
    const term = active;
    const inCard = card()?.contains(document.activeElement);
    hide();
    // Return focus from the card link; the focus handler must not reopen the card.
    if (inCard) {
      pinned = true;
      term.focus({ preventScroll: true });
      pinned = false;
    }
  }
});
addEventListener('scroll', () => active && place(active, card()!), { passive: true });
addEventListener('resize', () => active && place(active, card()!));

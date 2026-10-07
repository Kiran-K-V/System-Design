import { useState } from 'react';

/**
 * Live simulator: two clients page through the same feed.
 * One uses offset, one uses a cursor. You change the list between pages.
 * All logic is plain functions on a small state object. No randomness.
 */

const START_COUNT = 20;
const LIMIT_OPTIONS = [3, 4, 5, 6];

interface State {
  list: number[]; // newest first
  nextId: number;
  limit: number;
  offsetPages: number[][];
  cursorPages: number[][];
}

const initial = (limit: number): State => ({
  list: Array.from({ length: START_COUNT }, (_, i) => START_COUNT - i),
  nextId: START_COUNT + 1,
  limit,
  offsetPages: [],
  cursorPages: [],
});

const flat = (pages: number[][]) => pages.flat();

function stats(pages: number[][], list: number[]) {
  const all = flat(pages);
  const seen = new Set<number>();
  let dupes = 0;
  for (const id of all) {
    if (seen.has(id)) dupes++;
    seen.add(id);
  }
  const hi = Math.max(0, ...all);
  const lo = Math.min(...all, Infinity);
  const missed = list.filter((id) => id < hi && id > lo && !seen.has(id));
  return { dupes, missed };
}

function Chip({ id, tone }: { id: number; tone?: 'bad' | 'new' | 'dim' }) {
  const color = tone === 'bad' ? 'var(--bad)' : tone === 'new' ? 'var(--ok)' : 'var(--border)';
  return (
    <span
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1 text-xs font-mono tabular-nums"
      style={{
        borderColor: tone === 'dim' ? 'var(--border)' : color === 'var(--border)' ? 'var(--node-stroke)' : color,
        borderWidth: tone === 'bad' ? 2 : 1,
        color: tone === 'bad' ? 'var(--bad)' : undefined,
        background: tone === 'new' ? 'color-mix(in srgb, var(--ok) 14%, transparent)' : undefined,
      }}
    >
      {id}
    </span>
  );
}

function Received({ title, pages, list, startLimit }: { title: string; pages: number[][]; list: number[]; startLimit: number }) {
  const { dupes, missed } = stats(pages, list);
  const seen = new Set<number>();
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{title}</span>
        <span className="text-xs tabular-nums">
          <span style={{ color: dupes ? 'var(--bad)' : 'var(--muted)' }}>duplicates: {dupes}</span>
          <span className="mx-2 text-muted">·</span>
          <span style={{ color: missed.length ? 'var(--bad)' : 'var(--muted)' }}>missed: {missed.length}</span>
        </span>
      </div>
      <div className="mt-2 min-h-[2.25rem] space-y-1.5">
        {pages.length === 0 && <span className="text-xs text-muted">Nothing fetched yet. Page size {startLimit}.</span>}
        {pages.map((p, pi) => (
          <div key={pi} className="flex flex-wrap items-center gap-1">
            <span className="mr-1 w-12 text-xs text-muted">page {pi + 1}</span>
            {p.map((id, k) => {
              const dup = seen.has(id);
              seen.add(id);
              return <Chip key={`${pi}-${k}`} id={id} tone={dup ? 'bad' : undefined} />;
            })}
          </div>
        ))}
      </div>
      {missed.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: 'var(--bad)' }}>
          Never shown to this client: {missed.map((m) => `post ${m}`).join(', ')}
        </p>
      )}
    </div>
  );
}

export default function PaginationSim() {
  const [s, setS] = useState<State>(() => initial(4));
  const [last, setLast] = useState<string>('');

  const fetchNext = () =>
    setS((cur) => {
      const off = cur.offsetPages.length * cur.limit;
      const offsetPage = cur.list.slice(off, off + cur.limit);
      const cursor = cur.cursorPages.length ? cur.cursorPages[cur.cursorPages.length - 1].slice(-1)[0] : Infinity;
      const cursorPage = cur.list.filter((id) => id < cursor).slice(0, cur.limit);
      if (!offsetPage.length && !cursorPage.length) return cur;
      return {
        ...cur,
        offsetPages: offsetPage.length ? [...cur.offsetPages, offsetPage] : cur.offsetPages,
        cursorPages: cursorPage.length ? [...cur.cursorPages, cursorPage] : cur.cursorPages,
      };
    });

  const addPost = () => {
    setS((cur) => ({ ...cur, list: [cur.nextId, ...cur.list], nextId: cur.nextId + 1 }));
    setLast('A new post went to the top. Every old post moved down one slot.');
  };

  const deletePost = () => {
    setS((cur) => {
      const seen = new Set(flat(cur.offsetPages));
      const target = cur.list.find((id) => seen.has(id));
      if (target === undefined) return cur;
      return { ...cur, list: cur.list.filter((id) => id !== target) };
    });
    setLast('The newest post that the clients already read was deleted. Posts below it moved up one slot.');
  };

  const nextOffset = s.offsetPages.length * s.limit;
  const cursor = s.cursorPages.length ? s.cursorPages[s.cursorPages.length - 1].slice(-1)[0] : null;
  const seenOffset = new Set(flat(s.offsetPages));
  const seenCursor = new Set(flat(s.cursorPages));

  const btn = 'h-8 rounded-md border border-line px-3 text-sm hover:bg-surface disabled:opacity-40';

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <span className="text-sm font-medium">Paging simulator</span>
        <span className="text-xs text-muted">Interactive</span>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={fetchNext} className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90">
            Fetch next page
          </button>
          <button type="button" onClick={addPost} className={btn}>
            New post arrives
          </button>
          <button type="button" onClick={deletePost} className={btn} disabled={seenOffset.size === 0}>
            Delete a post already read
          </button>
          <button
            type="button"
            onClick={() => {
              setS(initial(s.limit));
              setLast('');
            }}
            className={btn}
          >
            Reset
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            Page size
            <select
              value={s.limit}
              onChange={(e) => {
                setS(initial(+e.target.value));
                setLast('');
              }}
              className="h-8 rounded-md border border-line bg-bg px-2 text-sm"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="mb-1 text-xs text-muted">Server list, newest first (green = created after you started)</div>
          <div className="flex flex-wrap gap-1">
            {s.list.map((id) => (
              <Chip key={id} id={id} tone={id > START_COUNT ? 'new' : seenOffset.has(id) || seenCursor.has(id) ? undefined : 'dim'} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 font-mono text-xs text-muted">GET /posts?offset={nextOffset}&amp;limit={s.limit}</div>
            <Received title="Offset client" pages={s.offsetPages} list={s.list} startLimit={s.limit} />
          </div>
          <div>
            <div className="mb-1 font-mono text-xs text-muted">GET /posts?after={cursor ?? '(none)'}&amp;limit={s.limit}</div>
            <Received title="Cursor client" pages={s.cursorPages} list={s.list} startLimit={s.limit} />
          </div>
        </div>
      </div>
      <figcaption aria-live="polite" className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        {last || 'Fetch page 1. Then add a new post, and fetch page 2. Then delete a post and fetch page 3. The offset client repeats one post and skips another. The cursor client does not.'}
      </figcaption>
    </figure>
  );
}

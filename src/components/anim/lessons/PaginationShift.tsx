import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/**
 * Scripted run: the same feed paged by offset and by cursor while the list changes.
 * Everything is computed from the step index, so it is a pure function of the step.
 */

const PAGE = 4;
const START = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

type Event =
  | { kind: 'init' }
  | { kind: 'fetch' }
  | { kind: 'insert'; id: number }
  | { kind: 'delete'; id: number }
  | { kind: 'end' };

const EVENTS: Event[] = [
  { kind: 'init' },
  { kind: 'fetch' },
  { kind: 'insert', id: 13 },
  { kind: 'fetch' },
  { kind: 'delete', id: 10 },
  { kind: 'fetch' },
  { kind: 'end' },
];

const CAPTIONS = [
  'A feed of 12 posts, newest first. A client reads it 4 posts at a time. We run two clients on the same data. One pages by offset ("skip N posts"). One pages by cursor ("posts older than the last one I saw").',
  'Page 1. Offset client asks offset=0, limit=4. Cursor client asks for the first 4. Both get 12, 11, 10, 9. The cursor client also gets a cursor: the id of the last post it saw, 9.',
  'A new post, 13, arrives at the top. Every old post moves down one slot. Position numbers changed. Post ids did not.',
  'Page 2. Offset client asks offset=4. Slot 4 now holds post 9, so it gets 9 again: a duplicate. Cursor client asks "older than 9" and gets 8, 7, 6, 5. No duplicate.',
  'Someone deletes post 10, which both clients already read. Every post below it moves up one slot.',
  'Page 3. Offset client asks offset=8. After the delete, slot 8 holds post 4, so post 5 was never shown: a skip. Cursor client asks "older than 5" and gets 4, 3, 2, 1.',
  'Result. Offset: 12 11 10 9 | 9 8 7 6 | 4 3 2 1. It shows 9 twice and misses 5. Cursor: 12 11 10 9 | 8 7 6 5 | 4 3 2 1. Every post exactly once. The offset is a position, and positions move. The cursor is a value, and values do not.',
];

interface State {
  list: number[];
  offsetPages: number[][];
  cursorPages: number[][];
  inserted: number | null;
  deleted: number | null;
}

function simulate(upTo: number): State {
  let list = [...START];
  const offsetPages: number[][] = [];
  const cursorPages: number[][] = [];
  let inserted: number | null = null;
  let deleted: number | null = null;
  let cursor = Infinity;
  for (let i = 1; i <= upTo; i++) {
    const e = EVENTS[i];
    if (e.kind === 'insert') {
      list = [e.id, ...list];
      inserted = e.id;
      deleted = null;
    } else if (e.kind === 'delete') {
      list = list.filter((x) => x !== e.id);
      deleted = e.id;
      inserted = null;
    } else if (e.kind === 'fetch') {
      offsetPages.push(list.slice(offsetPages.length * PAGE, offsetPages.length * PAGE + PAGE));
      const page = list.filter((x) => x < cursor).slice(0, PAGE);
      cursorPages.push(page);
      cursor = page[page.length - 1];
      inserted = null;
      deleted = null;
    }
  }
  return { list, offsetPages, cursorPages, inserted, deleted };
}

const CELL = 36;
const X0 = 176;

function Cell({ cx, cy, id, tone, seed, ghost }: { cx: number; cy: number; id: number; tone?: 'ok' | 'bad' | 'hl'; seed: string; ghost?: boolean }) {
  const stroke = tone === 'bad' ? 'var(--bad)' : tone === 'ok' ? 'var(--ok)' : ghost ? 'var(--bad)' : 'var(--fg)';
  return (
    <g>
      {tone === 'hl' && <rect x={cx - CELL / 2 + 2} y={cy - CELL / 2 + 2} width={CELL - 4} height={CELL - 4} rx={5} fill="var(--accent-soft)" />}
      <SketchBox cx={cx} cy={cy} w={CELL - 4} h={CELL - 4} r={5} seed={seedOf(seed)} stroke={stroke} dashed={ghost} strokeWidth={tone === 'bad' ? 2.2 : 1.4} />
      <HandText x={cx} y={cy + 1} size={15} color={ghost ? 'var(--bad)' : undefined} weight={tone === 'bad' ? 700 : 400}>
        {String(id)}
      </HandText>
    </g>
  );
}

function Panel({
  top,
  title,
  query,
  pages,
  list,
  inserted,
  deleted,
  step,
  final,
}: {
  top: number;
  title: string;
  query: string;
  pages: number[][];
  list: number[];
  inserted: number | null;
  deleted: number | null;
  step: number;
  final: boolean;
}) {
  const last = pages.length ? pages[pages.length - 1] : [];
  const seen = new Set<number>();
  const dupes = new Set<number>();
  pages.forEach((p, pi) =>
    p.forEach((id) => {
      if (seen.has(id)) dupes.add(id * 100 + pi);
      seen.add(id);
    }),
  );
  const maxSeen = Math.max(0, ...seen);
  const minSeen = Math.min(...seen, 99);
  const missed = final ? START.filter((id) => id < maxSeen && id > minSeen && !seen.has(id) && list.includes(id)) : [];
  const flat: { id: number; page: number; dup: boolean }[] = [];
  pages.forEach((p, pi) => p.forEach((id) => flat.push({ id, page: pi, dup: dupes.has(id * 100 + pi) })));

  return (
    <g>
      <HandText x={12} y={top + 36} size={20} anchor="start" weight={700}>
        {title}
      </HandText>
      <HandText x={12} y={top + 60} size={13} anchor="start" mono color="var(--muted)">
        {query}
      </HandText>
      <HandText x={12} y={top + 90} size={13} anchor="start" color="var(--muted)">
        server list
      </HandText>
      {list.map((id, k) => (
        <Cell
          key={id}
          cx={X0 + k * CELL + CELL / 2}
          cy={top + 90}
          id={id}
          seed={`${title}s${id}`}
          tone={id === inserted ? 'ok' : last.includes(id) && step % 2 === 1 ? 'hl' : undefined}
        />
      ))}
      {deleted !== null && (
        <g>
          <HandText x={X0 + 6 * CELL} y={top + 128} size={13} color="var(--bad)">
            {`post ${deleted} deleted`}
          </HandText>
        </g>
      )}
      <HandText x={12} y={top + 150} size={13} anchor="start" color="var(--muted)">
        client received
      </HandText>
      {flat.map((c, k) => (
        <Cell
          key={`${c.page}-${c.id}`}
          cx={X0 + (k + c.page * 0.4) * CELL + CELL / 2}
          cy={top + 150}
          id={c.id}
          seed={`${title}r${c.page}${c.id}`}
          tone={c.dup ? 'bad' : undefined}
        />
      ))}
      {flat.map(
        (c, k) =>
          c.dup && (
            <HandText key={`d${k}`} x={X0 + (k + c.page * 0.4) * CELL + CELL / 2} y={top + 178} size={13} color="var(--bad)">
              duplicate
            </HandText>
          ),
      )}
      {missed.map((id) => (
        <HandText key={id} x={X0 + (flat.length + 2.4) * CELL} y={top + 150} size={14} anchor="start" color="var(--bad)">
          {`never saw post ${id}`}
        </HandText>
      ))}
      {final && missed.length === 0 && dupes.size === 0 && (
        <HandText x={X0 + (flat.length + 1.6) * CELL} y={top + 150} size={14} anchor="start" color="var(--ok)">
          each post once
        </HandText>
      )}
    </g>
  );
}

export default function PaginationShift() {
  return (
    <AnimFrame title="Offset vs cursor while the list changes" steps={CAPTIONS.map((caption) => ({ caption }))} interval={3200}>
      {(i) => {
        const s = simulate(i);
        const fetchStep = EVENTS[i].kind === 'fetch';
        const final = EVENTS[i].kind === 'end';
        const nextOffset = s.offsetPages.length * PAGE;
        const lastCursor = s.cursorPages.length ? s.cursorPages[s.cursorPages.length - 1].slice(-1)[0] : null;
        return (
          <SketchSvg width={900} height={420} label="Two clients page through a changing feed, one by offset and one by cursor">
            <Panel
              top={0}
              title="Offset"
              query={fetchStep ? `?offset=${nextOffset - PAGE}&limit=${PAGE}` : `next: ?offset=${nextOffset}`}
              pages={s.offsetPages}
              list={s.list}
              inserted={s.inserted}
              deleted={s.deleted}
              step={fetchStep ? 1 : 0}
              final={final}
            />
            <Panel
              top={212}
              title="Cursor"
              query={fetchStep ? `?after=${s.cursorPages.length > 1 ? s.cursorPages[s.cursorPages.length - 2].slice(-1)[0] : 'none'}&limit=${PAGE}` : `next: ?after=${lastCursor ?? 'none'}`}
              pages={s.cursorPages}
              list={s.list}
              inserted={s.inserted}
              deleted={s.deleted}
              step={fetchStep ? 1 : 0}
              final={final}
            />
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import { useMemo, useState } from 'react';
import { HandText, SketchEllipse, SketchSvg, seedOf } from './sketch';
import { RING, buildRing, hash32, keyName, ownerOf, type VNode } from './ringMath';

/** Distinct server colors. Every server also has a letter, so color is never the only signal. */
export const NODE_COLORS = [
  'var(--accent)',
  'var(--ok)',
  'var(--warn)',
  'color-mix(in srgb, var(--accent) 45%, var(--bad))',
  'var(--badge)',
  'var(--bad)',
];

export interface RingKeyView {
  pos: number;
  label?: string;
  /** Drawn bigger with a dark outline: this key just changed owner. */
  moved?: boolean;
  /** Draw an arrow from this key clockwise to its owner. */
  focus?: boolean;
}

export interface RingPointView {
  node: string;
  pos: number;
}

interface ViewProps {
  points: RingPointView[];
  /** Color for each node id. */
  colors: Record<string, string>;
  /** Letter drawn next to each node id. */
  letters?: Record<string, string>;
  keys?: RingKeyView[];
  /** Draw each node's arc in its color. */
  arcs?: boolean;
  /** Draw a letter on each ring point. Turn off when a node has many virtual points. */
  pointLabels?: boolean;
  /** Dim the arcs of these nodes (a crashed server). */
  dead?: string[];
  label?: string;
}

const W = 460;
const C = W / 2;
const R = 170;
const r1 = (n: number) => Math.round(n * 10) / 10;
const at = (pos: number, radius = R): [number, number] => {
  const a = (pos / RING) * Math.PI * 2 - Math.PI / 2;
  return [r1(C + radius * Math.cos(a)), r1(C + radius * Math.sin(a))];
};

function arcPath(from: number, to: number, radius = R) {
  const [x1, y1] = at(from, radius);
  const [x2, y2] = at(to, radius);
  const span = (to - from + RING) % RING;
  return `M${x1} ${y1} A${radius} ${radius} 0 ${span > RING / 2 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Pure drawing of a hash ring. The interactive widget and the walkthrough both use it. */
export function HashRingView({ points, colors, letters = {}, keys = [], arcs = true, pointLabels = true, dead = [], label }: ViewProps) {
  const ring = useMemo<VNode[]>(() => [...points].sort((a, b) => a.pos - b.pos), [points]);
  const ownerOfPos = (pos: number) => ownerOf(ring, pos);

  return (
    <SketchSvg width={W} height={W} label={label ?? 'A hash ring with servers and keys'}>
      <SketchEllipse cx={C} cy={C} w={R * 2 + 26} h={R * 2 + 26} seed={seedOf('ring-outer')} stroke="var(--muted)" strokeWidth={1} />
      <SketchEllipse cx={C} cy={C} w={R * 2 - 26} h={R * 2 - 26} seed={seedOf('ring-inner')} stroke="var(--muted)" strokeWidth={1} />

      {arcs && ring.length > 1 &&
        ring.map((p, i) => {
          const prev = ring[(i - 1 + ring.length) % ring.length];
          const isDead = dead.includes(p.node);
          return (
            <path
              key={`arc-${i}`}
              d={arcPath(prev.pos, p.pos)}
              stroke={colors[p.node]}
              strokeWidth={11}
              strokeLinecap="butt"
              fill="none"
              opacity={isDead ? 0.12 : 0.42}
            />
          );
        })}
      {arcs && ring.length === 1 && <circle cx={C} cy={C} r={R} stroke={colors[ring[0].node]} strokeWidth={11} fill="none" opacity={0.42} />}

      <HandText x={C} y={C - 12} size={16} color="var(--muted)">
        hash ring
      </HandText>
      <HandText x={C} y={C + 10} size={13} color="var(--muted)">
        positions 0 to 2³²−1, clockwise
      </HandText>

      {keys.map((k, i) => {
        if (!k.focus) return null;
        const owner = ownerOfPos(k.pos);
        const end = ring.find((p) => p.node === owner && p.pos >= k.pos)?.pos ?? ring.find((p) => p.node === owner)!.pos;
        return (
          <path
            key={`walk-${i}`}
            d={arcPath(k.pos, end, R - 24)}
            stroke="var(--fg)"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="none"
            markerEnd="url(#ringHead)"
          />
        );
      })}
      <defs>
        <marker id="ringHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L8 5 L1 9" fill="none" stroke="var(--fg)" strokeWidth="1.6" />
        </marker>
      </defs>

      {keys.map((k, i) => {
        const owner = ownerOfPos(k.pos);
        const [x, y] = at(k.pos, R - 24);
        const big = k.moved || k.focus;
        return (
          <g key={`key-${i}`}>
            <circle cx={x} cy={y} r={big ? 6.5 : 3.6} fill={colors[owner]} stroke={big ? 'var(--fg)' : 'var(--bg)'} strokeWidth={big ? 2 : 1} />
            {k.label && (
              <HandText x={at(k.pos, R - 44)[0]} y={at(k.pos, R - 44)[1]} size={13} halo>
                {k.label}
              </HandText>
            )}
          </g>
        );
      })}

      {ring.map((p, i) => {
        const [x, y] = at(p.pos);
        const [lx, ly] = at(p.pos, R + 30);
        const isDead = dead.includes(p.node);
        return (
          <g key={`pt-${i}`} opacity={isDead ? 0.4 : 1}>
            <circle cx={x} cy={y} r={pointLabels ? 9 : 4.5} fill={colors[p.node]} stroke="var(--bg)" strokeWidth={2} />
            {pointLabels && (
              <HandText x={lx} y={ly} size={17} weight={700} color={isDead ? 'var(--bad)' : 'var(--fg)'}>
                {(letters[p.node] ?? p.node) + (isDead ? ' ✕' : '')}
              </HandText>
            )}
          </g>
        );
      })}
    </SketchSvg>
  );
}

const ALL_NODES = ['cache-A', 'cache-B', 'cache-C', 'cache-D', 'cache-E', 'cache-F'];
const VNODE_CHOICES = [1, 8, 32];
const letterOf = (n: string) => n.slice(-1);

interface Change {
  text: string;
  moved?: number;
  modMoved?: number;
  total: number;
}

interface Props {
  initialServers?: number;
  initialKeys?: number;
  initialVnodes?: number;
}

/**
 * Interactive hash ring. Add or remove servers, add keys, switch virtual nodes.
 * After every change it counts exactly how many keys moved, and how many `hash % N` would have moved.
 */
export default function HashRing({ initialServers = 4, initialKeys = 120, initialVnodes = 1 }: Props) {
  const [servers, setServers] = useState<string[]>(ALL_NODES.slice(0, initialServers));
  const [keyCount, setKeyCount] = useState(initialKeys);
  const [vnodes, setVnodes] = useState(initialVnodes);
  const [moved, setMoved] = useState<Set<number>>(new Set());
  const [change, setChange] = useState<Change | null>(null);

  const keyPos = useMemo(() => Array.from({ length: keyCount }, (_, i) => hash32(keyName(i))), [keyCount]);
  const ring = useMemo(() => buildRing(servers, vnodes), [servers, vnodes]);
  const owners = useMemo(() => keyPos.map((p) => ownerOf(ring, p)), [keyPos, ring]);

  const colors = Object.fromEntries(ALL_NODES.map((n, i) => [n, NODE_COLORS[i]]));
  const letters = Object.fromEntries(ALL_NODES.map((n) => [n, letterOf(n)]));

  const load = servers.map((s) => ({ s, n: owners.filter((o) => o === s).length }));
  const avg = keyCount / Math.max(1, servers.length);
  const busiest = Math.max(0, ...load.map((l) => l.n));

  /** Apply a new server list and measure what moved, for the ring and for hash % N. */
  const apply = (next: string[], text: string) => {
    const nextRing = buildRing(next, vnodes);
    const diff = new Set<number>();
    let mod = 0;
    keyPos.forEach((p, i) => {
      if (ownerOf(nextRing, p) !== owners[i]) diff.add(i);
      if (servers[p % servers.length] !== next[p % next.length]) mod++;
    });
    setServers(next);
    setMoved(diff);
    setChange({ text, moved: diff.size, modMoved: mod, total: keyCount });
  };

  const add = () => {
    const free = ALL_NODES.find((n) => !servers.includes(n));
    if (free) apply([...servers, free], `Added ${free}`);
  };
  const remove = (s: string) => {
    if (servers.length > 1) apply(servers.filter((x) => x !== s), `Removed ${s}`);
  };
  const addKeys = () => {
    setKeyCount((k) => k + 40);
    setMoved(new Set());
    setChange({ text: 'Added 40 keys', total: keyCount + 40 });
  };
  const reset = () => {
    setServers(ALL_NODES.slice(0, initialServers));
    setKeyCount(initialKeys);
    setVnodes(initialVnodes);
    setMoved(new Set());
    setChange(null);
  };
  const changeVnodes = (v: number) => {
    setVnodes(v);
    setMoved(new Set());
    setChange({ text: `Each server now owns ${v} point${v > 1 ? 's' : ''} on the ring`, total: keyCount });
  };

  const keys: RingKeyView[] = keyPos.map((pos, i) => ({ pos, moved: moved.has(i) }));
  const pct = (n: number, t: number) => `${((n / t) * 100).toFixed(1)}%`;

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Hash ring simulator</div>
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,25rem)_1fr]">
        <HashRingView
          points={ring}
          colors={colors}
          letters={letters}
          keys={keys}
          pointLabels={vnodes === 1}
          label={`Hash ring with ${servers.length} servers and ${keyCount} keys`}
        />

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={add} disabled={servers.length >= ALL_NODES.length} className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-40">
              Add server
            </button>
            <button type="button" onClick={addKeys} className="rounded-md border border-line px-3 py-1.5 hover:bg-surface">
              Add 40 keys
            </button>
            <button type="button" onClick={reset} className="text-xs text-accent hover:underline">
              Reset
            </button>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted">Virtual nodes per server</div>
            <div className="inline-flex overflow-hidden rounded-md border border-line text-xs" role="group" aria-label="Virtual nodes per server">
              {VNODE_CHOICES.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={v === vnodes}
                  onClick={() => changeVnodes(v)}
                  className={`px-3 py-1.5 ${v === vnodes ? 'bg-surface font-semibold' : 'text-muted hover:bg-surface'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted">
              Keys per server ({keyCount} keys, ideal {avg.toFixed(1)} each)
            </div>
            <ul className="space-y-1.5">
              {load.map(({ s, n }) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="w-5 font-semibold" style={{ color: colors[s] }}>
                    {letterOf(s)}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-surface">
                    <div className="h-full" style={{ width: `${(n / Math.max(1, busiest)) * 100}%`, background: colors[s], opacity: 0.75 }} />
                  </div>
                  <span className="w-20 text-right tabular-nums">
                    {n} ({pct(n, keyCount)})
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    disabled={servers.length <= 1}
                    aria-label={`Remove ${s}`}
                    className="rounded border border-line px-1.5 text-xs text-muted hover:bg-surface disabled:opacity-30"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-1.5 text-xs text-muted">
              Busiest server: <b className="text-fg">{(busiest / Math.max(avg, 1e-9)).toFixed(2)}×</b> the average
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-3" aria-live="polite">
            {change === null ? (
              <p className="text-muted">Add or remove a server. The ring counts the keys that move. Then it counts how many <code>hash % N</code> would move.</p>
            ) : change.moved === undefined ? (
              <p>{change.text}.</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">{change.text}</p>
                <p>
                  Ring: <b className="text-ok">{change.moved}</b> of {change.total} keys moved ({pct(change.moved, change.total)})
                </p>
                <p>
                  <code>hash % N</code>: <b className="text-bad">{change.modMoved}</b> of {change.total} keys would move ({pct(change.modMoved!, change.total)})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

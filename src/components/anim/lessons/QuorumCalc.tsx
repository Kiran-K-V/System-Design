import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { majority, report } from './quorum';

/** Round trip from the coordinator to each replica, nearest first. Same data center, same region, another coast, across an ocean. */
const RTTS = [0.5, 1, 70, 70, 150, 150, 150, 150, 150];

const PRESETS: { label: string; n: number; w: (n: number) => number; r: (n: number) => number }[] = [
  { label: 'Majority / majority (Raft, etcd)', n: 5, w: majority, r: majority },
  { label: 'ONE / ONE (Cassandra)', n: 3, w: () => 1, r: () => 1 },
  { label: 'QUORUM / QUORUM (Cassandra)', n: 3, w: majority, r: majority },
  { label: 'Write ALL, read ONE', n: 3, w: (n) => n, r: () => 1 },
  { label: 'Write ONE, read ALL', n: 3, w: () => 1, r: (n) => n },
];

function Slider({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Card({ title, value, ok, note }: { title: string; value: string; ok?: boolean; note?: string }) {
  const tone = ok === undefined ? '' : ok ? 'text-ok' : 'text-bad';
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

const ms = (v: number) => `~${v} ms`;

export default function QuorumCalc() {
  const [n, setN] = useState(5);
  const [w, setW] = useState(3);
  const [r, setR] = useState(3);

  const changeN = (v: number) => {
    setN(v);
    setW((x) => Math.min(x, v));
    setR((x) => Math.min(x, v));
  };
  const rep = report(n, w, r, RTTS);

  // Worst case for overlap: the write set takes the first W nodes and the read set takes the last R nodes.
  const writeSet = (i: number) => i < w;
  const readSet = (i: number) => i >= n - r;

  return (
    <CacheWidgetFrame title="Quorum calculator" hint="N replicas, write to W, read from R">
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setN(p.n);
              setW(p.w(p.n));
              setR(p.r(p.n));
            }}
            className="rounded-md border border-line px-2.5 py-1.5 text-left text-xs hover:bg-surface"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="qn" label="Replicas N" value={n} min={1} max={9} onChange={changeN} />
          <Slider id="qw" label="Write quorum W" value={w} min={1} max={n} onChange={setW} />
          <Slider id="qr" label="Read quorum R" value={r} min={1} max={n} onChange={setR} />
          <p className="text-xs text-muted">Majority of {n} is {majority(n)}.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="flex flex-wrap items-end gap-2" role="img" aria-label={`Worst-case write set and read set among ${n} replicas`}>
              {Array.from({ length: n }, (_, i) => {
                const inW = writeSet(i);
                const inR = readSet(i);
                const both = inW && inR;
                const bg = both ? 'var(--ok)' : inW ? 'var(--accent)' : inR ? 'var(--warn)' : 'transparent';
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-line text-xs font-semibold"
                      style={{ background: bg, color: inW || inR ? '#fff' : 'var(--muted)', borderColor: inW || inR ? bg : undefined }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[11px] tabular-nums text-muted">{RTTS[i]} ms</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              <span style={{ color: 'var(--accent)' }}>Blue</span>: written. <span style={{ color: 'var(--warn)' }}>Amber</span>: read. <span style={{ color: 'var(--ok)' }}>Green</span>: both. This is the worst case, where the write
              set and read set are as far apart as possible. Under each node is its round trip from the coordinator.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Card
              title="Does every read see the latest finished write? (R + W > N)"
              value={rep.overlap ? `Yes, ${rep.minShared} shared` : `No (${w} + ${r} ≤ ${n})`}
              ok={rep.overlap}
              note={rep.overlap ? `Any read set shares at least ${rep.minShared} node${rep.minShared === 1 ? '' : 's'} with any write set.` : 'A read can miss every node that has the write.'}
            />
            <Card
              title="Can two writes both succeed on opposite sides of a split? (2W ≤ N)"
              value={rep.writesIntersect ? 'No' : 'Yes'}
              ok={rep.writesIntersect}
              note={rep.writesIntersect ? 'Two write sets always share a node.' : 'Two disjoint groups could each reach W.'}
            />
            <Card title="Failures tolerated" value={`writes ${rep.writeTolerates}, reads ${rep.readTolerates}`} note="Nodes that can be down while the operation still works." />
            <Card title="Latency (W-th and R-th fastest reply)" value={`write ${ms(rep.writeMs)}, read ${ms(rep.readMs)}`} note="You wait for the slowest node you need." />
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

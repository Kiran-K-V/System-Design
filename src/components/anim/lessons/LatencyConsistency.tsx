import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';

type Mode = 'async' | 'semi' | 'sync';

const LOCAL = 1; // ms to commit on the leader (~1 ms, see lesson 1.2)
const NEAR_RTT = 1; // ms to a replica in another zone of the same region (~1 ms)

const MODES: { id: Mode; label: string; blurb: string; tag: string }[] = [
  { id: 'async', label: 'Async', blurb: 'Leader commits and replies at once. Replicas catch up later.', tag: 'PA/EL style: latency wins' },
  { id: 'semi', label: 'Wait for 1 replica', blurb: 'Leader waits for the nearest replica, then replies.', tag: 'in between' },
  { id: 'sync', label: 'Wait for all', blurb: 'Leader waits until every replica has the write.', tag: 'PC/EC style: consistency wins' },
];

export default function LatencyConsistency() {
  const [mode, setMode] = useState<Mode>('async');
  const [rtt, setRtt] = useState(70);

  const write = LOCAL + (mode === 'async' ? 0 : mode === 'semi' ? NEAR_RTT : rtt);
  // After the ack, how long can the far replica still lack the write? One way delay plus apply time.
  const farStale = mode === 'sync' ? 0 : Math.round(rtt / 2 + 1);
  const nearStale = mode === 'async' ? Math.round(NEAR_RTT / 2 + 1) : 0;
  const leaderRead = rtt + 1;
  const max = LOCAL + 220;

  const info = MODES.find((m) => m.id === mode)!;

  return (
    <CacheWidgetFrame title="Latency vs consistency, no partition" hint="1 leader, 2 replicas">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Leader replies to a write after</div>
            <Seg
              label="Replication wait"
              value={mode}
              onChange={setMode}
              options={MODES.map((m) => ({ id: m.id, label: m.label }))}
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">{info.blurb}</p>
          </div>
          <div>
            <label htmlFor="rtt" className="mb-1 flex justify-between text-xs text-muted">
              <span>Round trip to the far replica</span>
              <span className="tabular-nums text-fg">{rtt} ms</span>
            </label>
            <input id="rtt" type="range" min={10} max={200} step={5} value={rtt} onChange={(e) => setRtt(+e.target.value)} className="w-full accent-[var(--accent)]" />
            <p className="mt-1 text-xs text-muted">~70 ms is about one coast to the other. ~150 ms is across an ocean.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Write latency the client sees</div>
            <div className="flex items-center gap-2">
              <div className="h-6 flex-1 overflow-hidden rounded bg-surface">
                <div className="h-full transition-[width] duration-300" style={{ width: `${(write / max) * 100}%`, background: write > 50 ? 'var(--warn)' : 'var(--ok)', opacity: 0.8 }} />
              </div>
              <span className="w-20 text-right font-semibold tabular-nums">~{write} ms</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Read from the far replica right after the ack</div>
              <div className={`text-lg font-semibold tabular-nums ${farStale > 0 ? 'text-warn' : 'text-ok'}`}>{farStale > 0 ? `may be stale for ~${farStale} ms` : 'always fresh'}</div>
              <div className="text-xs text-muted">answers in ~1 ms (local)</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Read from the leader, far client</div>
              <div className="text-lg font-semibold tabular-nums text-ok">always fresh</div>
              <div className="text-xs text-muted">but costs ~{leaderRead} ms</div>
            </div>
          </div>
          <p className="rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">
            <b className="text-fg">{info.tag}.</b>{' '}
            {mode === 'async'
              ? `The near replica may lag by ~${nearStale} ms too. If the leader dies right after the ack, the write can be lost.`
              : mode === 'semi'
                ? 'The write now survives a leader crash, because a second copy exists. The far replica still lags.'
                : `Every replica is current when the client gets its ack. The price: one slow or dead replica (${rtt} ms away) slows or blocks every write.`}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { fairShare } from './Ai7BgMath';

const fmt = (m: number) => (m >= 600 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m * 10) / 10} min`);

/** One noisy tenant and one small tenant share a worker pool. FIFO against fair share. */
export default function Ai7BgFair() {
  const [fair, setFair] = useState(false);
  const [big, setBig] = useState(100);
  const [workers, setWorkers] = useState(4);
  const SMALL = 5;
  const JOB = 6;
  const r = fairShare(big, SMALL, workers, JOB, fair);

  return (
    <CacheWidgetFrame title="A noisy tenant in a shared queue" hint="tenant B submits 5 runs of 6 minutes, right after tenant A's burst">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Order</span>
            <Seg label="Scheduling" value={fair ? 'fair' : 'fifo'} onChange={(v) => setFair(v === 'fair')} options={[{ id: 'fifo', label: 'First in, first out' }, { id: 'fair', label: 'Fair share' }]} />
          </div>
          <div>
            <label htmlFor="a77-big" className="mb-1 flex justify-between text-xs text-muted">
              <span>Tenant A burst (runs)</span>
              <span className="tabular-nums text-fg">{big}</span>
            </label>
            <input id="a77-big" type="range" min={5} max={400} step={5} value={big} onChange={(e) => setBig(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a77-w" className="mb-1 flex justify-between text-xs text-muted">
              <span>Workers</span>
              <span className="tabular-nums text-fg">{workers}</span>
            </label>
            <input id="a77-w" type="range" min={1} max={20} step={1} value={workers} onChange={(e) => setWorkers(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <p className="text-xs text-muted">Model: every run takes one worker for 6 minutes, and run i starts at floor(i / workers) x 6 minutes. Fair share takes one run from each tenant in turn.</p>
        </div>
        <div className="space-y-3" aria-live="polite">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Tenant B, mean wait</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: r.meanSmall > 30 ? 'var(--bad)' : 'var(--ok)' }}>{fmt(r.meanSmall)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Tenant B, worst wait</div>
              <div className="text-lg font-semibold tabular-nums">{fmt(r.maxSmall)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Tenant A, mean wait</div>
              <div className="text-lg font-semibold tabular-nums">{fmt(r.meanBig)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Last run starts at</div>
              <div className="text-lg font-semibold tabular-nums">{fmt(r.lastStart)}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Fair share does not add capacity. The last run starts at the same time in both modes. It moves the wait from the small tenant to the one that caused the burst.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

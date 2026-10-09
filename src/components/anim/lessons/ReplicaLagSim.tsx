import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { readOutcome, type Policy } from './replicaLag';

const AXIS = 3000; // ms shown on the time axis

const POLICIES: { id: Policy; label: string; blurb: string }[] = [
  { id: 'any', label: 'Any follower', blurb: 'The router picks a follower at random for every read. This is the naive setup.' },
  {
    id: 'leader-window',
    label: 'Leader for a while',
    blurb: 'After a user writes, send that user’s reads to the leader for a fixed window. After the window, use followers again.',
  },
  {
    id: 'token',
    label: 'Position token',
    blurb: 'The write returns its log position. A follower may serve the read only if it has applied that position. Otherwise the read goes to the leader.',
  },
];

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value} ms</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function ReplicaLagSim() {
  const [policy, setPolicy] = useState<Policy>('any');
  const [lag1, setLag1] = useState(80);
  const [lag2, setLag2] = useState(1200);
  const [delay, setDelay] = useState(300);
  const [win, setWin] = useState(1000);

  const o = readOutcome(policy, [lag1, lag2], delay, win);
  const info = POLICIES.find((p) => p.id === policy)!;
  const x = (ms: number) => `${(Math.min(ms, AXIS) / AXIS) * 100}%`;

  const rows = [
    { name: 'Leader', lag: 0, behind: false },
    { name: 'Follower 1', lag: lag1, behind: o.followers[0].behind },
    { name: 'Follower 2', lag: lag2, behind: o.followers[1].behind },
  ];

  return (
    <CacheWidgetFrame title="Replica lag and one user's reload" hint="1 leader, 2 followers">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Where the user’s next read goes</div>
            <Seg label="Read routing policy" value={policy} onChange={setPolicy} options={POLICIES.map((p) => ({ id: p.id, label: p.label }))} />
            <p className="mt-2 text-xs leading-relaxed text-muted">{info.blurb}</p>
          </div>
          <Slider id="lag1" label="Follower 1 lag" value={lag1} min={0} max={AXIS} step={20} onChange={setLag1} />
          <Slider id="lag2" label="Follower 2 lag" value={lag2} min={0} max={AXIS} step={20} onChange={setLag2} />
          <Slider id="delay" label="User reads this long after the write" value={delay} min={0} max={AXIS} step={20} onChange={setDelay} />
          {policy === 'leader-window' && <Slider id="win" label="Leader window" value={win} min={0} max={AXIS} step={100} onChange={setWin} />}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="relative space-y-2" role="img" aria-label="Timeline: when each replica applies the write, and when the user reads">
              {rows.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted">{r.name}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: x(r.lag), background: 'var(--bad)', opacity: 0.28 }} />
                    <div className="absolute inset-y-0 right-0 transition-[left] duration-200" style={{ left: x(r.lag), background: 'var(--ok)', opacity: 0.35 }} />
                  </div>
                </div>
              ))}
              <div className="pointer-events-none absolute inset-y-0 left-[5.5rem] right-0">
                <div className="absolute inset-y-0 w-0.5 bg-accent transition-[left] duration-200" style={{ left: x(delay) }} />
              </div>
            </div>
            <div className="ml-[5.5rem] mt-1 flex justify-between text-[11px] tabular-nums text-muted">
              <span>write commits (0)</span>
              <span>{AXIS / 1000} s</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Red: the replica has not applied the write. Green: it has. The blue line is the user’s read.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Chance the user sees the OLD value</div>
              <div className={`text-lg font-semibold tabular-nums ${o.pStale > 0 ? 'text-bad' : 'text-ok'}`}>{pct(o.pStale)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Chance the leader serves the read</div>
              <div className="text-lg font-semibold tabular-nums">{pct(o.pLeader)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Follower 1 / Follower 2 at read time</div>
              <div className="text-sm font-semibold">
                <span className={o.followers[0].behind ? 'text-bad' : 'text-ok'}>{o.followers[0].behind ? 'behind' : 'current'}</span>
                {' / '}
                <span className={o.followers[1].behind ? 'text-bad' : 'text-ok'}>{o.followers[1].behind ? 'behind' : 'current'}</span>
              </div>
            </div>
          </div>
          <p className="rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">
            {policy === 'any' &&
              (o.pStale > 0
                ? 'The user saves, the page reloads, and the old value shows. Nothing is broken. The follower simply has not replayed the record yet.'
                : 'Both followers applied the write before the read. Lower the read delay or raise a lag to see a stale read.')}
            {policy === 'leader-window' &&
              (delay < win
                ? 'The read falls inside the window, so the leader answers. The user always sees their own write. The leader carries extra read load.'
                : 'The read is after the window, so a follower answers again. If a follower still lags past the window, a stale read comes back.')}
            {policy === 'token' &&
              (o.pLeader > 0
                ? 'A follower that has not reached the token cannot answer. The read goes to the leader (or waits). Never stale, at the cost of extra leader reads.'
                : 'Both followers passed the token position, so followers serve the read. Never stale, and the leader stays idle.')}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

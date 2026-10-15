import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { fanoutCost } from './realTimeFanout';

const SIZES = [5, 50, 500, 5_000, 50_000];
const fmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(+n.toFixed(n < 10 ? 1 : 0)));

/** Internal messages needed to deliver one event to a channel. The math is in realTimeFanout.ts. */
export default function RealTimeUpdatesFanout() {
  const [members, setMembers] = useState(500);
  const [servers, setServers] = useState(50);
  const [rate, setRate] = useState(10);
  const c = fanoutCost(servers, members);
  const rows = [
    { name: 'Every server gets every event (one global topic)', n: c.broadcastAll },
    { name: 'Servers subscribe per channel', n: c.perChannelTopic },
    { name: 'One internal message per member', n: c.perUser },
  ];
  const top = Math.max(...rows.map((r) => r.n));
  return (
    <CacheWidgetFrame title="Internal messages for one event" hint="members spread at random over servers">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Members watching the channel</div>
            <Seg label="Channel size" value={members} onChange={setMembers} options={SIZES.map((s) => ({ id: s, label: fmt(s) }))} />
          </div>
          <div>
            <label htmlFor="rt-servers" className="mb-1 flex justify-between text-xs text-muted">
              <span>Connection servers</span>
              <span className="tabular-nums text-fg">{servers}</span>
            </label>
            <input id="rt-servers" type="range" min={2} max={200} step={1} value={servers} onChange={(e) => setServers(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="rt-rate" className="mb-1 flex justify-between text-xs text-muted">
              <span>Events per second in this channel</span>
              <span className="tabular-nums text-fg">{rate}</span>
            </label>
            <input id="rt-rate" type="range" min={1} max={100} step={1} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="space-y-2" role="img" aria-label="Bar chart of internal messages per event for three fan-out designs">
              {rows.map((r, i) => (
                <div key={r.name}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-muted">{r.name}</span>
                    <span className="tabular-nums">{fmt(r.n)} per event, {fmt(r.n * rate)}/s</span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded bg-bg">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${(r.n / top) * 100}%`, background: i === 1 ? 'var(--accent)' : 'var(--muted)', opacity: i === 1 ? 0.8 : 0.4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">
            {members <= servers / 4
              ? `The channel is small, so most servers have no member. Per-channel subscriptions send ${fmt(c.perChannelTopic)} messages. A global topic wastes ${fmt(c.broadcastAll - c.perChannelTopic)} of its ${fmt(c.broadcastAll)}.`
              : members >= servers * 4
                ? `The channel is big: nearly every server holds a member, so per-channel topics send almost as many messages as a global one (${fmt(c.perChannelTopic)} of ${fmt(c.broadcastAll)}). The cost that matters is now each server writing to its own sockets, ${fmt(members / servers)} per server per event.`
                : `A medium channel. Per-channel subscriptions reach ${fmt(c.perChannelTopic)} of ${fmt(servers)} servers.`}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Model: each member sits on a uniformly random server. Expected servers with at least one member = S x (1 - (1 - 1/S)^m). Real placement is rarely uniform (a friend group may share a server), so treat this as the typical case.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

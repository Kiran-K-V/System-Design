import { useState } from 'react';
import { WidgetFrame } from '../data-kit';

/**
 * A gateway dies and N clients reconnect.
 * Pure math, no randomness: without jitter every client retries at the same instant.
 * With full jitter each client waits a uniform random time in [0, window], so the expected arrival rate is N / window.
 */

const BUCKETS = 15;

const fmt = (n: number) => n.toLocaleString('en-US');

export function stormStats(clients: number, windowSec: number, capacity: number) {
  const spikeRate = clients; // all in the same second
  const flatRate = clients / windowSec;
  return {
    spikeRate,
    flatRate,
    spikeDrain: clients / capacity, // seconds to accept everyone at `capacity`/s
    flatOverload: flatRate / capacity,
    spikeOverload: spikeRate / capacity,
  };
}

export default function ReconnectStorm() {
  const [clients, setClients] = useState(100_000);
  const [windowSec, setWindowSec] = useState(30);
  const [capacity, setCapacity] = useState(5_000);
  const st = stormStats(clients, windowSec, capacity);

  const spike = Array.from({ length: BUCKETS }, (_, i) => (i === 0 ? clients : 0));
  const flat = Array.from({ length: BUCKETS }, () => clients / BUCKETS);
  const maxV = clients;

  const Chart = ({ vals, title, color, rateNote }: { vals: number[]; title: string; color: string; rateNote: string }) => (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="font-mono text-xs tabular-nums text-muted">{rateNote}</span>
      </div>
      <div className="mt-1 flex h-20 items-end gap-0.5 rounded bg-surface px-1 pt-1" role="img" aria-label={title}>
        {vals.map((v, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(1, (v / maxV) * 100)}%`, background: v ? color : 'transparent' }} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>0 s</span>
        <span>{windowSec} s</span>
      </div>
    </div>
  );

  return (
    <WidgetFrame
      title="Reconnect storm: what happens when a gateway dies"
      caption={
        <>
          Without jitter, all {fmt(clients)} clients arrive in the same second: <strong>{st.spikeOverload.toFixed(1)}x</strong> what the survivors accept per second. With jitter over {windowSec} s the
          expected rate is {fmt(Math.round(st.flatRate))} per second, <strong>{st.flatOverload.toFixed(2)}x</strong> capacity.
          {st.flatOverload > 1 ? ' Still above capacity: widen the window or add gateways.' : ' Under capacity: the survivors absorb it.'}
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Clients on the dead gateway</span>
            <span className="font-mono tabular-nums">{fmt(clients)}</span>
          </span>
          <input type="range" min={1000} max={1_000_000} step={1000} value={clients} onChange={(e) => setClients(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Jitter window</span>
            <span className="font-mono tabular-nums">{windowSec} s</span>
          </span>
          <input type="range" min={1} max={120} value={windowSec} onChange={(e) => setWindowSec(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>New connections accepted per second (your assumption)</span>
            <span className="font-mono tabular-nums">{fmt(capacity)}</span>
          </span>
          <input type="range" min={500} max={50_000} step={500} value={capacity} onChange={(e) => setCapacity(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Chart vals={spike} title="No jitter: everyone retries together" color="var(--bad)" rateNote={`${fmt(st.spikeRate)} arrivals in 1 s`} />
        <Chart vals={flat} title="Full jitter: spread over the window" color="var(--ok)" rateNote={`~${fmt(Math.round(st.flatRate))} per s`} />
      </div>
    </WidgetFrame>
  );
}
